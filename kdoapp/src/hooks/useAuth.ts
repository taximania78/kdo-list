'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getTokenFromStorage,
  decodeToken,
  clearAuthStorage,
  DecodedToken,
} from '@/lib/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      setError(null);

      const token = getTokenFromStorage();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const decoded = decodeToken(token);

      if (!decoded) {
        // Token is corrupted
        setIsAuthenticated(false);
        setUser(null);
        setError('Session invalide - token corrompu');
        setIsLoading(false);
        return;
      }

      // Token is decodable (we don't check expiration - api.ts handles that)
      setIsAuthenticated(true);
      setUser(decoded);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname]); // Re-check on route change

  const logout = () => {
    console.log('🚪 [AUTH] User logging out');
    clearAuthStorage();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    router.push('/');
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    logout,
  };
}
