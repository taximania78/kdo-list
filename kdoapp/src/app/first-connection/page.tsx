'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { KeyRound, Gift, Sparkles } from 'lucide-react';
import { isChristmas, themeConfig } from '@/lib/theme';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldShowPage(true);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading during auth check
  if (isLoading || !shouldShowPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface-card rounded-2xl p-8 border border-[var(--border)] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text-primary)] text-lg font-medium">Chargement...</p>
          </div>
        </div>
      </div>
    );
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
      "
    >
      {/* Main card container with fade-in animation */}
      <div className="w-full max-w-md z-10 animate-fadeInUp">
        {/* Card */}
        <div
          className={`
            rounded-3xl
            shadow-xl
            p-8
            border
            ${isChristmas
              ? 'backdrop-blur-lg bg-white/10 border-white/20 animate-glow'
              : 'surface-card border-[var(--border)]'
            }
          `}
        >
          {/* Header with icon */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {isChristmas ? (
                <Gift className="w-16 h-16 text-white drop-shadow-lg" />
              ) : (
                <Sparkles className="w-16 h-16 text-[var(--primary)]" />
              )}
            </div>
            <h1
              className={`
                text-3xl
                font-bold
                mb-4
                ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--text-primary)]'}
              `}
            >
              {themeConfig.titleEmoji ? `${themeConfig.titleEmoji} ` : ''}
              Première connexion
              {themeConfig.titleEmoji ? ` ${themeConfig.titleEmoji}` : ''}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <KeyRound className={`w-5 h-5 ${isChristmas ? 'text-white/80' : 'text-[var(--primary)]'}`} />
              <p className={`text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                Sécurisez votre compte
              </p>
            </div>
            <p className={`text-sm ${isChristmas ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
              C&apos;est votre première connexion. Vous devez changer votre mot
              de passe pour des raisons de sécurité.
            </p>
          </div>

          {/* Password change form */}
          <FormModifyPwd firstConnection />
        </div>

        {/* Decorative elements for Christmas theme */}
        {isChristmas && (
          <div className="mt-4 text-center text-white/60 text-xs">
            ✨ Joyeux Noël ! ✨
          </div>
        )}
      </div>
    </div>
  );
}
