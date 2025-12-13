import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Employee, Shift } from "@/pages/Index";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";

interface EditShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  shift: Shift | null;
  employees: Employee[];
}

const EditShiftDialog = ({ open, onOpenChange, onUpdateShift, onDeleteShift, shift, employees }: EditShiftDialogProps) => {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [shiftType, setShiftType] = useState<'work' | 'off'>('work');

  useEffect(() => {
    if (shift) {
      setSelectedEmployee(shift.employeeId);
      setDate(new Date(shift.date));
      setStartTime(shift.startTime || "09:00");
      setEndTime(shift.endTime || "17:00");
      setShiftType(shift.type || 'work');
    }
  }, [shift]);

  const handleSubmit = () => {
    if (!selectedEmployee || !date || !shift) {
      toast.error(t('toast.allFieldsRequired'));
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

    onUpdateShift({
      id: shift.id,
      employeeId: selectedEmployee,
      date,
      startTime: shiftType === 'work' ? startTime : '',
      endTime: shiftType === 'work' ? endTime : '',
      type: shiftType,
    });

    toast.success(t('shiftUpdated'));
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!shift) return;
    onDeleteShift(shift.id);
    toast.success(t('shiftDeleted'));
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
          <DialogTitle>{t('editShift')}</DialogTitle>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ja }) : t('selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ja} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>{t('shiftType')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={shiftType === 'work' ? 'default' : 'outline'}
                onClick={() => setShiftType('work')}
                className="flex-1"
              >
                {t('work')}
              </Button>
              <Button
                type="button"
                variant={shiftType === 'off' ? 'default' : 'outline'}
                onClick={() => setShiftType('off')}
                className="flex-1"
              >
                {t('off')}
              </Button>
            </div>
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

        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('delete')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('update')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditShiftDialog;
