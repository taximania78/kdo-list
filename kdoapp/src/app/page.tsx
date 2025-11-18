'use client';

import { useEffect, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, LogIn, Gift, Sparkles } from 'lucide-react';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // User already logged in, redirect based on role
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
          // Set temporary flag for first-connection page validation
          sessionStorage.setItem('requirePasswordChange', 'true');
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
      className="
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        relative
      "
    >
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
