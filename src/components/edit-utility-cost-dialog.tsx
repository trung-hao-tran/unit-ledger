import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UtilityCostSet } from '@/types';

interface EditUtilityCostDialogProps {
  costSet: UtilityCostSet;
  onSave: (updates: Partial<Omit<UtilityCostSet, 'id'>>) => void;
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
  const [electricityCost, setElectricityCost] = useState(costSet.electricityCost.toString());
  const [waterCost, setWaterCost] = useState(costSet.waterCost.toString());
  const [garbageCost, setGarbageCost] = useState(costSet.garbageCost.toString());

  const handleSave = () => {
    onSave({
      name,
      electricityCost: parseFloat(electricityCost),
      waterCost: parseFloat(waterCost),
      garbageCost: parseFloat(garbageCost),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Utility Cost Set</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity">Electricity Cost</Label>
            <Input
              id="electricity"
              type="number"
              step="0.1"
              value={electricityCost}
              onChange={(e) => setElectricityCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water">Water Cost</Label>
            <Input
              id="water"
              type="number"
              step="0.1"
              value={waterCost}
              onChange={(e) => setWaterCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="garbage">Garbage Cost</Label>
            <Input
              id="garbage"
              type="number"
              step="0.1"
              value={garbageCost}
              onChange={(e) => setGarbageCost(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
