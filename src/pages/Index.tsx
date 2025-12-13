import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Clock, Plus, UserPlus, Save, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ShiftCalendar from "@/components/ShiftCalendar";
import AddShiftDialog from "@/components/AddShiftDialog";
import EditShiftDialog from "@/components/EditShiftDialog";
import EmployeeList from "@/components/EmployeeList";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MonthlyWorkHours from "@/components/MonthlyWorkHours";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Employee {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type?: 'work' | 'off';
}

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appTitle, setAppTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 認証状態の確認
  useEffect(() => {
    // 認証リスナーをセットアップ
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // 既存のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load data from Supabase on mount and set up real-time subscriptions
  useEffect(() => {
    if (user) {
      loadData();

      // Set up real-time subscriptions for employees
      const employeesChannel = supabase
        .channel('employees-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'employees' },
          () => {
            loadData();
          }
        )
        .subscribe();

      // Set up real-time subscriptions for shifts
      const shiftsChannel = supabase
        .channel('shifts-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shifts' },
          () => {
            loadData();
          }
        )
        .subscribe();

      // Set up real-time subscriptions for notes
      const notesChannel = supabase
        .channel('notes-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notes' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(employeesChannel);
        supabase.removeChannel(shiftsChannel);
        supabase.removeChannel(notesChannel);
      };
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('position', { ascending: true });

      if (employeesError) throw employeesError;
      
      if (employeesData) {
        setEmployees(employeesData.map(emp => ({
          id: emp.id,
          name: emp.name
        })));
      }

      // Load shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*');

      if (shiftsError) throw shiftsError;

      if (shiftsData) {
        setShifts(shiftsData.map(shift => ({
          id: shift.id,
          employeeId: shift.employee_id,
          date: new Date(shift.date + 'T00:00:00'),
          startTime: shift.start_time,
          endTime: shift.end_time,
          type: shift.type as 'work' | 'off'
        })));
      }

      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .limit(1)
        .single();

      if (notesError && notesError.code !== 'PGRST116') throw notesError;

      if (notesData) {
        setNotes(notesData.content || '');
        setNotesId(notesData.id);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
      toast.error(t('toast.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSaveData = async () => {
    toast.success(t('toast.dataAutoSaved'));
  };

  const handleAddShift = async (newShifts: Omit<Shift, "id">[]) => {
    try {
      // 日付を正しくフォーマット（タイムゾーンのずれを防ぐ）
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // 既存のシフトをチェックして、同じ従業員・同じ日のシフトがあれば削除
      const shiftsToDelete = newShifts.map(shift => ({
        employeeId: shift.employeeId,
        date: formatDate(shift.date)
      }));

      // 削除対象のシフトIDを取得
      const deletePromises = shiftsToDelete.map(async ({ employeeId, date }) => {
        const { data: existingShifts } = await supabase
          .from('shifts')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('date', date);
        
        if (existingShifts && existingShifts.length > 0) {
          await supabase
            .from('shifts')
            .delete()
            .eq('employee_id', employeeId)
            .eq('date', date);
        }
      });

      await Promise.all(deletePromises);

      const shiftsToInsert = newShifts.map(shift => ({
        employee_id: shift.employeeId,
        date: formatDate(shift.date),
        start_time: shift.startTime,
        end_time: shift.endTime,
        type: shift.type || 'work'
      }));

      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const newShiftsWithIds = data.map(shift => ({
          id: shift.id,
          employeeId: shift.employee_id,
          date: new Date(shift.date + 'T00:00:00'),
          startTime: shift.start_time,
          endTime: shift.end_time,
          type: shift.type as 'work' | 'off'
        }));
        
        // 既存のシフトから削除されたものを除外して、新しいシフトを追加
        const remainingShifts = shifts.filter(s => {
          const shiftDate = formatDate(s.date);
          return !shiftsToDelete.some(d => d.employeeId === s.employeeId && d.date === shiftDate);
        });
        
        setShifts([...remainingShifts, ...newShiftsWithIds]);
        toast.success(t('toast.shiftAdded'));
      }
    } catch (error) {
      console.error('シフトの追加に失敗しました:', error);
      toast.error(t('toast.shiftAdded'));
    }
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsEditDialogOpen(true);
  };

  const handleUpdateShift = async (updatedShift: Shift) => {
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const { error } = await supabase
        .from('shifts')
        .update({
          employee_id: updatedShift.employeeId,
          date: formatDate(updatedShift.date),
          start_time: updatedShift.startTime,
          end_time: updatedShift.endTime,
          type: updatedShift.type || 'work'
        })
        .eq('id', updatedShift.id);

      if (error) throw error;

      setShifts(shifts.map(s => (s.id === updatedShift.id ? updatedShift : s)));
    } catch (error) {
      console.error('シフトの更新に失敗しました:', error);
      toast.error(t('toast.shiftUpdated'));
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      setShifts(shifts.filter(s => s.id !== shiftId));
    } catch (error) {
      console.error('シフトの削除に失敗しました:', error);
      toast.error(t('toast.shiftDeleted'));
    }
  };

  const handleAddEmployee = async (employee: Omit<Employee, "id">) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          name: employee.name,
          position: employees.length
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEmployees([...employees, { id: data.id, name: data.name }]);
      }
    } catch (error) {
      console.error('従業員の追加に失敗しました:', error);
      toast.error(t('toast.employeeAdded'));
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (window.confirm(`${employee?.name}${t('confirmDelete')}`)) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) throw error;

        setEmployees(employees.filter(e => e.id !== employeeId));
        setShifts(shifts.filter(s => s.employeeId !== employeeId));
      } catch (error) {
        console.error('従業員の削除に失敗しました:', error);
        toast.error(t('toast.employeeDeleted'));
      }
    }
  };

  const handleMoveEmployee = async (employeeId: string, direction: 'up' | 'down') => {
    const index = employees.findIndex((e) => e.id === employeeId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= employees.length) return;
    
    const newEmployees = [...employees];
    [newEmployees[index], newEmployees[newIndex]] = [newEmployees[newIndex], newEmployees[index]];
    
    try {
      // Update positions in database
      const updates = newEmployees.map((emp, idx) => ({
        id: emp.id,
        position: idx
      }));

      for (const update of updates) {
        await supabase
          .from('employees')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      setEmployees(newEmployees);
    } catch (error) {
      console.error('従業員の順序変更に失敗しました:', error);
      toast.error(t('toast.employeeDeleted'));
    }
  };

  const handleNotesChange = async (newNotes: string) => {
    setNotes(newNotes);
    
    try {
      if (notesId) {
        await supabase
          .from('notes')
          .update({ content: newNotes, updated_at: new Date().toISOString() })
          .eq('id', notesId);
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ content: newNotes }])
          .select()
          .single();

        if (error) throw error;
        if (data) setNotesId(data.id);
      }
    } catch (error) {
      console.error('メモの保存に失敗しました:', error);
    }
  };

  const getTotalShifts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate >= today;
    }).length;
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success(t('toast.logoutSuccess'));
      navigate("/auth");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast.error(t('toast.logoutFailed'));
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("セッションが見つかりません");
        return;
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'アカウントの削除に失敗しました');
      }

      toast.success("アカウントが削除されました");
      navigate("/auth");
    } catch (error) {
      console.error("アカウント削除エラー:", error);
      toast.error("アカウントの削除に失敗しました");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-xl sm:text-2xl font-bold text-foreground bg-transparent border-b-2 border-primary focus:outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {appTitle || t('appTitle')}
                </h1>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <LanguageSwitcher />
              <Button 
                onClick={() => setIsDeleteAccountDialogOpen(true)} 
                variant="outline" 
                className="gap-1 sm:gap-2 text-xs sm:text-sm text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">アカウント削除</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
              <Button onClick={handleSaveData} variant="outline" className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('save')}</span>
                <span className="sm:hidden">{t('save')}</span>
              </Button>
              <Button onClick={() => setIsAddEmployeeDialogOpen(true)} variant="outline" className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('addEmployee')}</span>
                <span className="sm:hidden">{t('employee')}</span>
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('addShift')}</span>
                <span className="sm:hidden">{t('addShift')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('employeeCount')}</p>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('todayShifts')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    shifts.filter((shift) => {
                      const today = new Date();
                      const shiftDate = new Date(shift.date);
                      return (
                        shiftDate.getDate() === today.getDate() &&
                        shiftDate.getMonth() === today.getMonth() &&
                        shiftDate.getFullYear() === today.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        <MonthlyWorkHours 
          employees={employees}
          shifts={shifts}
          currentMonth={currentMonth}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ShiftCalendar 
              shifts={shifts} 
              employees={employees} 
              onEditShift={handleEditShift}
              notes={notes}
              onNotesChange={setNotes}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
            />
          </div>
          <div>
            <EmployeeList 
              employees={employees} 
              onDeleteEmployee={handleDeleteEmployee}
              onMoveEmployee={handleMoveEmployee}
            />
          </div>
        </div>
      </main>

      <AddShiftDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddShift={handleAddShift}
        employees={employees}
      />

      <EditShiftDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateShift={handleUpdateShift}
        onDeleteShift={handleDeleteShift}
        shift={selectedShift}
        employees={employees}
      />

      <AddEmployeeDialog
        open={isAddEmployeeDialogOpen}
        onOpenChange={setIsAddEmployeeDialogOpen}
        onAddEmployee={handleAddEmployee}
      />

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アカウントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。アカウントを削除すると、同じメールアドレスで再度登録できるようになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
