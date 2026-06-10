import { api } from './api';
import { Routine } from '../types';

export const routineService = {
  getRoutines: async (): Promise<Routine[]> => {
    const { data } = await api.get<Routine[]>('/routines');
    return data;
  },

  startRoutine: async (id: string): Promise<Routine> => {
    const { data } = await api.post<Routine>(`/routines/${id}/start`);
    return data;
  },
};
