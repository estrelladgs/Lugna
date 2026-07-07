import { api } from './api';

export interface LiveClass {
  id: string;
  title: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  difficulty: string;
  enlace?: string;
}

export interface ActivityData {
  activeDays: string[];
  streakDays: number;
}

export interface ProgressData {
  completedLevels: number;
  totalLevels: number;
  percentage: number;
  totalSessions: number;
  lastProgramName: string | null;
}

export interface ContinueRoutine {
  id: string;
  name: string;
  durationMinutes: number;
  progressPercent: number;
  enlace?: string;
}

export async function getLiveClasses(): Promise<LiveClass[]> {
  const { data } = await api.get<LiveClass[]>('/home/live-classes');
  return data;
}

export async function getActivity(): Promise<ActivityData> {
  const { data } = await api.get<ActivityData>('/home/activity', {
    params: { tz_offset_minutes: new Date().getTimezoneOffset() },
  });
  return data;
}

export async function getProgress(): Promise<ProgressData> {
  const { data } = await api.get<ProgressData>('/home/progress');
  return data;
}

export async function getContinueRoutine(): Promise<ContinueRoutine> {
  const { data } = await api.get<ContinueRoutine>('/home/continue-routine');
  return data;
}
