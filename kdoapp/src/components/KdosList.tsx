'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { MessageSquareText } from 'lucide-react';
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
const UNTIE_DURATION_MS = 350; // DESIGN.md › Motion : « Dénouer » joue une disparition courte

function kdosUrl(listSlug: string): string {
  return `${ApiAdress}/api/kdos/?format=json&list=${encodeURIComponent(listSlug)}`;
}

const FILTERS: { key: GiftFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'free', label: 'Disponibles' },
  { key: 'mine', label: 'Pris par moi' },
];

type Pending = { kind: 'take' | 'release'; kdo: Kdo };

/** Encart commun aux trois fenêtres : image, nom, prix (et commentaire pour la prise). */
function GiftSummary({ kdo, withComment = false }: { kdo: Kdo; withComment?: boolean }) {
  return (
    <div className="rounded-lg bg-paper-2 p-3">
      <div className="grid grid-cols-[72px_1fr] items-center gap-3.5">
        <GiftImage
          imageDisplay={kdo.imageDisplay}
          name={kdo.name}
          seed={kdo.id}
          sizes="72px"
          compact
          wrapped={!kdo.availability}
          className="aspect-square"
        />
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight break-words">{kdo.name}</p>
          {kdo.price != null && <p className="mt-1 font-mono text-sm">{formatPrice(kdo.price)}</p>}
        </div>
      </div>
      {withComment && kdo.comment && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <MessageSquareText aria-hidden className="mt-[3px] size-4 shrink-0 text-ink-muted" />
          <p className="text-[15px] leading-snug text-ink break-words">{kdo.comment}</p>
        </div>
      )}
    </div>
  );
}

function sheetCopy({ kind, kdo }: Pending, username: string | null): {
  title: string;
  confirmLabel: string;
  confirmVariant: 'primary' | 'outline-primary';
  body: ReactNode;
} {
  if (kind === 'take') {
    return {
      title: 'Tu prends ce cadeau ?',
      confirmLabel: 'Oui, je le prends',
      confirmVariant: 'primary',
      body: (
        <div className="grid gap-3.5">
          <GiftSummary kdo={kdo} withComment />
          <p className="font-hand text-[22px] font-semibold text-mine">Personne ne saura que c&apos;est toi.</p>
        </div>
      ),
    };
  }
  if (kdo.takenBy === username) {
    return {
      title: 'Tu ne prends plus ce cadeau ?',
      confirmLabel: 'Oui, je ne le prends plus',
      confirmVariant: 'outline-primary',
      body: (
        <div className="grid gap-3.5">
          <GiftSummary kdo={kdo} />
          <p>
            <strong>{kdo.name}</strong> redeviendra disponible pour les autres.
          </p>
        </div>
      ),
    };
  }
  return {
    title: 'Libérer la réservation ?',
    confirmLabel: 'Oui, libérer',
    confirmVariant: 'outline-primary',
    body: (
      <div className="grid gap-3.5">
        <GiftSummary kdo={kdo} />
        <p>
          <strong>{kdo.name}</strong> est pris par {kdo.takenBy}. Il redeviendra disponible pour tout le monde.
        </p>
      </div>
    ),
  };
}

export default function KdosList({ listSlug, listLabel }: { listSlug: string; listLabel?: string }) {
  const [me] = useState(() => getUserInfo());
  const username = me?.username ?? null;
  const [kdos, setKdos] = useState<Kdo[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<GiftFilter>('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [tyingId, setTyingId] = useState<number | null>(null);
  const [untyingId, setUntyingId] = useState<number | null>(null);

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

  // Le ruban se dénoue d'abord (350 ms), puis la recharge montre l'idée redevenue libre.
  useEffect(() => {
    if (untyingId === null) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      await fetchKdos();
      if (!cancelled) setUntyingId(null);
    }, UNTIE_DURATION_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [untyingId, fetchKdos]);

  const confirmPending = async () => {
    if (!pending) return;
    const endpoint = pending.kind === 'take' ? 'take-api' : 'untake-api';
    try {
      await api.post(`${ApiAdress}/api/${endpoint}/${pending.kdo.id}`);
    } catch (error) {
      await fetchKdos(); // l'état a pu changer entre-temps : on montre le vrai
      throw error; // ConfirmSheet affiche le message et reste ouvert
    }
    if (pending.kind === 'release') {
      // Le panneau se ferme tout de suite ; la recharge attend la fin de l'animation.
      setUntyingId(pending.kdo.id);
      if (filter === 'mine') setFilter('all'); // sinon l'idée disparaît en plein dénouement
      return;
    }
    await fetchKdos(); // recharge d'abord : le nœud ne démarre que sur la carte déjà réservée
    setTyingId(pending.kdo.id);
    if (filter === 'free') setFilter('all'); // sinon l'idée fraîchement emballée disparaît aussitôt
  };

  if (!kdos && loadError) {
    return <PaperState kind="error">La liste n&apos;a pas pu être chargée. Recharge la page.</PaperState>;
  }
  if (!kdos) return <PaperState kind="loading">Chargement des idées…</PaperState>;
  if (kdos.length === 0) {
    return (
      <PaperState kind="empty">
        {listLabel ? `Aucune idée pour ${listLabel} pour l'instant.` : "Aucune idée pour l'instant."}
      </PaperState>
    );
  }

  const counts: Record<GiftFilter, number> = {
    all: kdos.length,
    free: filterGifts(kdos, 'free', username).length,
    mine: filterGifts(kdos, 'mine', username).length,
  };
  const visible = filterGifts(kdos, filter, username);
  const sheet = pending ? sheetCopy(pending, username) : null;

  return (
    <>
      {/* gap-y-3 : si les filtres passent à la ligne, leurs zones à toucher de 44px ne se chevauchent pas. */}
      <div role="group" aria-label="Filtrer les idées" className="mb-6 flex flex-wrap gap-x-2 gap-y-3">
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
                untying={untyingId === kdo.id}
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
        confirmVariant={sheet?.confirmVariant}
        onConfirm={confirmPending}
      >
        {sheet?.body}
      </ConfirmSheet>
    </>
  );
}
