'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import Link from 'next/link';
import { Gift, Sparkles, Users, ChevronRight } from 'lucide-react';
import { isChristmas, themeConfig } from '@/lib/theme';
import api from '@/lib/api';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

type GiftListItem = {
  slug: string;
  label: string;
  user_name: string | null;
  enabled: boolean;
};

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const listIcons: Record<string, React.ReactNode> = {
  'marie-eve': <Gift className="w-10 h-10" />,
  'mathieu': <Gift className="w-10 h-10" />,
  'commune': <Users className="w-10 h-10" />,
};

const getListColors = (slug: string) => {
  if (isChristmas) {
    if (slug === 'marie-eve') {
      return {
        gradient: 'from-red-600/30 to-red-800/50',
        hoverGradient: 'from-red-500/40 to-red-700/60',
        iconBg: 'bg-red-500/30',
        iconColor: 'text-red-100',
      };
    }
    if (slug === 'mathieu') {
      return {
        gradient: 'from-green-600/30 to-green-800/50',
        hoverGradient: 'from-green-500/40 to-green-700/60',
        iconBg: 'bg-green-500/30',
        iconColor: 'text-green-100',
      };
    }
    return {
      gradient: 'from-amber-600/30 to-amber-800/50',
      hoverGradient: 'from-amber-500/40 to-amber-700/60',
      iconBg: 'bg-amber-500/30',
      iconColor: 'text-amber-100',
    };
  }

  // Default theme
  if (slug === 'marie-eve') {
    return {
      gradient: 'from-[#F5CAC3] to-[#F28482]',
      hoverGradient: 'from-[#F28482] to-[#E07270]',
      iconBg: 'bg-[#F28482]/20',
      iconColor: 'text-[var(--text-primary)]',
    };
  }
  if (slug === 'mathieu') {
    return {
      gradient: 'from-[#B8CCC7] to-[#84A59D]',
      hoverGradient: 'from-[#84A59D] to-[#6B8B83]',
      iconBg: 'bg-[#84A59D]/20',
      iconColor: 'text-[var(--text-primary)]',
    };
  }
  return {
    gradient: 'from-[#F5E6CC] to-[#E8B86D]',
    hoverGradient: 'from-[#E8B86D] to-[#D4A054]',
    iconBg: 'bg-[#E8B86D]/20',
    iconColor: 'text-[var(--text-primary)]',
  };
};

function ListSelector() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [lists, setLists] = useState<GiftListItem[] | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await api.get(`${ApiAdress}/api/lists/`);
        if (response.status === 200) {
          setLists(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      }
    };

    if (isAuthenticated) {
      fetchLists();
    }
  }, [isAuthenticated]);

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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="flex justify-center mb-4">
            {isChristmas ? (
              <Gift className="w-16 h-16 text-white drop-shadow-lg" />
            ) : (
              <Sparkles className="w-16 h-16 text-[var(--primary)]" />
            )}
          </div>
          <h1
            className={`
              text-3xl sm:text-4xl font-bold
              ${isChristmas
                ? `text-white drop-shadow-lg ${mountains_of_christmas.className}`
                : `text-[var(--text-primary)] ${knewave.className}`
              }
            `}
          >
            {themeConfig.titleEmoji ? `${themeConfig.titleEmoji} ` : ''}
            Choisissez une liste
            {themeConfig.titleEmoji ? ` ${themeConfig.titleEmoji}` : ''}
          </h1>
          <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
            Sélectionnez la liste que vous souhaitez consulter
          </p>
        </div>

        {/* Loading state */}
        {!lists && (
          <div className="flex items-center justify-center py-12">
            <div className="surface-card rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-[var(--text-primary)] text-lg font-medium">
                  Chargement des listes...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {lists && lists.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="surface-card rounded-2xl p-8 shadow-lg text-center">
              <p className="text-[var(--text-primary)] text-lg font-medium">
                Aucune liste disponible pour le moment.
              </p>
            </div>
          </div>
        )}

        {/* List cards grid */}
        {lists && lists.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {lists.map((list, index) => {
              const colors = getListColors(list.slug);
              const icon = listIcons[list.slug] || <Gift className="w-10 h-10" />;

              return (
                <Link
                  key={list.slug}
                  href={`/list/${list.slug}`}
                  className="group animate-fadeInUp w-full max-w-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`
                      surface-card rounded-3xl shadow-lg p-8
                      flex flex-col items-center justify-center
                      text-center gap-5
                      transition-all duration-300
                      hover:scale-[1.04] hover:shadow-2xl
                      cursor-pointer
                      min-h-[220px]
                      relative overflow-hidden
                    `}
                  >
                    {/* Gradient decoration */}
                    <div
                      className={`
                        absolute inset-0 opacity-0 group-hover:opacity-100
                        transition-opacity duration-500
                        bg-gradient-to-br ${colors.gradient}
                      `}
                      style={{ opacity: 0.08 }}
                    />
                    <div
                      className={`
                        absolute inset-0 opacity-0 group-hover:opacity-[0.12]
                        transition-opacity duration-500
                        bg-gradient-to-br ${colors.hoverGradient}
                      `}
                    />

                    {/* Icon */}
                    <div
                      className={`
                        ${colors.iconBg}
                        ${colors.iconColor}
                        rounded-2xl p-4
                        transition-all duration-300
                        group-hover:scale-110
                        shadow-sm
                      `}
                    >
                      {icon}
                    </div>

                    {/* Label */}
                    <div className="relative z-10">
                      <h2 className={`text-xl font-bold mb-1 ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                        {list.label}
                      </h2>
                      <p className={`text-sm ${isChristmas ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                        Voir les idées cadeaux
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className="
                        w-5 h-5 text-[var(--text-muted)]
                        absolute right-4 top-1/2 -translate-y-1/2
                        opacity-0 group-hover:opacity-100
                        transition-all duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ListSelectorWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ListSelector />
    </Suspense>
  );
}

export default ListSelectorWrapper;
