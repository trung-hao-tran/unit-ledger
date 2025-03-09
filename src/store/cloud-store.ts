import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud, loadFromCloud } from '@/lib/cloud-storage';
import { useRoomsStore } from '@/store/rooms';
import { useUtilityCostsStore } from '@/store/utility-costs';

interface CloudState {
  cloudName: string;
  setCloudName: (name: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  saveCurrentData: () => Promise<void>;
  loadData: () => Promise<boolean>;
}

export const useCloudStore = create<CloudState>()(
  persist(
    (set, get) => ({
      cloudName: '',
      setCloudName: (name) => set({ cloudName: name }),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      saveCurrentData: async () => {
        const { cloudName, setIsLoading } = get();
        
        if (!cloudName) return;
        
        setIsLoading(true);
        
        try {
          const rooms = useRoomsStore.getState().rooms;
          const costSets = useUtilityCostsStore.getState().costSets;
          
          await saveToCloud(cloudName, rooms, costSets);
        } catch (error) {
          console.error('Failed to save data to cloud:', error);
        } finally {
          setIsLoading(false);
        }
      },
      
      loadData: async () => {
        const { cloudName, setIsLoading } = get();
        
        if (!cloudName) return false;
        
        setIsLoading(true);
        
        try {
          const data = await loadFromCloud(cloudName);
          
          if (data) {
            // Update rooms and utility costs
            useRoomsStore.getState().setRooms(data.rooms);
            useUtilityCostsStore.getState().importCostSets(data.utilityCosts);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Failed to load data from cloud:', error);
          return false;
        } finally {
          setIsLoading(false);
        }
      }
    }),
    {
      name: 'cloud-storage',
    }
  )
); 