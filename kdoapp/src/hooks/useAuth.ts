'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  getTokenFromStorage,
  decodeToken,
  DecodedToken,
} from '@/lib/auth';
import { logout as serverLogout } from '@/lib/logout';

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
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    // Révoque la session côté serveur, vide le stockage puis redirige vers l'accueil
    void serverLogout();
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    logout,
  };
}
