import { isAxiosError } from 'axios';

export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (!err.response) {
      return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
    }
  }
  return fallback;
}
