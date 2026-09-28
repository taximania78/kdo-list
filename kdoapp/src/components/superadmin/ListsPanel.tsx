'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import type { ApiList } from '@/lib/lists';
import type { AppUser } from '@/lib/users';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Field, Input, Select } from '@/components/ui/Field';
import { PaperState } from '@/components/ui/PaperState';
import { Sheet } from '@/components/ui/Sheet';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
const errorClass = 'w-fit rounded-md bg-paper-2 px-3 py-2 text-sm font-semibold text-error';

function OwnerOptions({ users }: { users: AppUser[] }) {
  return (
    <>
      <option value="">Aucun (sans compte)</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </>
  );
}

export function ListsPanel({ users }: { users: AppUser[] }) {
  const [lists, setLists] = useState<ApiList[] | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [togglingSlugs, setTogglingSlugs] = useState<Set<string>>(new Set());
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toEdit, setToEdit] = useState<ApiList | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ApiList | null>(null);

  const fetchSeq = useRef(0); // ignore une réponse arrivée après une plus récente (course entre deux toggles)

  const fetchLists = useCallback(async () => {
    const seq = ++fetchSeq.current;
    try {
      const response = await api.get(`${ApiAdress}/api/lists/all/`);
      if (seq === fetchSeq.current) setLists(response.data);
    } catch (error) {
      console.error('Failed to fetch gift lists:', error);
      if (seq === fetchSeq.current) setLists([]);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await api.post(`${ApiAdress}/api/lists/`, { label: newLabel, owner_id: newOwner ? Number(newOwner) : null });
      setNewLabel('');
      setNewOwner('');
      await fetchLists();
    } catch (error) {
      setCreateError(apiErrorMessage(error, 'Échec de la création'));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (slug: string) => {
    setTogglingSlugs((prev) => new Set(prev).add(slug));
    setToggleError(null);
    try {
      await api.patch(`${ApiAdress}/api/lists/${slug}/toggle`);
      await fetchLists();
    } catch (error) {
      setToggleError(apiErrorMessage(error, "La visibilité n'a pas pu être modifiée."));
    } finally {
      setTogglingSlugs((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  const openEdit = (list: ApiList) => {
    setToEdit(list);
    setEditLabel(list.label);
    setEditOwner(list.owner_id != null ? String(list.owner_id) : '');
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!toEdit) return;
    setSaving(true);
    setEditError(null);
    try {
      const body: { label: string; owner_id?: number | null } = { label: editLabel };
      if (!toEdit.is_common) body.owner_id = editOwner ? Number(editOwner) : null;
      await api.patch(`${ApiAdress}/api/lists/${toEdit.slug}`, body);
      setToEdit(null);
      await fetchLists();
    } catch (error) {
      setEditError(apiErrorMessage(error, 'Échec de la modification'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
        className="grid gap-3 rounded-lg bg-paper p-4 text-ink shadow-paper md:grid-cols-[1fr_1fr_auto] md:items-end md:p-5"
      >
        <Field tone="paper" label="Nom de la liste" htmlFor="new-list-label">
          <Input id="new-list-label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Ex. Léa" />
        </Field>
        <Field tone="paper" label="Propriétaire" htmlFor="new-list-owner">
          <Select id="new-list-owner" value={newOwner} onChange={(e) => setNewOwner(e.target.value)}>
            <OwnerOptions users={users} />
          </Select>
        </Field>
        <Button type="submit" pending={creating} disabled={!newLabel.trim()} className="py-3">
          Créer la liste
        </Button>
        {createError && (
          <p role="alert" className={`${errorClass} md:col-span-3`}>
            {createError}
          </p>
        )}
      </form>

      {toggleError && (
        <p role="alert" className={errorClass}>
          {toggleError}
        </p>
      )}

      {!lists && <PaperState kind="loading">Chargement des listes…</PaperState>}
      {lists?.length === 0 && <PaperState kind="empty">Aucune liste pour l&apos;instant.</PaperState>}
      {lists && lists.length > 0 && (
        <ul className="rounded-lg bg-paper text-ink shadow-paper">
          {lists.map((list) => (
            <li
              key={list.slug}
              className="flex flex-col gap-3 border-t border-line p-4 first:border-t-0 md:flex-row md:items-center md:justify-between md:px-5"
            >
              <div className="min-w-0">
                <p className="font-bold break-words">{list.label}</p>
                <p className="font-mono text-xs text-ink-muted">
                  /{list.slug} · {list.is_common ? 'liste commune' : (list.owner_name ?? 'sans compte')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <button
                  type="button"
                  role="switch"
                  aria-checked={list.enabled}
                  aria-label={`Liste ${list.label} visible`}
                  disabled={togglingSlugs.has(list.slug)}
                  onClick={() => handleToggle(list.slug)}
                  className="group relative -my-2 h-11 w-12 shrink-0 rounded-full disabled:opacity-50"
                >
                  {/* Zone à toucher de 44px ; l'interrupteur visible garde 28px de haut. */}
                  <span className="absolute inset-x-0 top-2 h-7 rounded-full bg-line transition-colors group-aria-checked:bg-mine">
                    <span className="absolute left-1 top-1 size-5 rounded-full bg-paper shadow transition-transform group-aria-checked:translate-x-5" />
                  </span>
                </button>
                <button type="button" onClick={() => openEdit(list)} className="tap-y rounded-md text-primary underline-offset-4 hover:underline">
                  Modifier
                </button>
                {!list.is_common && (
                  <button type="button" onClick={() => setToDelete(list)} className="tap-y rounded-md text-ink-muted hover:text-ink">
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={toEdit !== null}
        onOpenChange={(open) => {
          // Ignore toute fermeture tant qu'un enregistrement est en cours : évite de perdre
          // l'erreur et d'ouvrir un autre panneau avant que la requête en cours ne se termine.
          if (!open && !saving) setToEdit(null);
        }}
        title="Modifier la liste"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEdit();
          }}
          className="mt-5 grid gap-4"
        >
          <Field tone="paper" label="Nom de la liste" htmlFor="edit-list-label">
            <Input id="edit-list-label" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
          </Field>
          {toEdit && !toEdit.is_common && (
            <Field tone="paper" label="Propriétaire" htmlFor="edit-list-owner">
              <Select id="edit-list-owner" value={editOwner} onChange={(e) => setEditOwner(e.target.value)}>
                <OwnerOptions users={users} />
              </Select>
            </Field>
          )}
          {editError && (
            <p role="alert" className={errorClass}>
              {editError}
            </p>
          )}
          <div className="mt-2 grid gap-2.5 md:grid-cols-2">
            <Button type="submit" pending={saving} disabled={!editLabel.trim()} className="md:order-2">
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setToEdit(null)} disabled={saving}>
              Annuler
            </Button>
          </div>
        </form>
      </Sheet>

      <ConfirmSheet
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Supprimer la liste ?"
        confirmLabel="Oui, supprimer"
        onConfirm={async () => {
          if (!toDelete) return;
          await api.delete(`${ApiAdress}/api/lists/${toDelete.slug}`);
          await fetchLists();
        }}
      >
        <p>
          <strong>{toDelete?.label}</strong> et toutes ses idées seront supprimées. Action irréversible.
        </p>
      </ConfirmSheet>
    </div>
  );
}
