import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Employee } from "@/pages/Index";
import { toast } from "sonner";
import { z } from "zod";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEmployee: (employee: Omit<Employee, "id">) => void;
}

const AddEmployeeDialog = ({ open, onOpenChange, onAddEmployee }: AddEmployeeDialogProps) => {
  const [name, setName] = useState<string>("");

  const employeeSchema = z.object({
    name: z.string()
      .trim()
      .min(1, "従業員名を入力してください")
      .max(50, "従業員名は50文字以内で入力してください"),
  });

  const handleSubmit = () => {
    try {
      const validated = employeeSchema.parse({ name });
      onAddEmployee({
        name: validated.name,
      });
      toast.success("従業員を追加しました");
      setName("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>従業員を追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>従業員名</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit}>追加</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
