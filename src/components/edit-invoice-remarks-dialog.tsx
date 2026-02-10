import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditInvoiceRemarksDialogProps {
  remarks: string[];
  onSave: (remarks: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvoiceRemarksDialog({
  remarks,
  onSave,
  open,
  onOpenChange,
}: EditInvoiceRemarksDialogProps) {
  const [text, setText] = useState(remarks.join("\n"));

  const handleSave = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    onSave(lines);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh Sửa Ghi Chú Hóa Đơn</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ghi chú (mỗi dòng một ghi chú)</Label>
            <Textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
