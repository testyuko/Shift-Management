import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Employee, Shift } from "@/pages/Index";
import { Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DayStaffListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  shifts: Shift[];
  employees: Employee[];
  onEditShift: (shift: Shift) => void;
}

const DayStaffListDialog = ({
  open,
  onOpenChange,
  date,
  shifts,
  employees,
  onEditShift,
}: DayStaffListDialogProps) => {
  const { t } = useTranslation();
  
  if (!date) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  const dateString = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const dayOfWeek = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')][date.getDay()];

  const dayShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.date);
    return (
      shiftDate.getDate() === date.getDate() &&
      shiftDate.getMonth() === date.getMonth() &&
      shiftDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('staffOnDate', { date: `${dateString}（${dayOfWeek}）` })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
          {dayShifts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noShifts')}
            </p>
          ) : (
            dayShifts.map((shift) => {
              const employee = employees.find((e) => e.id === shift.employeeId);
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{employee?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {shift.type === 'off' 
                        ? t('offDay')
                        : `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEditShift(shift);
                      onOpenChange(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit')}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayStaffListDialog;
