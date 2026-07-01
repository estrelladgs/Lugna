import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User, tokens: AuthTokens) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const STORAGE_KEY = '@lugna_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, tokens) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
    set({ user, tokens, isAuthenticated: true });
  },

  updateUser: async (updatedUser) => {
    const { tokens } = get();
    if (tokens) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser, tokens }));
    }
    set({ user: updatedUser });
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { user, tokens } = JSON.parse(raw);
        set({ user, tokens, isAuthenticated: true });
      }
    } catch {
      // storage error — start unauthenticated
    } finally {
      set({ isLoading: false });
    }
  },
}));
