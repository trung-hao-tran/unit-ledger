import { create } from 'zustand';
import type { Room } from '@/types';

interface SessionState {
  recentlyCalculatedRooms: Room[];
  setRecentlyCalculatedRooms: (rooms: Room[]) => void;
  clearRecentlyCalculatedRooms: () => void;
  hasRecentlyCalculatedRooms: () => boolean;
}

// Helper to interact with sessionStorage
const sessionStorageKey = 'unit-ledger-calculated-rooms';

// Create the session store
export const useSessionStore = create<SessionState>((set, get) => ({
  recentlyCalculatedRooms: (() => {
    try {
      const storedData = sessionStorage.getItem(sessionStorageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Failed to load session data:', error);
      return [];
    }
  })(),
  
  setRecentlyCalculatedRooms: (rooms) => {
    set({ recentlyCalculatedRooms: rooms });
    try {
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(rooms));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  },
  
  clearRecentlyCalculatedRooms: () => {
    set({ recentlyCalculatedRooms: [] });
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  },
  
  hasRecentlyCalculatedRooms: () => {
    return get().recentlyCalculatedRooms.length > 0;
  },
})); 