import { create } from 'zustand';
import type { Room, ExportData } from '@/types';
import { exportToJson, importFromJson } from '@/utils/export';
import { useUtilityCostsStore } from './utility-costs';

interface RoomsState {
  // Persistent room data
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  updateRooms: (updatedRooms: Room[]) => void;
  getRemainingRooms: (excludeRoomNames: string[]) => Room[];
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<ExportData>;
  // New CRUD operations
  addRoom: (room: Room) => void;
  editRoom: (roomName: string, updates: Partial<Room>) => void;
  deleteRoom: (roomName: string) => void;
}

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],
  
  setRooms: (rooms) => set({ rooms }),
  
  updateRooms: (updatedRooms) => set((state) => ({
    rooms: state.rooms.map(room => {
      const updatedRoom = updatedRooms.find(r => r.roomName === room.roomName);
      return updatedRoom ?? room;
    })
  })),
  
  getRemainingRooms: (excludeRoomNames) => {
    const { rooms } = get();
    return rooms.filter(room => !excludeRoomNames.includes(room.roomName));
  },
  
  exportData: async () => {
    const { rooms } = get();
    const { costs } = useUtilityCostsStore.getState();
    try {
      await exportToJson(rooms, costs);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },
  
  importData: async (file: File) => {
    try {
      const data = await importFromJson(file);
      
      // Update rooms
      set({ rooms: data.rooms });
      
      // Update utility costs
      useUtilityCostsStore.getState().setCosts(data.utilityCosts);
      
      return data;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  },

  // New CRUD operations
  addRoom: (room: Room) => set((state) => ({
    rooms: [...state.rooms, room]
  })),

  editRoom: (roomName: string, updates: Partial<Room>) => set((state) => ({
    rooms: state.rooms.map(room => 
      room.roomName === roomName
        ? { ...room, ...updates }
        : room
    )
  })),

  deleteRoom: (roomName: string) => set((state) => ({
    rooms: state.rooms.filter(room => room.roomName !== roomName)
  })),
}));
