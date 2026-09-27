'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

type DeleteIdeaButtonProps = { id: number; name: string; onDeleted: () => void };

export function DeleteIdeaButton({ id, name, onDeleted }: DeleteIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-ink-muted hover:text-ink">
        Supprimer
      </button>
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Supprimer l'idée ?"
        confirmLabel="Oui, supprimer"
        onConfirm={async () => {
          await api.delete(`${ApiAdress}/api/delete-item/${id}/`);
          onDeleted();
        }}
      >
        <p>
          <strong>{name}</strong> sera retirée de la liste. Action irréversible.
        </p>
      </ConfirmSheet>
    </>
  );
}
