import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number;
}

/**
 * Safely retrieves authToken from localStorage
 * Returns null if not found or on server-side
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/**
 * Safely retrieves refreshToken from localStorage
 */
export function getRefreshTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

/**
 * Checks if token can be decoded (not corrupted)
 * Does NOT check expiration
 */
export function isTokenDecodable(token: string): boolean {
  try {
    jwtDecode<DecodedToken>(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely decodes JWT token
 * Returns null on decode errors
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Checks if token is expired
 * Returns true if expired OR invalid
 * Read-only check - does not delete tokens
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true; // Treat invalid as expired
  }
}

/**
 * Removes all auth-related localStorage items
 * Safe to call multiple times
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}

/**
 * Reads current token and extracts user data
 * Returns null if no valid token
 * Does NOT check expiration (assumes api.ts handles it)
 */
export function getUserInfo(): {
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
} | null {
  const token = getTokenFromStorage();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    username: decoded.username,
    isAdmin: decoded.isAdmin,
    isMegaAdmin: decoded.isMegaAdmin,
  };
}
