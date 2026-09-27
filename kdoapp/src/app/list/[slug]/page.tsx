'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { ApiList } from '@/lib/lists';
import KdosList from '@/components/KdosList';
import { buttonClass } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const backLinkClass =
  'mb-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-bg-muted hover:text-on-bg';

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading } = useAuth();
  const [list, setList] = useState<ApiList | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !slug) return;
    api
      .get(`${ApiAdress}/api/lists/`)
      .then((response) => {
        const found = (response.data as ApiList[]).find((l) => l.slug === slug);
        if (found) setList(found);
        else setNotFound(true);
      })
      .catch((error) => {
        console.error('Failed to fetch list info:', error);
        setNotFound(true);
      });
  }, [isAuthenticated, slug]);

  if (isLoading) return <PaperState kind="loading">Chargement…</PaperState>;
  if (!isAuthenticated) return null;

  if (notFound) {
    return (
      <PageShell narrow>
        <PaperState kind="empty">Cette liste n&apos;existe pas ou n&apos;est pas accessible.</PaperState>
        <div className="text-center">
          <Link href="/list" className={buttonClass('primary')}>
            <ArrowLeft className="size-4" aria-hidden />
            Toutes les listes
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!list) return <PaperState kind="loading">Chargement de la liste…</PaperState>;

  return (
    <PageShell>
      <Link href="/list" className={backLinkClass}>
        <ArrowLeft className="size-4" aria-hidden />
        Toutes les listes
      </Link>
      <p className="text-[17px] text-on-bg-muted">{list.is_common ? 'Pour tout le monde' : 'Les envies de'}</p>
      <h1 className="-ml-1 mb-5 mt-0.5 font-display text-[clamp(72px,22vw,190px)] font-extrabold leading-[0.85] tracking-[-0.035em] break-words md:text-[clamp(110px,14vw,210px)]">
        {list.label}
      </h1>
      <KdosList listSlug={list.slug} listLabel={list.label} />
    </PageShell>
  );
}
