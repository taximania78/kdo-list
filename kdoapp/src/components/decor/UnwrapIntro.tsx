'use client';

import { useEffect, useState } from 'react';
import { Bow } from '@/components/gift/Bow';

const STORAGE_KEY = 'kdo-unwrapped';
const CLOSED_MS = 500;
const OPENING_MS = 1100;

type Phase = 'hidden' | 'closed' | 'opening';

/** Une fois par session ; jamais si le stockage est indisponible ou dans un navigateur automatisé (e2e). */
export function shouldPlayUnwrap(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  automated: boolean
): boolean {
  if (!storage || automated) return false;
  try {
    if (storage.getItem(STORAGE_KEY)) return false;
    storage.setItem(STORAGE_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function sessionStorageOrNull(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export default function UnwrapIntro() {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    if (!shouldPlayUnwrap(sessionStorageOrNull(), navigator.webdriver === true)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('closed');
  }, []);

  // Les minuteries dépendent de la phase : sûr en mode strict (effets rejoués en dev).
  useEffect(() => {
    if (phase === 'hidden') return;
    const timer = setTimeout(
      () => setPhase(phase === 'closed' ? 'opening' : 'hidden'),
      phase === 'closed' ? CLOSED_MS : OPENING_MS
    );
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'hidden') return null;

  return (
    <div
      data-testid="unwrap"
      aria-hidden
      className={`unwrap ${phase === 'opening' ? 'is-opening' : ''}`}
      onClick={() => setPhase('opening')}
    >
      <div className="unwrap-flap unwrap-flap-l" />
      <div className="unwrap-flap unwrap-flap-r" />
      <div className="unwrap-rib-v" />
      <div className="unwrap-rib-h" />
      <Bow className="unwrap-bow" />
      <p className="unwrap-hint">Toucher pour ouvrir</p>
    </div>
  );
}
