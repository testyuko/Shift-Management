import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Employee, Shift } from "@/pages/Index";
import { useTranslation } from "react-i18next";

interface MonthlyWorkHoursProps {
  employees: Employee[];
  shifts: Shift[];
  currentMonth: Date;
}

const MonthlyWorkHours = ({ employees, shifts, currentMonth }: MonthlyWorkHoursProps) => {
  const { t } = useTranslation();

  const monthlyHours = useMemo(() => {
    const result: { [key: string]: number } = {};
    
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    employees.forEach(employee => {
      let totalMinutes = 0;
      
      shifts.forEach(shift => {
        if (shift.employeeId === employee.id && shift.type !== 'off') {
          const shiftDate = new Date(shift.date);
          
          // 現在の月のシフトのみを計算
          if (shiftDate >= monthStart && shiftDate <= monthEnd) {
            if (shift.startTime && shift.endTime) {
              const [startHour, startMin] = shift.startTime.split(':').map(Number);
              const [endHour, endMin] = shift.endTime.split(':').map(Number);
              
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              
              totalMinutes += endMinutes - startMinutes;
            }
          }
        }
      });
      
      result[employee.id] = Math.round((totalMinutes / 60) * 10) / 10;
    });
    
    return result;
  }, [employees, shifts, currentMonth]);

  if (employees.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>{t('monthlyWorkHours')}</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {employees.map(employee => (
          <div 
            key={employee.id} 
            className="p-3 bg-muted rounded-lg"
          >
            <div className="font-medium text-sm mb-1">{employee.name}</div>
            <div className="text-2xl font-bold text-primary">
              {monthlyHours[employee.id] || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {t('hours')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MonthlyWorkHours;
