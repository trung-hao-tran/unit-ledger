import { create } from 'zustand';
import type { Room, CalculationRoom, CalculationFields } from '@/types';

interface CalculationRoomsState {
  calculationRooms: CalculationRoom[];
  setCalculationRooms: (rooms: Room[]) => void;
  addCalculationRoom: (room: Room) => void;
  removeCalculationRoom: (roomName: string) => void;
  updateCalculationRoom: (roomName: string, updates: Partial<CalculationFields> & Partial<Room>) => void;
  clearCalculation: () => void;
}

const convertToCalculationRoom = (room: Room): CalculationRoom => ({
  ...room,
  isSelected: true,
  newElectric: room.currentElectric,
  newWater: room.currentWater
});

export const useCalculationRoomsStore = create<CalculationRoomsState>((set) => ({
  calculationRooms: [],
  setCalculationRooms: (rooms) => set({
    calculationRooms: rooms.map(convertToCalculationRoom),
  }),
  addCalculationRoom: (room) => set((state) => ({
    calculationRooms: [...state.calculationRooms, convertToCalculationRoom(room)],
  })),
  removeCalculationRoom: (roomName) => set((state) => ({
    calculationRooms: state.calculationRooms.filter(r => r.roomName !== roomName),
  })),
  updateCalculationRoom: (roomName, updates) => set((state) => ({
    calculationRooms: state.calculationRooms.map(room =>
      room.roomName === roomName 
        ? { ...room, ...updates }
        : room
    ),
  })),
  clearCalculation: () => set({ calculationRooms: [] }),
}));
