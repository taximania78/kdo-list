'use client';

import { useEffect, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { User, Lock, LogIn, Gift, Sparkles } from 'lucide-react';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('API URL utilisée :', ApiAdress);
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const admin = localStorage.getItem('isAdmin');
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const isExpired = decoded.exp < Date.now() / 1000;

          if (isExpired) {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const isExpired = decoded.exp < Date.now() / 1000;
            if (isExpired) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const response = await fetch(`${ApiAdress}/api/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!response.ok) {
              localStorage.clear();
              router.push('/');
              return;
            }
            const data = await response.json();
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
          } else {
            if (admin == 'true') {
              router.push('/admin');
            } else {
              router.push('/list');
            }
          }
        } catch (error) {
          console.error('Token verification error:', error);
          localStorage.clear();
          router.push('/');
          // Gérer l'erreur selon les besoins, par exemple, laisser l'utilisateur se connecter à nouveau
        }
      }
    };

    checkAuth();
  }, [router]);

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
          router.push('/first-connection');
          return;
        }
        const admin = data.isAdmin;
        if (admin) {
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
    <div
      className={`
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        relative
        overflow-hidden
        ${
          theme === 'christmas'
            ? 'bg-gradient-to-br from-red-700 via-green-800 to-red-900'
            : 'bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600'
        }
        animate-gradient
      `}
    >
      {/* Snowflakes for Christmas theme */}
      {theme === 'christmas' && <Snowflakes />}

      {/* Main card container with fade-in animation */}
      <div className="w-full max-w-md z-10 animate-fadeInUp">
        {/* Glassmorphism card */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-8
            border
            border-white/20
            ${theme === 'christmas' ? 'animate-glow' : ''}
          `}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {theme === 'christmas' ? (
                <Gift className="w-16 h-16 text-white drop-shadow-lg" />
              ) : (
                <Sparkles className="w-16 h-16 text-white drop-shadow-lg" />
              )}
            </div>
            <h2
              className={`
                text-3xl
                font-bold
                text-white
                drop-shadow-lg
                ${theme === 'christmas' ? 'font-serif' : ''}
              `}
            >
              {theme === 'christmas' ? '🎄 Connexion 🎄' : 'Bienvenue'}
            </h2>
            <p className="mt-2 text-white/80 text-sm">
              Connectez-vous pour accéder aux listes
            </p>
          </div>

          {/* Error message with shake animation */}
          {error && (
            <div
              className="
                mb-6
                p-4
                bg-red-500/90
                text-white
                rounded-lg
                text-center
                font-medium
                animate-shake
                backdrop-blur-sm
              "
            >
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username input */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                Nom d&apos;utilisateur
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/60" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={isLoading}
                className="
                  block
                  w-full
                  pl-12
                  pr-4
                  py-3
                  bg-white/20
                  backdrop-blur-sm
                  border
                  border-white/30
                  rounded-xl
                  text-white
                  placeholder-white/60
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/50
                  focus:border-transparent
                  transition-all
                  duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                placeholder="Nom d'utilisateur"
              />
            </div>

            {/* Password input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/60" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="
                  block
                  w-full
                  pl-12
                  pr-4
                  py-3
                  bg-white/20
                  backdrop-blur-sm
                  border
                  border-white/30
                  rounded-xl
                  text-white
                  placeholder-white/60
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/50
                  focus:border-transparent
                  transition-all
                  duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                placeholder="Mot de passe"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full
                flex
                items-center
                justify-center
                gap-2
                py-3
                px-4
                rounded-xl
                text-white
                font-semibold
                transition-all
                duration-200
                transform
                hover:scale-[1.02]
                active:scale-[0.98]
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:hover:scale-100
                ${
                  theme === 'christmas'
                    ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
                }
              `}
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

          {/* Footer message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70 italic">
              Mot de passe oublié ? Contactez-moi.
            </p>
          </div>
        </div>

        {/* Decorative elements for Christmas theme */}
        {theme === 'christmas' && (
          <div className="mt-4 text-center text-white/60 text-xs">
            ✨ Joyeux Noël ! ✨
          </div>
        )}
      </div>
    </div>
  );
}
