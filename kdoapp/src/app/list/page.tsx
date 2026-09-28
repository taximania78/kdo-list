'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { ApiList } from '@/lib/lists';
import { ListBand } from '@/components/ListBand';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function ListSelectorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [lists, setLists] = useState<ApiList[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get(`${ApiAdress}/api/lists/`)
      .then((response) => setLists(response.data))
      .catch((error) => {
        console.error('Failed to fetch lists:', error);
        setLoadError(true);
      });
  }, [isAuthenticated]);

  if (isLoading) return <PaperState kind="loading">Chargement…</PaperState>;
  if (!isAuthenticated) return null;

  return (
    <PageShell>
      <div className="grid gap-7 md:grid-cols-[5fr_7fr] md:items-start md:gap-14 md:pt-6">
        <PageTitle hand="la personne ne saura pas ce que tu lui offres" className="md:sticky md:top-24">
          À qui fait-on plaisir ?
        </PageTitle>
        <div className="grid gap-[18px] pt-1.5">
          {loadError && <PaperState kind="error">Les listes n&apos;ont pas pu être chargées.</PaperState>}
          {!loadError && !lists && <PaperState kind="loading">Chargement des listes…</PaperState>}
          {lists?.length === 0 && <PaperState kind="empty">Aucune liste pour le moment.</PaperState>}
          {lists?.map((list) => <ListBand key={list.slug} list={list} />)}
        </div>
      </div>
    </PageShell>
  );
}
