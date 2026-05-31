import { create } from 'zustand';
import { PostureFeedback, PostureSession, PostureId } from '../types';

interface PostureState {
  activeSession: PostureSession | null;
  sessionHistory: PostureSession[];
  latestFeedback: PostureFeedback | null;
  startSession: (postureId: PostureId) => void;
  endSession: () => PostureSession | null;
  addFeedback: (feedback: PostureFeedback) => void;
  setHistory: (history: PostureSession[]) => void;
}

function createEmptySession(postureId: PostureId): PostureSession {
  return {
    id: `${Date.now()}`,
    postureId,
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    averageScore: 0,
    feedbackHistory: [],
  };
}

export const usePostureStore = create<PostureState>((set, get) => ({
  activeSession: null,
  sessionHistory: [],
  latestFeedback: null,

  startSession: (postureId) => {
    set({ activeSession: createEmptySession(postureId), latestFeedback: null });
  },

  endSession: () => {
    const { activeSession } = get();
    if (!activeSession) return null;

    const endedAt = new Date().toISOString();
    const startMs = new Date(activeSession.startedAt).getTime();
    const durationSeconds = Math.round((Date.now() - startMs) / 1000);
    const scores = activeSession.feedbackHistory.map((f) => f.score);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const completed: PostureSession = {
      ...activeSession,
      endedAt,
      durationSeconds,
      averageScore: Math.round(averageScore),
    };

    set((state) => ({
      activeSession: null,
      sessionHistory: [completed, ...state.sessionHistory],
    }));

    return completed;
  },

  addFeedback: (feedback) => {
    set((state) => {
      if (!state.activeSession) return { latestFeedback: feedback };
      return {
        latestFeedback: feedback,
        activeSession: {
          ...state.activeSession,
          feedbackHistory: [...state.activeSession.feedbackHistory, feedback],
        },
      };
    });
  },

  setHistory: (history) => set({ sessionHistory: history }),
}));
