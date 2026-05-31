import { useEffect, useState } from 'react';
import { usePostureStore } from '../store/postureStore';
import { postureService } from '../services/postureService';

export function usePostureHistory() {
  const { sessionHistory, setHistory } = usePostureStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    postureService
      .getSessions()
      .then((sessions) => {
        if (!cancelled) setHistory(sessions);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las sesiones.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setHistory]);

  return { sessionHistory, isLoading, error };
}
