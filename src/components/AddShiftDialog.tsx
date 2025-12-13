import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { Employee, Shift } from "@/pages/Index";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VoiceInputButton from "./VoiceInputButton";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useTranslation } from "react-i18next";

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddShift: (shifts: Omit<Shift, "id">[]) => void;
  employees: Employee[];
}

const AddShiftDialog = ({ open, onOpenChange, onAddShift, employees }: AddShiftDialogProps) => {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dates, setDates] = useState<Date[] | undefined>();
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [shiftType, setShiftType] = useState<'work' | 'off'>('work');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [weekdayClickCount, setWeekdayClickCount] = useState<number>(0);
  const [weekendClickCount, setWeekendClickCount] = useState<number>(0);

  const handleVoiceTranscript = async (transcript: string) => {
    setIsProcessingVoice(true);
    try {
      toast.info(t('toast.voiceAnalyzing'));
      
      const { data, error } = await supabase.functions.invoke('parse-shift-voice', {
        body: { text: transcript }
      });

      if (error) throw error;

      console.log("Parsed shift data:", data);

      // 従業員名からIDを検索
      const employee = employees.find(e => 
        e.name.includes(data.employeeName) || data.employeeName.includes(e.name)
      );

      if (!employee) {
        toast.error(`${t('toast.employeeNotFound')}: ${data.employeeName}`);
        return;
      }

      // 削除アクションの場合
      if (data.action === 'delete') {
        await handleVoiceDelete(employee.id, data.dates);
        return;
      }

      // 追加アクションの場合
      setSelectedEmployee(employee.id);
      
      // 日付の設定
      const parsedDates = data.dates.map((d: string) => new Date(d));
      setDates(parsedDates);

      // 休みかどうか
      if (data.isOff) {
        setShiftType('off');
      } else {
        setShiftType('work');
        if (data.startTime) setStartTime(data.startTime);
        if (data.endTime) setEndTime(data.endTime);
      }

      toast.success(t('toast.voiceSetSuccess'));
    } catch (error) {
      console.error("音声処理エラー:", error);
      toast.error(t('toast.voiceAnalyzeFailed'));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleVoiceDelete = async (employeeId: string, dates: string[]) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      
      // 全削除の場合（dates が空配列）
      if (dates.length === 0) {
        const confirmed = window.confirm(`${employee?.name}のシフトを全て削除しますか？`);
        if (!confirmed) {
          setIsProcessingVoice(false);
          return;
        }

        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('employee_id', employeeId);

        if (error) throw error;
        toast.success(`${employee?.name}のシフトを全て削除しました`);
      } else {
        // 特定の日付のシフトを削除
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const formattedDates = dates.map(d => formatDate(new Date(d)));
        
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('employee_id', employeeId)
          .in('date', formattedDates);

        if (error) throw error;
        toast.success(`${employee?.name}の${dates.length}件のシフトを削除しました`);
      }

      // ダイアログを閉じる
      onOpenChange(false);
    } catch (error) {
      console.error("シフト削除エラー:", error);
      toast.error('シフトの削除に失敗しました');
    }
  };

  const selectWeekdays = () => {
    // 既存の日付がある場合は追加、ない場合は新規作成
    const currentDates = dates || [];
    const weeksToAdd = currentDates.length === 0 ? 1 : 1;
    const startWeekOffset = weekdayClickCount;
    
    const newWeekdays: Date[] = [];
    const today = new Date();
    
    for (let week = 0; week < weeksToAdd; week++) {
      const weekOffset = startWeekOffset + week;
      const targetWeekStart = addDays(today, weekOffset * 7);
      const start = startOfWeek(targetWeekStart, { weekStartsOn: 1 }); // 月曜日を週の開始とする
      
      // 月曜日(0)から金曜日(4)まで
      for (let i = 0; i < 5; i++) {
        newWeekdays.push(addDays(start, i));
      }
    }
    
    // 既存の日付と新しい日付を結合（重複を除く）
    const allDates = [...currentDates, ...newWeekdays];
    const uniqueDates = allDates.filter((date, index, self) => 
      index === self.findIndex(d => d.getTime() === date.getTime())
    ).sort((a, b) => a.getTime() - b.getTime());
    
    setDates(uniqueDates);
    setWeekdayClickCount(weekdayClickCount + 1);
    setWeekendClickCount(0); // 週末カウントをリセット
  };

  const selectWeekend = () => {
    // 既存の日付がある場合は追加、ない場合は新規作成
    const currentDates = dates || [];
    const weeksToAdd = currentDates.length === 0 ? 1 : 1;
    const startWeekOffset = weekendClickCount;
    
    const newWeekends: Date[] = [];
    const today = new Date();
    
    for (let week = 0; week < weeksToAdd; week++) {
      const weekOffset = startWeekOffset + week;
      const targetWeekStart = addDays(today, weekOffset * 7);
      const start = startOfWeek(targetWeekStart, { weekStartsOn: 1 }); // 月曜日を週の開始とする
      
      // 土曜日(5)と日曜日(6)
      newWeekends.push(addDays(start, 5)); // 土曜日
      newWeekends.push(addDays(start, 6)); // 日曜日
    }
    
    // 既存の日付と新しい日付を結合（重複を除く）
    const allDates = [...currentDates, ...newWeekends];
    const uniqueDates = allDates.filter((date, index, self) => 
      index === self.findIndex(d => d.getTime() === date.getTime())
    ).sort((a, b) => a.getTime() - b.getTime());
    
    setDates(uniqueDates);
    setWeekendClickCount(weekendClickCount + 1);
    setWeekdayClickCount(0); // 平日カウントをリセット
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !dates || dates.length === 0) {
      toast.error(t('toast.fillAllFields'));
      return;
    }

    // 勤務シフトの場合は時刻を検証
    if (shiftType === 'work') {
      const shiftSchema = z.object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/, t('toast.invalidTimeFormat')),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, t('toast.invalidTimeFormat')),
      }).refine(data => {
        const [startHour, startMin] = data.startTime.split(':').map(Number);
        const [endHour, endMin] = data.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return startMinutes < endMinutes;
      }, {
        message: t('toast.endTimeAfterStart')
      });

      const validation = shiftSchema.safeParse({ startTime, endTime });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    const shifts = dates.map(date => {
      // 日付をローカルタイムゾーンで正しく処理
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      return {
        employeeId: selectedEmployee,
        date: localDate,
        startTime: shiftType === 'work' ? startTime : '',
        endTime: shiftType === 'work' ? endTime : '',
        type: shiftType,
      };
    });

    onAddShift(shifts);

    toast.success(`${dates.length}${t('shiftAdded')}`);
    setSelectedEmployee("");
    setDates(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setShiftType('work');
    setWeekdayClickCount(0);
    setWeekendClickCount(0);
    onOpenChange(false);
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('addShift')}</DialogTitle>
            <VoiceInputButton 
              onTranscript={handleVoiceTranscript} 
              disabled={isProcessingVoice}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('voiceInputHint')}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('employee')}</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('date')}</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectWeekdays}
                className="flex-1"
              >
                {t('weekdays')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectWeekend}
                className="flex-1"
              >
                {t('weekend')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDates(undefined);
                  setWeekdayClickCount(0);
                  setWeekendClickCount(0);
                }}
                className="flex-1"
              >
                {t('clear')}
              </Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dates && dates.length > 0 
                    ? `${dates.length}${t('datesSelected')}` 
                    : t('selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="multiple" 
                  selected={dates} 
                  onSelect={setDates} 
                  locale={ja}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dates && dates.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('selectedDates')}: {dates.map(d => format(d, "M/d")).join(", ")}
              </div>
            )}
          </div>

          {shiftType === 'work' && (
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('startTime')}</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('endTime')}</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('add')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddShiftDialog;
