'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import KdosList from '@/components/KdosList';
import { useSearchParams } from 'next/navigation';
import { Gift, Sparkles } from 'lucide-react';
import { isChristmas, themeConfig } from '@/lib/theme';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

function List() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const userQuery = searchParams.get('user');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚫 [LIST] Not authenticated, redirecting to login');
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading during auth check
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
  let textList: string;
  if (userQuery == 'Mathieu') {
    textList = 'Liste de Mathieu';
  } else if (userQuery == 'Personne') {
    textList = 'Liste de Personne';
  } else {
    textList = 'Liste de Personne & Mathieu';
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        className="
          px-4
          sm:px-6
          lg:px-8
          py-8
        "
      >
        {/* Main content container */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-8 animate-fadeInUp">
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
                sm:text-4xl
                font-bold
                ${
                  isChristmas
                    ? `text-white drop-shadow-lg ${mountains_of_christmas.className}`
                    : `text-[var(--text-primary)] ${knewave.className}`
                }
              `}
            >
              {themeConfig.titleEmoji ? `${themeConfig.titleEmoji} ` : ''}
              {textList}
              {themeConfig.titleEmoji ? ` ${themeConfig.titleEmoji}` : ''}
            </h1>
            <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
              Découvrez les idées cadeaux et réservez vos préférés
            </p>
          </div>

          {/* Gift list component */}
          <KdosList />
        </div>
      </div>
    </Suspense>
  );
}

// Si List est utilisé comme page, pensez à créer un composant parent pour List
function ListWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <List />
    </Suspense>
  );
}

export default ListWrapper;
