import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Employee } from "@/pages/Index";
import { useTranslation } from "react-i18next";

interface EmployeeListProps {
  employees: Employee[];
  onDeleteEmployee: (employeeId: string) => void;
  onMoveEmployee: (employeeId: string, direction: 'up' | 'down') => void;
}

const EmployeeList = ({ employees, onDeleteEmployee, onMoveEmployee }: EmployeeListProps) => {
  const { t } = useTranslation();
  
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold text-foreground">{t('employeeList')}</h2>
      <div className="space-y-3">
        {employees.map((employee, index) => (
          <div
            key={employee.id}
            className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveEmployee(employee.id, 'up')}
                  disabled={index === 0}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveEmployee(employee.id, 'down')}
                  disabled={index === employees.length - 1}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{employee.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteEmployee(employee.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title={t('deleteEmployee')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EmployeeList;
