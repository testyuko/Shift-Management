import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Maximize2, Printer } from "lucide-react";
import { Employee, Shift } from "@/pages/Index";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { z } from "zod";
import DayStaffListDialog from "./DayStaffListDialog";
import PrintPreviewDialog from "./PrintPreviewDialog";
import { useTranslation } from "react-i18next";

interface ShiftCalendarProps {
  shifts: Shift[];
  employees: Employee[];
  onEditShift: (shift: Shift) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

const ShiftCalendar = ({ shifts, employees, onEditShift, notes, onNotesChange, currentMonth, setCurrentMonth }: ShiftCalendarProps) => {
  const { t } = useTranslation();
  const currentDate = currentMonth;
  const setCurrentDate = setCurrentMonth;
  const [viewMode, setViewMode] = useState<"month" | "table">("month");
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayStaffDialogOpen, setIsDayStaffDialogOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const expandedTableScrollRef = useRef<HTMLDivElement>(null);

  const notesSchema = z.string().max(2000, t('toast.notesMaxLength'));

  const handleNotesChange = (value: string) => {
    try {
      notesSchema.parse(value);
      onNotesChange(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  const scrollTable = (direction: "left" | "right", ref?: React.RefObject<HTMLDivElement>) => {
    const targetRef = ref || tableScrollRef;
    if (targetRef.current) {
      const scrollAmount = 300;
      targetRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getStaffCountForDate = (date: Date, period: 'morning' | 'afternoon') => {
    const dayShifts = shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      const isSameDate = shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear();
      
      if (!isSameDate || shift.type === 'off') return false;
      
      const startHour = parseInt(shift.startTime.split(':')[0]);
      const endHour = parseInt(shift.endTime.split(':')[0]);
      
      if (period === 'morning') {
        return startHour < 12;
      } else {
        return endHour >= 12;
      }
    });
    
    return dayShifts.length;
  };

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const renderPrintContent = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold text-center mb-4 text-black">
          {title || t('shiftTable')}
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-2 border-black bg-gray-100 font-semibold text-black p-2 text-sm">
                {t('staff')}
              </th>
              {getMonthDaysForTable().map((date, index) => {
                if (!date) {
                  return (
                    <th key={index} className="border-2 border-black bg-gray-100 p-2 text-xs">
                      <div className="text-center whitespace-nowrap">
                        <div className="text-gray-400 text-[10px]">-</div>
                        <div className="font-semibold text-gray-400">{index + 1}</div>
                      </div>
                    </th>
                  );
                }
                
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                
                return (
                  <th
                    key={index}
                    className={`border-2 border-black p-2 text-xs ${
                      (isSunday || isSaturday) ? "weekend" : "bg-gray-100"
                    } ${isSunday ? "sunday" : isSaturday ? "saturday" : "text-black"}`}
                  >
                    <div className="text-center whitespace-nowrap">
                      <div className="text-[10px]">
                        {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')][dayOfWeek]}
                      </div>
                      <div className="font-semibold text-sm">{date.getDate()}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="border-2 border-black bg-white font-medium text-black p-2 text-sm">
                  <div className="flex items-center whitespace-nowrap">
                    <span>{employee.name}</span>
                  </div>
                </td>
                {getMonthDaysForTable().map((date, index) => {
                  if (!date) {
                    return (
                      <td key={index} className="border-2 border-black text-center bg-white p-1" />
                    );
                  }
                  
                  const shift = getShiftForEmployeeAndDate(employee.id, date);
                  const dayOfWeek = date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  
                  return (
                    <td
                      key={index}
                      className={`border-2 border-black text-center p-1 ${
                        (isSunday || isSaturday) ? "weekend" : "bg-white"
                      }`}
                    >
                      {shift && (
                        shift.type === 'off' ? (
                          <div className="text-black font-bold text-sm">
                            {t('off')}
                          </div>
                        ) : (
                          <div className="text-black whitespace-nowrap text-[10px]">
                            <div className="font-semibold">{formatTime(shift.startTime)}</div>
                            <div className="text-gray-400 text-[8px]">-</div>
                            <div className="font-semibold">{formatTime(shift.endTime)}</div>
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td className="border-2 border-black font-bold text-black p-2 text-sm">
                {t('staffCount')}
              </td>
              {getMonthDaysForTable().map((date, index) => {
                if (!date) {
                  return (
                    <td key={index} className="border-2 border-black text-center bg-white p-1" />
                  );
                }
                
                const morningCount = getStaffCountForDate(date, 'morning');
                const afternoonCount = getStaffCountForDate(date, 'afternoon');
                
                return (
                  <td key={index} className="border-2 border-black text-center bg-gray-100 p-1">
                    <div className="text-black font-semibold text-[11px]">
                      <div>{t('am')} {morningCount}</div>
                      <div className="text-gray-400 text-[8px]">-</div>
                      <div>{t('pm')} {afternoonCount}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderTableContent = (isExpanded: boolean = false) => {
    const scrollRef = isExpanded ? expandedTableScrollRef : tableScrollRef;
    
    return (
      <>
        {!isExpanded && (
          <>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="text-2xl font-bold text-center mb-4 text-foreground print:text-black border-2 border-primary rounded px-2 py-1 w-full max-w-md mx-auto block"
                autoFocus
              />
            ) : (
              <h2 
                className="text-2xl font-bold text-center mb-4 text-foreground print:text-black cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                onClick={() => setIsEditingTitle(true)}
                title={t('clickToEdit')}
              >
                {title || t('shiftTable')}
              </h2>
            )}
          </>
        )}
        {isExpanded && (
          <h2 className="text-2xl font-bold text-center mb-4 text-foreground print:text-black">
            {title || t('shiftTable')}
          </h2>
        )}
        {/* トップページの印刷ボタンは完全に削除！ */}
        {!isExpanded && (
          <div className="flex items-center gap-2 mb-2 print:hidden">
            <Button variant="outline" size="icon" onClick={() => scrollTable("left", scrollRef)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollTable("right", scrollRef)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* 印刷ボタンは削除したので何も書かない！ */}
            <Button variant="outline" size="sm" onClick={() => setIsTableExpanded(true)} className="ml-auto">
              <Maximize2 className="h-4 w-4 mr-2" />
              {t('expand')}
            </Button>
          </div>
        )}
        <div ref={scrollRef} className={`w-full border rounded-lg ${!isExpanded ? "overflow-x-auto" : ""} print:overflow-visible print:border-2 print:border-black`}>
          <table className={`border-collapse ${!isExpanded ? "min-w-max" : "w-full table-fixed"} print:w-full print:border-collapse`}>
            <thead>
              <tr>
                <th className={`${isExpanded ? "" : "sticky left-0 z-20"} bg-card border border-border print:border-2 print:border-black font-semibold text-foreground print:text-black ${isExpanded ? "w-24 p-2 text-3xl" : "w-[120px] p-2 text-3xl"}`}>
                  {t('staff')}
                </th>
                {getMonthDaysForTable().map((date, index) => {
                  if (!date) {
                    return (
                      <th
                        key={index}
                        className={`border border-border print:border-2 print:border-black bg-muted/30 ${isExpanded ? "p-1 text-xs" : "p-2 text-xs w-[70px]"} print:bg-white`}
                      >
                        <div className="text-center whitespace-nowrap">
                          <div className={`text-muted-foreground opacity-50 ${isExpanded ? "text-[10px]" : "text-[10px]"}`}>-</div>
                          <div className={`font-semibold text-muted-foreground opacity-50 ${isExpanded ? "text-xs" : ""}`}>{index + 1}</div>
                        </div>
                      </th>
                    );
                  }
                  
                  const isToday =
                    date.getDate() === new Date().getDate() &&
                    date.getMonth() === new Date().getMonth() &&
                    date.getFullYear() === new Date().getFullYear();
                  const dayOfWeek = date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  
                  return (
                    <th
                      key={index}
                      className={`border border-border print:border-2 print:border-black ${isExpanded ? "p-1 text-xs" : "p-2 text-xs w-[70px]"} ${
                        isToday ? "bg-primary/10 print:bg-white" : (isSunday || isSaturday) ? "bg-gray-200 print:bg-gray-200" : "bg-card print:bg-white"
                      } ${isSunday ? "text-red-500 print:text-red-500" : isSaturday ? "text-blue-500 print:text-blue-500" : "text-foreground print:text-black"}`}
                    >
                      <div className="text-center whitespace-nowrap">
                        <div className={`text-muted-foreground ${isExpanded ? "text-xl" : "text-xl"}`}>
                          {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')][dayOfWeek]}
                        </div>
                        <div className={`font-semibold ${isExpanded ? "text-3xl" : "text-2xl"}`}>{date.getDate()}</div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className={`${isExpanded ? "" : "sticky left-0 z-10"} bg-card print:bg-white border border-border print:border-2 print:border-black font-medium text-foreground print:text-black ${isExpanded ? "w-24 p-2 text-3xl" : "w-[120px] p-2 text-3xl"}`}>
                    <div className={`flex items-center whitespace-nowrap ${isExpanded ? "gap-1 flex-col" : "gap-2"}`}>
                      <span className={isExpanded ? "text-3xl" : ""}>{employee.name}</span>
                    </div>
                  </td>
                  {getMonthDaysForTable().map((date, index) => {
                    if (!date) {
                      return (
                        <td
                          key={index}
                          className={`border border-border print:border-2 print:border-black text-center bg-muted/30 print:bg-white ${isExpanded ? "p-0.5" : "p-1 w-[70px]"}`}
                        />
                      );
                    }
                    
                    const shift = getShiftForEmployeeAndDate(employee.id, date);
                    const isToday =
                      date.getDate() === new Date().getDate() &&
                      date.getMonth() === new Date().getMonth() &&
                      date.getFullYear() === new Date().getFullYear();
                    const dayOfWeek = date.getDay();
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    
                    return (
                      <td
                        key={index}
                        className={`border border-border print:border-2 print:border-black text-center cursor-pointer hover:bg-muted/50 transition-colors print:cursor-default ${
                          isExpanded ? "p-1" : "p-1 w-[70px]"
                        } ${isToday ? "bg-primary/5 print:bg-white" : (isSunday || isSaturday) ? "bg-gray-100 print:bg-gray-200" : "bg-card print:bg-white"}`}
                        onClick={() => shift && onEditShift(shift)}
                      >
                        {shift && (
                          shift.type === 'off' ? (
                            <div className={`text-foreground print:text-black font-bold ${isExpanded ? "text-sm" : "text-sm"}`}>
                              {t('off')}
                            </div>
                          ) : (
                            <div className={`text-foreground print:text-black whitespace-nowrap ${isExpanded ? "text-[10px]" : "text-[10px]"}`}>
                              <div className={`font-semibold ${isExpanded ? "text-[10px]" : ""}`}>{formatTime(shift.startTime)}</div>
                              <div className="text-muted-foreground print:text-gray-400 text-[8px]">-</div>
                              <div className={`font-semibold ${isExpanded ? "text-[10px]" : ""}`}>{formatTime(shift.endTime)}</div>
                            </div>
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-muted/30 print:bg-white">
                <td className={`${isExpanded ? "" : "sticky left-0 z-10"} bg-muted/50 print:bg-gray-100 border border-border print:border-2 print:border-black font-bold text-foreground print:text-black ${isExpanded ? "w-24 p-2 text-3xl" : "w-[120px] p-2 text-3xl"}`}>
                  {t('staffCount')}
                </td>
                {getMonthDaysForTable().map((date, index) => {
                  if (!date) {
                    return (
                      <td
                        key={index}
                        className={`border border-border print:border-2 print:border-black text-center bg-muted/30 print:bg-white ${isExpanded ? "p-1" : "p-1 w-[70px]"}`}
                      />
                    );
                  }
                  
                  const morningCount = getStaffCountForDate(date, 'morning');
                  const afternoonCount = getStaffCountForDate(date, 'afternoon');
                  
                  return (
                    <td
                      key={index}
                      className={`border border-border print:border-2 print:border-black text-center bg-muted/50 print:bg-gray-100 ${isExpanded ? "p-1" : "p-1 w-[70px]"}`}
                    >
                      <div className={`text-foreground print:text-black font-semibold ${isExpanded ? "text-[11px]" : "text-[11px]"}`}>
                        <div>{t('am')} {morningCount}</div>
                        <div className="text-muted-foreground print:text-gray-400 text-[8px]">-</div>
                        <div>{t('pm')} {afternoonCount}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr className="print:hidden">
                <td 
                  colSpan={32} 
                  className={`${isExpanded ? "" : "sticky left-0 z-10"} bg-card border border-border ${isExpanded ? "p-1" : "p-2"}`}
                >
                  <div className="space-y-1">
                    <label className={`font-bold text-foreground ${isExpanded ? "text-xs" : "text-sm"}`}>
                      {t('notes')}：
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      className={`w-full border border-border rounded bg-background text-foreground ${isExpanded ? "p-1 text-xs min-h-[60px]" : "p-2 text-sm min-h-[80px]"}`}
                      placeholder={t('notesPlaceholder')}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const dayNames = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];

  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days: (Date | null)[] = [];

    // 前月の空白
    for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
      days.push(null);
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // 次月の空白（7の倍数になるまで）
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  const monthDays = getMonthDays(currentDate);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getMonthYearText = () => {
    return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  };

  const getMonthDaysForTable = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    
    for (let i = 1; i <= 31; i++) {
      if (i <= daysInMonth) {
        days.push(new Date(year, month, i));
      } else {
        days.push(null);
      }
    }
    
    return days;
  };

  const getShiftForEmployeeAndDate = (employeeId: string, date: Date) => {
    return shifts.find((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.employeeId === employeeId &&
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <Card className="p-6">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "table")}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="month">{t('monthly')}</TabsTrigger>
            <TabsTrigger value="table">{t('tableView')}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              {t('today')}
            </Button>
            <span className="text-sm font-semibold text-foreground px-2">
              {getMonthYearText()}
            </span>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="month" className="mt-0">
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day, index) => {
              const isSaturday = index === 5;
              const isSunday = index === 6;
              return (
                <div 
                  key={index} 
                  className={`text-center text-base font-bold p-3 ${
                    isSaturday ? "text-blue-600" : isSunday ? "text-red-600" : "text-foreground"
                  }`}
                >
                  {day}
                </div>
              );
            })}
            {monthDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[140px]" />;
              }

              const dayShifts = getShiftsForDate(date);
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();
              
              const dayOfWeek = date.getDay();
              const isSaturday = dayOfWeek === 6;
              const isSunday = dayOfWeek === 0;

              // スタッフ名から名字のみを抽出（スペースまたは最初の2-3文字）
              const getLastName = (fullName: string) => {
                const spaceSplit = fullName.split(/[\s　]/);
                if (spaceSplit.length > 1) return spaceSplit[0];
                return fullName.length > 3 ? fullName.slice(0, 2) : fullName;
              };

              return (
                <div
                  key={index}
                  className={`min-h-[140px] rounded-lg border-2 p-3 cursor-pointer hover:shadow-md transition-all ${
                    isToday 
                      ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/20" 
                      : isSaturday
                      ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                      : isSunday
                      ? "border-red-200 bg-red-50 dark:bg-red-950/20"
                      : "border-border bg-card"
                  }`}
                  onClick={() => {
                    setSelectedDate(date);
                    setIsDayStaffDialogOpen(true);
                  }}
                >
                  <div className="text-right mb-2">
                    <p className={`text-lg font-bold ${
                      isSaturday ? "text-blue-600" : isSunday ? "text-red-600" : "text-foreground"
                    }`}>
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {dayShifts.slice(0, 5).map((shift) => {
                      const employee = employees.find((e) => e.id === shift.employeeId);
                      const lastName = employee ? getLastName(employee.name) : "";
                      return (
                        <div
                          key={shift.id}
                          className="rounded px-2 py-1 text-xs bg-primary text-primary-foreground font-semibold truncate text-center"
                          title={shift.type === 'off' ? `${employee?.name}: 休` : `${employee?.name}: ${formatTime(shift.startTime)}-${formatTime(shift.endTime)}`}
                        >
                          {lastName}
                        </div>
                      );
                    })}
                    {dayShifts.length > 5 && (
                      <div className="rounded px-2 py-1 text-xs bg-muted text-muted-foreground font-semibold text-center">
                        +{dayShifts.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          {renderTableContent(false)}
        </TabsContent>
      </Tabs>

   <Drawer open={isTableExpanded} onOpenChange={setIsTableExpanded}>
  <DrawerContent className="max-h-[95vh]">
    <DrawerHeader className="border-b pb-6 text-center">
      <DrawerTitle className="text-3xl font-bold text-primary">
        {getMonthYearText()}
      </DrawerTitle>
    </DrawerHeader>

    {/* ここだけに変更！これでスマホでも絶対死なない */}
    <div className="overflow-auto p-6">
      <div className="min-w-[1400px] mx-auto">
        {renderTableContent(true)}
      </div>
    </div>

    <div className="p-6 text-center">
      <Button
        onClick={handlePrint}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-16 rounded-2xl text-xl shadow-xl"
      >
        {t('downloadPdf')}
      </Button>
    </div>
  </DrawerContent>
</Drawer>
      <DayStaffListDialog
        open={isDayStaffDialogOpen}
        onOpenChange={setIsDayStaffDialogOpen}
        date={selectedDate}
        shifts={shifts}
        employees={employees}
        onEditShift={onEditShift}
      />
      <PrintPreviewDialog
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        title={`${getMonthYearText()} - ${title || t('shiftTable')}`}
        onSplitPrint={(half) => {
          const allDays = getMonthDaysForTable();
          const filteredDays = half === 'first' 
            ? allDays.filter(date => date && date.getDate() <= 15)
            : allDays.filter(date => date && date.getDate() >= 16);
          
          return (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6 text-black">
                {getMonthYearText()} ({half === 'first' ? t('firstHalf') : t('secondHalf')})
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-card border-2 border-black font-semibold text-black p-2 text-3xl">
                      {t('staff')}
                    </th>
                    {filteredDays.map((date, index) => {
                      const dayOfWeek = date.getDay();
                      const isSunday = dayOfWeek === 0;
                      const isSaturday = dayOfWeek === 6;
                      const isWeekend = isSunday || isSaturday;
                      
                      return (
                        <th
                          key={index}
                          className={`border-2 border-black p-2 ${
                            isWeekend ? "bg-gray-200" : "bg-white"
                          } ${isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-black"}`}
                        >
                          <div className="text-center whitespace-nowrap">
                            <div className="text-muted-foreground text-xl">
                              {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')][dayOfWeek]}
                            </div>
                            <div className="font-semibold text-3xl">{date.getDate()}</div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="bg-white border-2 border-black font-medium text-black p-2 text-3xl">
                        <div className="flex items-center whitespace-nowrap gap-1 flex-col">
                          <span className="text-3xl">{employee.name}</span>
                        </div>
                      </td>
                      {filteredDays.map((date, index) => {
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const shift = getShiftForEmployeeAndDate(employee.id, date);

                        return (
                          <td
                            key={index}
                            className={`border-2 border-black text-center p-2 text-xl ${
                              isWeekend ? "bg-gray-200" : "bg-white"
                            }`}
                          >
                            {shift && (
                              shift.type === 'off' ? (
                                <div className="text-black font-bold">{t('off')}</div>
                              ) : (
                                <div className="text-black whitespace-nowrap">
                                  <div className="font-semibold">{formatTime(shift.startTime)}</div>
                                  <div className="text-gray-400">-</div>
                                  <div className="font-semibold">{formatTime(shift.endTime)}</div>
                                </div>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-white">
                    <td className="bg-gray-100 border-2 border-black font-bold text-black p-2 text-3xl">
                      {t('staffCount')}
                    </td>
                    {filteredDays.map((date, index) => {
                      const dayOfWeek = date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const morningCount = getStaffCountForDate(date, 'morning');
                      const afternoonCount = getStaffCountForDate(date, 'afternoon');

                      return (
                        <td key={index} className={`border-2 border-black text-center p-2 text-xl ${
                          isWeekend ? "bg-gray-200" : "bg-white"
                        }`}>
                          <div className="space-y-1">
                            {morningCount > 0 && (
                              <div className="text-black">
                                {t('am')} {morningCount}
                              </div>
                            )}
                            {afternoonCount > 0 && (
                              <div className="text-black">
                                {t('pm')} {afternoonCount}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }}
        content={renderPrintContent()}
      />
    </Card>
  );
};

export default ShiftCalendar;
