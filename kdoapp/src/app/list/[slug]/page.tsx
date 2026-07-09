'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import KdosList from '@/components/KdosList';
import Link from 'next/link';
import { Gift, Sparkles, ArrowLeft } from 'lucide-react';
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

function ListDetail() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading } = useAuth();
  const [listInfo, setListInfo] = useState<GiftListItem | null>(null);
  const [listError, setListError] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchListInfo = async () => {
      try {
        const response = await api.get(`${ApiAdress}/api/lists/`);
        if (response.status === 200) {
          const found = response.data.find((l: GiftListItem) => l.slug === slug);
          if (found) {
            setListInfo(found);
          } else {
            setListError(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch list info:', error);
        setListError(true);
      }
    };

    if (isAuthenticated && slug) {
      fetchListInfo();
    }
  }, [isAuthenticated, slug]);

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

  if (listError) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="surface-card rounded-2xl p-8 shadow-lg text-center max-w-md">
          <p className="text-[var(--text-primary)] text-lg font-medium mb-4">
            Cette liste n&apos;existe pas ou n&apos;est pas accessible.
          </p>
          <Link
            href="/list"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:bg-[var(--primary-hover)] transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux listes
          </Link>
        </div>
      </div>
    );
  }

  const textList = listInfo ? `Liste de ${listInfo.label}` : 'Chargement...';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back link */}
        <div className="mb-6 animate-fadeInUp">
          <Link
            href="/list"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux listes
          </Link>
        </div>

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
              text-3xl sm:text-4xl font-bold
              ${isChristmas
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
        {listInfo && <KdosList listSlug={listInfo.slug} />}
      </div>
    </div>
  );
}

function ListDetailWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ListDetail />
    </Suspense>
  );
}

export default ListDetailWrapper;
