import { useRef, useCallback, useState } from 'react';
import { usePostureStore } from '../store/postureStore';
import { postureService } from '../services/postureService';
import { PostureId } from '../types';

const FAILURE_THRESHOLD = 2;

export interface FrameStats {
  sent: number;
  ok: number;
  failed: number;
}

function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string; response?: { status: number } };
  if (e?.response?.status) return `Error del servidor (${e.response.status}).`;
  if (e?.code === 'ECONNABORTED') return 'Tiempo de espera agotado al analizar la imagen.';
  if (e?.message === 'Network Error') return 'No se pudo contactar con el servidor de análisis.';
  return e?.message ?? 'Error desconocido al analizar la imagen.';
}

export function usePostureSession() {
  const { activeSession, latestFeedback, startSession, endSession, addFeedback } =
    usePostureStore();
  const isAnalyzing = useRef(false);
  const failureCount = useRef(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [frameStats, setFrameStats] = useState<FrameStats>({ sent: 0, ok: 0, failed: 0 });

  const begin = useCallback(
    (postureId: PostureId) => {
      failureCount.current = 0;
      setAnalysisError(null);
      setFrameStats({ sent: 0, ok: 0, failed: 0 });
      startSession(postureId);
    },
    [startSession]
  );

  const analyzeFrame = useCallback(
    async (frameBase64: string) => {
      // Read the current session from the store directly instead of the value
      // captured when this callback was created — the setInterval in
      // PostureCameraScreen is set up in the same tick as begin(), before this
      // hook re-renders with the freshly-started session, so a closed-over
      // `activeSession` would still be null on every tick.
      const session = usePostureStore.getState().activeSession;
      if (!session || isAnalyzing.current) return;
      isAnalyzing.current = true;
      setFrameStats((s) => ({ ...s, sent: s.sent + 1 }));
      try {
        const feedback = await postureService.analyzeFrame(
          session.postureId,
          frameBase64
        );
        failureCount.current = 0;
        setAnalysisError(null);
        setFrameStats((s) => ({ ...s, ok: s.ok + 1 }));
        addFeedback(feedback);
      } catch (err) {
        failureCount.current += 1;
        console.warn('[posture] analyzeFrame failed', err);
        setFrameStats((s) => ({ ...s, failed: s.failed + 1 }));
        if (failureCount.current >= FAILURE_THRESHOLD) {
          setAnalysisError(describeError(err));
        }
      } finally {
        isAnalyzing.current = false;
      }
    },
    [addFeedback]
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

  return { activeSession, latestFeedback, analysisError, frameStats, begin, analyzeFrame, finish };
}
