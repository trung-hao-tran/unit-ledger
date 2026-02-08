import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { UtilityCostSet } from "@/types";

interface ServiceCostField {
  name: string;
  fee: string;
}

interface EditUtilityCostDialogProps {
  costSet: UtilityCostSet;
  onSave: (updates: Partial<Omit<UtilityCostSet, "id">>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUtilityCostDialog({
  costSet,
  onSave,
  open,
  onOpenChange,
}: EditUtilityCostDialogProps) {
  const [name, setName] = useState(costSet.name);
  const [electricityCost, setElectricityCost] = useState(
    costSet.electricityCost.toString(),
  );
  const [waterCost, setWaterCost] = useState(costSet.waterCost.toString());
  const [serviceCosts, setServiceCosts] = useState<ServiceCostField[]>(
    costSet.serviceCosts.map((sc) => ({
      name: sc.name,
      fee: sc.fee.toString(),
    })),
  );

  const addServiceCost = () => {
    setServiceCosts((prev) => [...prev, { name: "", fee: "" }]);
  };

  const removeServiceCost = (index: number) => {
    setServiceCosts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateServiceCost = (
    index: number,
    field: keyof ServiceCostField,
    value: string,
  ) => {
    setServiceCosts((prev) =>
      prev.map((sc, i) => (i === index ? { ...sc, [field]: value } : sc)),
    );
  };

  const handleSave = () => {
    onSave({
      name,
      electricityCost: parseFloat(electricityCost),
      waterCost: parseFloat(waterCost),
      serviceCosts: serviceCosts.map((sc) => ({
        name: sc.name,
        fee: parseFloat(sc.fee),
      })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh Sửa Bộ Giá</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity">Giá Điện</Label>
            <Input
              id="electricity"
              type="number"
              step="0.1"
              value={electricityCost}
              onChange={(e) => setElectricityCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water">Giá Nước</Label>
            <Input
              id="water"
              type="number"
              step="0.1"
              value={waterCost}
              onChange={(e) => setWaterCost(e.target.value)}
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
            {serviceCosts.map((sc, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Tên"
                  value={sc.name}
                  onChange={(e) =>
                    updateServiceCost(index, "name", e.target.value)
                  }
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
