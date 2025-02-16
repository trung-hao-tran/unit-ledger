import { create } from 'zustand';
import type { UtilCost } from '@/types';

interface UtilityCostsState {
  costs: UtilCost[];
  setCosts: (costs: UtilCost[]) => void;
  updateCost: (type: UtilCost['type'], price: number) => void;
  getCost: (type: UtilCost['type']) => number;
}

const defaultCosts: UtilCost[] = [
  { type: 'electric', price: 0 },
  { type: 'water', price: 0 },
  { type: 'garbage', price: 0 },
];

export const useUtilityCostsStore = create<UtilityCostsState>((set, get) => ({
  costs: defaultCosts,
  
  setCosts: (costs) => {
    // Ensure all utility types are present
    const newCosts = [...costs];
    defaultCosts.forEach(defaultCost => {
      if (!newCosts.some(cost => cost.type === defaultCost.type)) {
        newCosts.push(defaultCost);
      }
    });
    set({ costs: newCosts });
  },
  
  updateCost: (type, price) => set((state) => ({
    costs: state.costs.map(cost => 
      cost.type === type ? { ...cost, price } : cost
    ),
  })),
  
  getCost: (type) => {
    const cost = get().costs.find(c => c.type === type);
    return cost?.price ?? 0;
  },
}));
