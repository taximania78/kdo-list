'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { Lock } from 'lucide-react';
import { isChristmas } from '@/lib/theme';

export default function ChangePassword() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [CHANGE-PASSWORD] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isAdmin) {
        console.log('🚫 [CHANGE-PASSWORD] Not admin, redirecting to list');
        router.push('/list');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
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

  if (!isAuthenticated) return null;

  return (
    <div
      className="
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        py-8
      "
    >
      <div className="w-full max-w-md z-10">
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
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Lock className={`w-16 h-16 ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--primary)]'}`} />
            </div>
            <h1 className={`text-3xl font-bold ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--text-primary)]'}`}>
              Modifier mon mot de passe
            </h1>
            <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
              Saisissez votre nouveau mot de passe
            </p>
          </div>

          {/* Form component */}
          <FormModifyPwd />
        </div>
      </div>
    </div>
  );
}
