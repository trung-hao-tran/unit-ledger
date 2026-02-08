import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { UtilityCostSet } from "@/types";

interface AddUtilityCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCostSet: Omit<UtilityCostSet, "id">) => void;
}

interface ServiceCostField {
  name: string;
  fee: string;
}

const initialFormData = {
  name: "",
  electricityCost: "",
  waterCost: "",
  serviceCosts: [] as ServiceCostField[],
};

export function AddUtilityCostDialog({
  open,
  onOpenChange,
  onSave,
}: AddUtilityCostDialogProps) {
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      electricityCost: Number(formData.electricityCost),
      waterCost: Number(formData.waterCost),
      serviceCosts: formData.serviceCosts.map((sc) => ({
        name: sc.name,
        fee: Number(sc.fee),
      })),
    });
    onOpenChange(false);
    setFormData(initialFormData);
  };

  const addServiceCost = () => {
    setFormData((prev) => ({
      ...prev,
      serviceCosts: [...prev.serviceCosts, { name: "", fee: "" }],
    }));
  };

  const removeServiceCost = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceCosts: prev.serviceCosts.filter((_, i) => i !== index),
    }));
  };

  const updateServiceCost = (
    index: number,
    field: keyof ServiceCostField,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      serviceCosts: prev.serviceCosts.map((sc, i) =>
        i === index ? { ...sc, [field]: value } : sc,
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm Bộ Giá Mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên Bộ Giá</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="electricityCost">Giá Điện</Label>
            <Input
              id="electricityCost"
              type="number"
              step="0.1"
              min="0"
              value={formData.electricityCost}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  electricityCost: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterCost">Giá Nước</Label>
            <Input
              id="waterCost"
              type="number"
              step="0.1"
              min="0"
              value={formData.waterCost}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, waterCost: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Phí Dịch Vụ</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addServiceCost}
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {formData.serviceCosts.map((sc, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Tên"
                  value={sc.name}
                  onChange={(e) =>
                    updateServiceCost(index, "name", e.target.value)
                  }
                  required
                />
                <Input
                  placeholder="Phí"
                  type="number"
                  step="0.1"
                  min="0"
                  value={sc.fee}
                  onChange={(e) =>
                    updateServiceCost(index, "fee", e.target.value)
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeServiceCost(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Thêm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
