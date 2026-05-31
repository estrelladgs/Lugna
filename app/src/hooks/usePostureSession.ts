import { useRef, useCallback } from 'react';
import { usePostureStore } from '../store/postureStore';
import { postureService } from '../services/postureService';
import { PostureId } from '../types';

export function usePostureSession() {
  const { activeSession, latestFeedback, startSession, endSession, addFeedback } =
    usePostureStore();
  const isAnalyzing = useRef(false);

  const begin = useCallback(
    (postureId: PostureId) => {
      startSession(postureId);
    },
    [startSession]
  );

  const analyzeFrame = useCallback(
    async (frameBase64: string) => {
      if (!activeSession || isAnalyzing.current) return;
      isAnalyzing.current = true;
      try {
        const feedback = await postureService.analyzeFrame(
          activeSession.postureId,
          frameBase64
        );
        addFeedback(feedback);
      } catch {
        // silently skip failed frames
      } finally {
        isAnalyzing.current = false;
      }
    },
    [activeSession, addFeedback]
  );

  const finish = useCallback(async () => {
    const session = endSession();
    if (session) {
      try {
        await postureService.saveSession(session);
      } catch {
        // session saved locally even if server fails
      }
    }
    return session;
  }, [endSession]);

  return { activeSession, latestFeedback, begin, analyzeFrame, finish };
}
