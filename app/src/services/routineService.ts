import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { Routine } from '../types';

const LAST_ROUTINE_KEY = '@lugna_last_routine';

export interface LastRoutine {
  id: string;
  name: string;
  durationMinutes: number;
  progressPercent: number;
  enlace?: string;
}

export const routineService = {
  getRoutines: async (): Promise<Routine[]> => {
    const { data } = await api.get<Routine[]>('/routines');
    return data;
  },

  startRoutine: async (id: string): Promise<Routine> => {
    const { data } = await api.post<Routine>(`/routines/${id}/start`);
    return data;
  },

  saveLastRoutine: async (routine: LastRoutine): Promise<void> => {
    await AsyncStorage.setItem(LAST_ROUTINE_KEY, JSON.stringify(routine));
  },

  getLastRoutine: async (): Promise<LastRoutine | null> => {
    const raw = await AsyncStorage.getItem(LAST_ROUTINE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRoutine;
  },
};
