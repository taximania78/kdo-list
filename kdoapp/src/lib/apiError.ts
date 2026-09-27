type ApiErrorShape = {
  response?: { data?: { detail?: unknown; message?: unknown } };
} | null;

/** Message à afficher pour une erreur d'API (FastAPI renvoie `detail`). */
export function apiErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue. Réessaie.'
): string {
  const data = (error as ApiErrorShape)?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  return fallback;
}
