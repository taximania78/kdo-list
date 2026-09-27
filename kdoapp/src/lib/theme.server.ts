import { cache } from 'react';
import { DEFAULT_THEME, isThemeName, type ThemeName } from '@/lib/theme';

const FETCH_TIMEOUT_MS = 2000;

/**
 * Lit le thème courant depuis l'API, côté serveur.
 * Ne lève jamais : toute erreur (URL absente, réseau, timeout, valeur inconnue) → 'default'.
 */
export async function fetchTheme(): Promise<ThemeName> {
  const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return DEFAULT_THEME;

  try {
    const response = await fetch(`${baseUrl}/api/settings/theme`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return DEFAULT_THEME;
    const data: unknown = await response.json();
    const theme = (data as { theme?: unknown } | null)?.theme;
    return isThemeName(theme) ? theme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Version mémoïsée pour une même requête (layout + generateMetadata). */
export const getTheme = cache(fetchTheme);
