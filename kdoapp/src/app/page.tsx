'use client';

import { useEffect, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, LogIn, Gift, Sparkles } from 'lucide-react';
import { isChristmas } from '@/lib/theme';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/list');
      }
    }
  }, [isAuthenticated, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', event.currentTarget.username.value);
    formData.append('password', event.currentTarget.password.value);

    try {
      const response = await fetch(`${ApiAdress}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        localStorage.setItem('isAdmin', data.isAdmin);
        localStorage.setItem('user', data.username);

        const firstConnection = data.firstConnection;
        if (firstConnection) {
          sessionStorage.setItem('requirePasswordChange', 'true');
          router.push('/first-connection');
          return;
        }
        if (data.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/list');
        }
      } else {
        setError("Nom d'utilisateur ou mot de passe invalide.");
        setIsLoading(false);
      }
    } catch {
      setError(`Une erreur s'est produite. Veuillez réessayer.`);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative">
      <div className="w-full max-w-md z-10 animate-fadeInUp">
        <div
          className={`surface-card rounded-3xl shadow-xl p-8 ${
            isChristmas ? 'backdrop-blur-lg animate-glow' : ''
          }`}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {isChristmas ? (
                <Gift className="w-16 h-16 text-[var(--text-primary)] drop-shadow-lg" />
              ) : (
                <Sparkles className="w-16 h-16 text-[var(--primary)]" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">
              {isChristmas ? '🎄 Connexion 🎄' : 'Bienvenue'}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Connectez-vous pour accéder aux listes
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--danger)] text-[var(--on-primary)] rounded-lg text-center font-medium animate-shake backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                Nom d&apos;utilisateur
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={isLoading}
                className="block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--input-focus)]"
                placeholder="Nom d'utilisateur"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--input-focus)]"
                placeholder="Mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[var(--on-primary)] font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[var(--shadow-primary)] ${
                isChristmas
                  ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700'
                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm italic text-[var(--text-muted)]">
              Mot de passe oublié ? Contactez-moi.
            </p>
          </div>
        </div>

        {isChristmas && (
          <div className="mt-4 text-center text-[var(--text-muted)] text-xs">
            ✨ Joyeux Noël ! ✨
          </div>
        )}
      </div>
    </div>
  );
}
