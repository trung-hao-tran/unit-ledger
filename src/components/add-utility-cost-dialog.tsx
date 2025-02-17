import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UtilityCostSet } from '@/types';

interface AddUtilityCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCostSet: Omit<UtilityCostSet, 'id'>) => void;
}

export function AddUtilityCostDialog({
  open,
  onOpenChange,
  onSave,
}: AddUtilityCostDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    electricityCost: '',
    waterCost: '',
    garbageCost: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      electricityCost: Number(formData.electricityCost),
      waterCost: Number(formData.waterCost),
      garbageCost: Number(formData.garbageCost),
    });
    onOpenChange(false);
    // Reset form
    setFormData({
      name: '',
      electricityCost: '',
      waterCost: '',
      garbageCost: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Utility Cost Set</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="electricityCost">Electricity Cost</Label>
            <Input
              id="electricityCost"
              type="number"
              step="0.1"
              min="0"
              value={formData.electricityCost}
              onChange={(e) => setFormData(prev => ({ ...prev, electricityCost: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waterCost">Water Cost</Label>
            <Input
              id="waterCost"
              type="number"
              step="0.1"
              min="0"
              value={formData.waterCost}
              onChange={(e) => setFormData(prev => ({ ...prev, waterCost: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="garbageCost">Garbage Cost</Label>
            <Input
              id="garbageCost"
              type="number"
              step="0.1"
              min="0"
              value={formData.garbageCost}
              onChange={(e) => setFormData(prev => ({ ...prev, garbageCost: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Cost Set</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
