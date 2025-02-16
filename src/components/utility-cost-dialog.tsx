import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUtilityCostsStore } from '@/store/utility-costs';
import type { UtilCost } from '@/types';

interface UtilityCostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UtilityCostDialog({
  isOpen,
  onClose,
  onConfirm,
}: UtilityCostDialogProps) {
  const { costs: initialCosts, setCosts } = useUtilityCostsStore();
  const [costs, setCostsLocal] = useState<UtilCost[]>(initialCosts);

  const handlePriceChange = (type: UtilCost['type'], price: number) => {
    setCostsLocal(prev =>
      prev.map(cost =>
        cost.type === type ? { ...cost, price } : cost
      )
    );
  };

  const handleConfirm = () => {
    setCosts(costs);
    onConfirm();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg space-y-4">
          <Dialog.Title className="text-lg font-semibold">
            Set Utility Costs
          </Dialog.Title>
          <div className="space-y-4">
            {costs.map(cost => (
              <div key={cost.type} className="flex items-center gap-4">
                <label className="w-24 capitalize">{cost.type}:</label>
                <Input
                  type="number"
                  value={cost.price}
                  onChange={e => handlePriceChange(cost.type, Number(e.target.value))}
                  className="w-32"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}