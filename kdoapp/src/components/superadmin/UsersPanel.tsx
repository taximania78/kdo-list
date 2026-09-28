'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import type { AppUser } from '@/lib/users';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
const actionClass = 'text-primary underline-offset-4 hover:underline';

type UsersPanelProps = { users: AppUser[] | null; meId: number | null; onChanged: () => void };

function roleLabel(user: AppUser): string {
  if (user.isMegaAdmin) return 'super admin';
  return user.isAdmin ? 'admin' : 'famille';
}

export function UsersPanel({ users, meId, onChanged }: UsersPanelProps) {
  const [toDelete, setToDelete] = useState<AppUser | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<Set<number>>(new Set());
  const roleBusy = useRef<Set<number>>(new Set()); // garde par personne contre le double appui, avant même le re-rendu

  const toggleRole = async (user: AppUser) => {
    if (roleBusy.current.has(user.id)) return;
    roleBusy.current.add(user.id);
    setRoleError(null);
    setRoleUpdating((prev) => new Set(prev).add(user.id));
    try {
      await api.patch(`${ApiAdress}/api/users/${user.id}/role`, { isAdmin: !user.isAdmin });
      onChanged();
    } catch (error) {
      setRoleError(apiErrorMessage(error, "Le rôle n'a pas pu être modifié."));
    } finally {
      roleBusy.current.delete(user.id);
      setRoleUpdating((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  if (!users) return <PaperState kind="loading">Chargement des personnes…</PaperState>;
  if (users.length === 0) return <PaperState kind="empty">Aucune personne pour l&apos;instant.</PaperState>;

  return (
    <>
      {roleError && (
        <p role="alert" className="mb-4 w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
          {roleError}
        </p>
      )}
      <ul className="rounded-lg bg-paper text-ink shadow-paper">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-2 border-t border-line p-4 first:border-t-0 md:flex-row md:items-center md:justify-between md:px-5"
          >
            <div className="min-w-0">
              <p className="font-bold break-words">{user.name}</p>
              <p className="font-mono text-xs text-ink-muted">{roleLabel(user)}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
              {!user.isMegaAdmin && user.id !== meId && (
                <button
                  type="button"
                  onClick={() => toggleRole(user)}
                  disabled={roleUpdating.has(user.id)}
                  className={`${actionClass} disabled:pointer-events-none disabled:opacity-50`}
                >
                  {user.isAdmin ? 'Retirer admin' : 'Rendre admin'}
                </button>
              )}
              <Link
                href={`/admin/superadmin/password/${user.id}?name=${encodeURIComponent(user.name)}`}
                className={actionClass}
              >
                Mot de passe
              </Link>
              {user.id !== meId && (
                <button type="button" onClick={() => setToDelete(user)} className="text-ink-muted hover:text-ink">
                  Supprimer
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmSheet
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Supprimer cette personne ?"
        confirmLabel="Oui, supprimer"
        onConfirm={async () => {
          if (!toDelete) return;
          await api.delete(`${ApiAdress}/api/delete-user/${toDelete.id}`);
          onChanged();
        }}
      >
        <p>
          <strong>{toDelete?.name}</strong> ne pourra plus se connecter et les cadeaux qu&apos;elle a pris redeviendront
          disponibles. Action irréversible.
        </p>
      </ConfirmSheet>
    </>
  );
}
