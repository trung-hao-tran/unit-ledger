import { create } from 'zustand';
import type { Room } from '@/types';

interface RoomsState {
  // Persistent room data
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  updateRooms: (updatedRooms: Room[]) => void;
  getRemainingRooms: (excludeRoomNames: string[]) => Room[];
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
