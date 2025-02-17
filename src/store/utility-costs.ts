import { create } from 'zustand';
import type { UtilityCostSet } from '@/types';

interface UtilityCostsState {
  costSets: UtilityCostSet[];
  addCostSet: (costSet: Omit<UtilityCostSet, 'id'>) => UtilityCostSet;
  updateCostSet: (id: number, updates: Partial<Omit<UtilityCostSet, 'id'>>) => void;
  deleteCostSet: (id: number) => void;
  importCostSets: (costSets: UtilityCostSet[]) => void;
}

const defaultCostSet: UtilityCostSet = {
  id: 1,
  name: 'Default Costs',
  electricityCost: 3.7,
  waterCost: 5,
  garbageCost: 60,
};

export const useUtilityCostsStore = create<UtilityCostsState>((set, get) => ({
  costSets: [defaultCostSet],
  
  addCostSet: (costSet) => {
    // Find the highest id
    const maxId = get().costSets.reduce((max, set) => Math.max(max, set.id), 0);
    // Create new cost set with next id
    const newCostSet = { ...costSet, id: maxId + 1 };
    set((state) => ({ costSets: [...state.costSets, newCostSet] }));
    return newCostSet;
  },
  
  updateCostSet: (id, updates) => set((state) => ({
    costSets: state.costSets.map((set) =>
      set.id === id ? { ...set, ...updates } : set
    ),
  })),
  
  deleteCostSet: (id) => set((state) => ({
    costSets: state.costSets.filter((set) => set.id !== id),
  })),
  
  importCostSets: (costSets) => {
    // If no cost sets provided, keep the default
    if (!costSets || costSets.length === 0) {
      set({ costSets: [defaultCostSet] });
      return;
    }
    
    // Otherwise use the imported cost sets
    set({ costSets });
  },
}));
