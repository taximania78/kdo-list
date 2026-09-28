'use client';

import { useRef, useState, type ReactNode } from 'react';
import { apiErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';

type ConfirmSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** « ghost » pour une annulation (ne plus prendre, libérer) : le rouge reste aux actions principales. */
  confirmVariant?: 'primary' | 'ghost';
  onConfirm: () => Promise<void>;
  children?: ReactNode;
};

export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  confirmLabel,
  cancelLabel = 'Annuler',
  confirmVariant = 'primary',
  onConfirm,
  children,
}: ConfirmSheetProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false); // garde contre le double appui, avant même le re-rendu

  const handleOpenChange = (next: boolean) => {
    // Ignore toute demande de fermeture (Échap, clic sur l'overlay, Annuler)
    // tant qu'une confirmation est en cours : évite qu'une erreur arrive
    // après coup sur un panneau déjà fermé et y laisse un état périmé.
    if (!next && busy.current) return;
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} title={title} description={children}>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-paper-2 px-3 py-2 text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-2.5 md:grid-cols-2">
        <Button variant={confirmVariant} onClick={confirm} pending={pending} className="md:order-2">
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={pending}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  );
}
