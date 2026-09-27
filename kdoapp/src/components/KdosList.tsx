'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import api from '@/lib/api';
import { getUserInfo } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { filterGifts, giftState, type GiftFilter, type Kdo } from '@/lib/gifts';
import { GiftImage } from '@/components/gift/GiftImage';
import { GiftTag } from '@/components/gift/GiftTag';
import { Chip } from '@/components/ui/Chip';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
const TIE_DURATION_MS = 1400;

function kdosUrl(listSlug: string): string {
  return `${ApiAdress}/api/kdos/?format=json&list=${encodeURIComponent(listSlug)}`;
}

const FILTERS: { key: GiftFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'free', label: 'Libres' },
  { key: 'mine', label: 'Les miens' },
];

type Pending = { kind: 'take' | 'release'; kdo: Kdo };

function sheetCopy({ kind, kdo }: Pending, username: string | null): { title: string; confirmLabel: string; body: ReactNode } {
  if (kind === 'take') {
    return {
      title: "Tu t'en occupes ?",
      confirmLabel: "Oui, je l'emballe",
      body: (
        <div className="grid gap-3.5">
          <div className="grid grid-cols-[72px_1fr] items-center gap-3.5 rounded-lg bg-paper-2 p-3">
            <GiftImage imageDisplay={kdo.imageDisplay} name={kdo.name} seed={kdo.id} sizes="72px" compact className="aspect-square" />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-tight break-words">{kdo.name}</p>
              {kdo.price != null && <p className="mt-1 font-mono text-sm">{formatPrice(kdo.price)}</p>}
            </div>
          </div>
          <p className="font-hand text-[22px] font-semibold text-mine">Personne ne saura que c&apos;est toi.</p>
        </div>
      ),
    };
  }
  if (kdo.takenBy === username) {
    return {
      title: 'Dénouer le ruban ?',
      confirmLabel: 'Oui, dénouer',
      body: (
        <p>
          <strong>{kdo.name}</strong> redeviendra libre pour les autres.
        </p>
      ),
    };
  }
  return {
    title: 'Libérer la réservation ?',
    confirmLabel: 'Oui, libérer',
    body: (
      <p>
        <strong>{kdo.name}</strong> est réservé par {kdo.takenBy}. Il redeviendra libre.
      </p>
    ),
  };
}

export default function KdosList({ listSlug }: { listSlug: string }) {
  const [me] = useState(() => getUserInfo());
  const username = me?.username ?? null;
  const [kdos, setKdos] = useState<Kdo[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<GiftFilter>('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [tyingId, setTyingId] = useState<number | null>(null);

  const fetchKdos = useCallback(async () => {
    try {
      const response = await api.get(kdosUrl(listSlug));
      setKdos(response.data);
      setLoadError(false);
    } catch (error) {
      console.error('Failed to fetch kdos:', error);
      setLoadError(true);
    }
  }, [listSlug]);

  useEffect(() => {
    // Ignore une réponse périmée : si listSlug change avant que cette requête ne
    // revienne, on ne doit pas écraser la liste de la nouvelle liste avec l'ancienne.
    let ignore = false;
    api
      .get(kdosUrl(listSlug))
      .then((response) => {
        if (ignore) return;
        setKdos(response.data);
        setLoadError(false);
      })
      .catch((error) => {
        console.error('Failed to fetch kdos:', error);
        if (!ignore) setLoadError(true);
      });
    return () => {
      ignore = true;
    };
  }, [listSlug]);

  useEffect(() => {
    if (tyingId === null) return;
    const timer = setTimeout(() => setTyingId(null), TIE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [tyingId]);

  const confirmPending = async () => {
    if (!pending) return;
    const endpoint = pending.kind === 'take' ? 'take-api' : 'untake-api';
    try {
      await api.post(`${ApiAdress}/api/${endpoint}/${pending.kdo.id}`);
    } catch (error) {
      await fetchKdos(); // l'état a pu changer entre-temps : on montre le vrai
      throw error; // ConfirmSheet affiche le message et reste ouvert
    }
    await fetchKdos(); // recharge d'abord : le nœud ne démarre que sur la carte déjà réservée
    if (pending.kind === 'take') {
      setTyingId(pending.kdo.id);
      if (filter === 'free') setFilter('all'); // sinon l'idée fraîchement emballée disparaît aussitôt
    }
  };

  if (!kdos && loadError) {
    return <PaperState kind="error">La liste n&apos;a pas pu être chargée. Recharge la page.</PaperState>;
  }
  if (!kdos) return <PaperState kind="loading">Chargement des idées…</PaperState>;
  if (kdos.length === 0) return <PaperState kind="empty">Aucune idée pour l&apos;instant.</PaperState>;

  const counts: Record<GiftFilter, number> = {
    all: kdos.length,
    free: filterGifts(kdos, 'free', username).length,
    mine: filterGifts(kdos, 'mine', username).length,
  };
  const visible = filterGifts(kdos, filter, username);
  const sheet = pending ? sheetCopy(pending, username) : null;

  return (
    <>
      <div role="group" aria-label="Filtrer les idées" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} pressed={filter === f.key} count={counts[f.key]} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <PaperState kind="empty">Rien ici pour l&apos;instant.</PaperState>
      ) : (
        <div className="grid gap-[22px] md:grid-cols-[repeat(auto-fill,minmax(236px,1fr))] md:gap-x-6 md:gap-y-11 md:pt-[18px]">
          {visible.map((kdo) => {
            const state = giftState(kdo, username);
            return (
              <GiftTag
                key={kdo.id}
                kdo={kdo}
                state={state}
                canRelease={state === 'taken' && me?.isAdmin === true}
                tying={tyingId === kdo.id}
                onTake={() => setPending({ kind: 'take', kdo })}
                onRelease={() => setPending({ kind: 'release', kdo })}
              />
            );
          })}
        </div>
      )}

      <ConfirmSheet
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={sheet?.title ?? ''}
        confirmLabel={sheet?.confirmLabel ?? ''}
        onConfirm={confirmPending}
      >
        {sheet?.body}
      </ConfirmSheet>
    </>
  );
}
