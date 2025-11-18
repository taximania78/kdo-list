'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { KeyRound, Gift, Sparkles } from 'lucide-react';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

export default function FirstConnection() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [shouldShowPage, setShouldShowPage] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    // Check if this is a legitimate first-connection flow
    const requirePasswordChange = sessionStorage.getItem('requirePasswordChange');

    if (!isAuthenticated) {
      // Not logged in → redirect to login
      console.log('🚫 [FIRST-CONNECTION] Not authenticated, redirecting to login');
      router.push('/');
    } else if (!requirePasswordChange) {
      // Logged in but not first-connection → redirect to normal page
      console.log('🚫 [FIRST-CONNECTION] No password change required, redirecting');
      router.push(user?.isAdmin ? '/admin' : '/list');
    } else {
      // Valid first-connection flow
      console.log('✅ [FIRST-CONNECTION] Valid first-connection flow');
      setShouldShowPage(true);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading during auth check
  if (isLoading || !shouldShowPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-indigo-600">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${theme === 'christmas' ? 'min-h-[calc(100vh+7rem)]' : 'min-h-screen'}
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
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {theme === 'christmas' ? (
                <Gift className="w-16 h-16 text-white drop-shadow-lg" />
              ) : (
                <Sparkles className="w-16 h-16 text-white drop-shadow-lg" />
              )}
            </div>
            <h1
              className={`
                text-3xl
                font-bold
                text-white
                drop-shadow-lg
                mb-4
              `}
            >
              {theme === 'christmas' ? '🎄 ' : ''}
              Première connexion
              {theme === 'christmas' ? ' 🎄' : ''}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-white/80" />
              <p className="text-white/80 text-sm">
                Sécurisez votre compte
              </p>
            </div>
            <p className="text-white/70 text-sm">
              C&apos;est votre première connexion. Vous devez changer votre mot
              de passe pour des raisons de sécurité.
            </p>
          </div>

          {/* Password change form */}
          <FormModifyPwd firstConnection />
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
