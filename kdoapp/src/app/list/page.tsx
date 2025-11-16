'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import KdosList from '@/components/KdosList';
import { useSearchParams } from 'next/navigation';
import { Gift, Sparkles } from 'lucide-react';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

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
        className={`
          min-h-screen
          px-4
          sm:px-6
          lg:px-8
          py-8
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

        {/* Main content container */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-8 animate-fadeInUp">
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
                sm:text-4xl
                font-bold
                text-white
                drop-shadow-lg
                ${
                  theme === 'christmas'
                    ? mountains_of_christmas.className
                    : knewave.className
                }
              `}
            >
              {theme === 'christmas' ? '🎄 ' : ''}
              {textList}
              {theme === 'christmas' ? ' 🎄' : ''}
            </h1>
            <p className="mt-2 text-white/80 text-sm">
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
