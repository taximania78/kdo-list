'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { AdminIdea } from '@/lib/gifts';
import { toListOptions, type ListOption } from '@/lib/lists';
import FormModifyItem from '@/components/FormModifyItem';
import { DeleteIdeaButton } from '@/components/admin/DeleteIdeaButton';
import { GiftImage } from '@/components/gift/GiftImage';
import { Button, buttonClass } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [ideas, setIdeas] = useState<AdminIdea[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [listOptions, setListOptions] = useState<ListOption[]>([]);
  const [selected, setSelected] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/');
    else if (user && !user.isAdmin) router.push('/list');
  }, [isAuthenticated, user, isLoading, router]);

  // Requête la plus récente : une réponse pour une autre liste est ignorée
  // (chip cliqué deux fois vite, ou en changeant d'avis avant la réponse).
  const latestSlug = useRef('');

  const fetchIdeas = useCallback(async (slug: string) => {
    latestSlug.current = slug;
    try {
      const response = await api.get(`${ApiAdress}/api/kdos-admin/?format=json&list=${encodeURIComponent(slug)}`);
      if (latestSlug.current !== slug) return;
      setIdeas(response.data);
      setLoadError(false);
    } catch (error) {
      if (latestSlug.current !== slug) return;
      console.error('Failed to fetch kdos:', error);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    api
      .get('/api/lists/all/')
      .then((res) => {
        const opts = toListOptions(res.data);
        setListOptions(opts);
        if (opts.length > 0) {
          setSelected(opts[0].value);
          fetchIdeas(opts[0].value);
        } else {
          setIdeas([]);
        }
      })
      .catch((error) => {
        console.error('Failed to load lists:', error);
        setLoadError(true);
      });
  }, [fetchIdeas]);

  const selectList = (slug: string) => {
    setSelected(slug);
    setIdeas(null);
    setLoadError(false);
    fetchIdeas(slug);
  };

  const handleExportCSV = async () => {
    setExportError(null);
    try {
      const response = await api.get(`${ApiAdress}/api/export-csv/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ideas_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setExportError("L'export n'a pas pu être généré.");
    }
  };

  if (isLoading) return <PaperState kind="loading">Chargement…</PaperState>;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageTitle>Modifier les idées</PageTitle>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <Link href="/admin/add" className={buttonClass('primary')}>
            <Plus className="size-4" aria-hidden />
            Ajouter une idée
          </Link>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>
      {exportError && (
        <p role="alert" className="mt-4 w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
          {exportError}
        </p>
      )}

      {/* Retour à la ligne partout ; gap-y-3 : les zones à toucher de 44px des pastilles ne se chevauchent pas. */}
      <div role="group" aria-label="Choisir une liste" className="mt-6 flex flex-wrap gap-x-2 gap-y-3">
        {listOptions.map((opt) => (
          <Chip key={opt.value} pressed={selected === opt.value} onClick={() => selectList(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </div>

      {loadError && <PaperState kind="error">Les idées n&apos;ont pas pu être chargées.</PaperState>}
      {!loadError && !ideas && <PaperState kind="loading">Chargement des idées…</PaperState>}
      {!loadError && ideas?.length === 0 && <PaperState kind="empty">Aucune idée dans cette liste.</PaperState>}
      {!loadError && ideas && ideas.length > 0 && (
        <ul className="mt-4 rounded-lg bg-paper text-ink shadow-paper">
          {ideas.map((idea) => (
            <li
              key={idea.id}
              className="grid grid-cols-[48px_1fr] items-center gap-3 border-t border-line p-3.5 first:border-t-0 md:grid-cols-[64px_1fr_auto] md:gap-4 md:px-5"
            >
              <GiftImage imageDisplay={idea.imageDisplay} name={idea.name} seed={idea.id} sizes="64px" compact className="aspect-square" />
              <div className="min-w-0">
                <p className="font-bold leading-tight break-words">{idea.name}</p>
                <p className="mt-0.5 font-mono text-[12.5px] text-ink-muted">
                  {idea.price != null ? formatPrice(idea.price) : 'sans prix'} · {idea.user || 'liste commune'}
                </p>
              </div>
              <div className="col-start-2 flex gap-4 md:col-start-auto">
                <FormModifyItem kdo={idea} id={idea.id} listOptions={listOptions} onFormSubmit={() => fetchIdeas(selected)} />
                <DeleteIdeaButton id={idea.id} name={idea.name} onDeleted={() => fetchIdeas(selected)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
