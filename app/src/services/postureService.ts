import { api } from './api';
import { PostureFeedback, PostureSession, PostureId, Posture } from '../types';

export const postureService = {
  getPostures: async (): Promise<Posture[]> => {
    const { data } = await api.get<Posture[]>('/postures');
    return data;
  },

  getPosture: async (id: PostureId): Promise<Posture> => {
    const { data } = await api.get<Posture>(`/postures/${id}`);
    return data;
  },

  analyzeFrame: async (
    postureId: PostureId,
    frameBase64: string
  ): Promise<PostureFeedback> => {
    const { data } = await api.post<PostureFeedback>('/posture/analyze', {
      postureId,
      frame: frameBase64,
    });
    return data;
  },

  saveSession: async (session: PostureSession): Promise<PostureSession> => {
    const { data } = await api.post<PostureSession>('/posture/sessions', session);
    return data;
  },

  getSessions: async (): Promise<PostureSession[]> => {
    const { data } = await api.get<PostureSession[]>('/posture/sessions');
    return data;
  },
};
