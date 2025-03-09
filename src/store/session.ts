import { create } from 'zustand';
import type { Room } from '@/types';

interface SessionState {
  calculatedRooms: Room[];
  addCalculatedRooms: (rooms: Room[]) => void;
  clearCalculatedRooms: () => void;
  hasCalculatedRooms: () => boolean;
  getCalculatedRooms: () => Room[];
}

// Helper to interact with sessionStorage
const sessionStorageKey = 'unit-ledger-calculated-rooms';

// Create the session store
export const useSessionStore = create<SessionState>((set, get) => ({
  calculatedRooms: (() => {
    try {
      const storedData = sessionStorage.getItem(sessionStorageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Failed to load session data:', error);
      return [];
    }
  })(),
  
  addCalculatedRooms: (newRooms) => {
    const currentRooms = get().calculatedRooms;
    
    // Create a map of existing rooms by roomName for quick lookup
    const existingRoomsMap = new Map(
      currentRooms.map(room => [room.roomName, room])
    );
    
    // Add new rooms, replacing existing ones with the same roomName
    newRooms.forEach(room => {
      existingRoomsMap.set(room.roomName, room);
    });
    
    // Convert map back to array
    const updatedRooms = Array.from(existingRoomsMap.values());
    
    set({ calculatedRooms: updatedRooms });
    try {
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  },
  
  clearCalculatedRooms: () => {
    set({ calculatedRooms: [] });
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  },
  
  hasCalculatedRooms: () => {
    return get().calculatedRooms.length > 0;
  },
  
  getCalculatedRooms: () => {
    return get().calculatedRooms;
  },
})); 