'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { Shield, UserPlus, Trash2, Key, Loader2, ListChecks } from 'lucide-react';
import api from '@/lib/api';
import { isChristmas } from '@/lib/theme';

type User = {
  id: number;
  name: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
};

type GiftListItem = {
  slug: string;
  label: string;
  owner_id: number | null;
  owner_name: string | null;
  is_common: boolean;
  enabled: boolean;
};

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

function Superadmin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { user: me } = useAuth();
  const [usersList, setUsersList] = useState<User[] | null>(null);
  const [giftLists, setGiftLists] = useState<GiftListItem[] | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [newListLabel, setNewListLabel] = useState('');
  const [newListOwner, setNewListOwner] = useState<string>('');
  const [listError, setListError] = useState<string | null>(null);
  const [listToDelete, setListToDelete] = useState<GiftListItem | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [SUPERADMIN] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isMegaAdmin) {
        console.log('🚫 [SUPERADMIN] Not super admin, redirecting to admin');
        router.push('/admin');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const fetchUsers = async () => {
    const apiUrl = `${ApiAdress}/api/users/`;

    try {
      const response = await api.get(apiUrl);
      console.log('Response status:', response.status);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }
      const data: User[] = response.data;
      setUsersList(data);
    } catch (error) {
      console.error('Failed to fetch kdos:', error);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setUserToDelete({ id, name });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    const apiUrl = `${ApiAdress}/api/delete-user/${userToDelete.id}`;
    setIsDeleting(userToDelete.id);

    try {
      const response = await api.delete(apiUrl);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }
      console.log('User deleted successfully');
      fetchUsers(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(null);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  const fetchGiftLists = async () => {
    try {
      const response = await api.get(`${ApiAdress}/api/lists/all/`);
      if (response.status >= 200 && response.status < 300) {
        setGiftLists(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch gift lists:', error);
    }
  };

  const handleToggleList = async (slug: string) => {
    setTogglingSlug(slug);
    try {
      const response = await api.patch(`${ApiAdress}/api/lists/${slug}/toggle`);
      if (response.status >= 200 && response.status < 300) {
        fetchGiftLists();
      }
    } catch (error) {
      console.error('Error toggling list:', error);
    } finally {
      setTogglingSlug(null);
    }
  };

  const handleCreateList = async () => {
    setListError(null);
    try {
      await api.post(`${ApiAdress}/api/lists/`, {
        label: newListLabel,
        owner_id: newListOwner ? Number(newListOwner) : null,
      });
      setNewListLabel('');
      setNewListOwner('');
      fetchGiftLists();
    } catch (error: unknown) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setListError(detail ?? 'Échec de la création');
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await api.delete(`${ApiAdress}/api/lists/${listToDelete.slug}`);
      fetchGiftLists();
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setListToDelete(null);
    }
  };

  const handleToggleRole = async (user: User, makeAdmin: boolean) => {
    try {
      await api.patch(`${ApiAdress}/api/users/${user.id}/role`, { isAdmin: makeAdmin });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Chargement datas
  useEffect(() => {
    fetchUsers();
    fetchGiftLists();
  }, []);

  return (
    <div
      className="
        px-4
        sm:px-6
        lg:px-8
        py-8
      "
    >
      {/* Main container */}
      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Header */}
        <div
          className="
            rounded-3xl
            shadow-xl
            p-6 sm:p-8
            border
            mb-6
            animate-fadeInUp
            surface-card
            border-[var(--border)]
          "
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Shield className={`w-10 h-10 sm:w-12 sm:h-12 ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--primary)]'}`} />
              <h1
                className={`
                  text-2xl sm:text-3xl lg:text-4xl
                  font-bold
                  ${
                    isChristmas
                      ? `text-white drop-shadow-lg ${mountains_of_christmas.className}`
                      : `text-[var(--text-primary)] ${knewave.className}`
                  }
                `}
              >
                Super Admin
              </h1>
            </div>
            <Link
              href="/admin/superadmin/add-user"
              className={`
                flex items-center gap-2
                py-3 px-6
                rounded-xl
                text-white font-semibold
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                ${
                  isChristmas
                    ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg'
                    : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-primary)]'
                }
              `}
            >
              <UserPlus className="w-5 h-5" />
              <span className="whitespace-nowrap">Ajouter un utilisateur</span>
            </Link>
          </div>
        </div>

        {/* Users table */}
        <div
          className="
            rounded-3xl
            shadow-xl
            border
            overflow-hidden
            animate-fadeInUp
            surface-card
            border-[var(--border)]
          "
          style={{ animationDelay: '0.1s' }}
        >
          {!usersList && (
            <div className="p-8 text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${isChristmas ? 'text-white' : 'text-[var(--primary)]'}`} />
              <p className={`text-lg ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>Chargement des données...</p>
            </div>
          )}

          {usersList && usersList.length === 0 && (
            <div className="p-8 text-center">
              <p className={`text-lg ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>Aucun utilisateur trouvé.</p>
            </div>
          )}

          {usersList && usersList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--table-header)]">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-lg text-[var(--text-primary)]">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-lg text-[var(--text-primary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {usersList.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <td className="px-6 py-4 text-lg font-medium text-[var(--text-primary)]">
                        {user.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {!user.isMegaAdmin && user.id !== me?.sub && (
                            <button
                              onClick={() => handleToggleRole(user, !user.isAdmin)}
                              className="flex items-center gap-2 p-2 px-4 rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-white"
                              title={user.isAdmin ? 'Retirer admin' : 'Promouvoir admin'}
                            >
                              <Shield className="w-4 h-4" />
                              <span className="hidden sm:inline">{user.isAdmin ? 'Admin ✓' : 'Admin'}</span>
                            </button>
                          )}
                          <Link
                            href={`/admin/superadmin/password/${user.id}?name=${user.name}`}
                            className={`
                              flex items-center gap-2
                              p-2 px-4
                              rounded-lg
                              transition-all duration-200
                              ${
                                isChristmas
                                  ? 'bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]'
                                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                              }
                              text-white
                              hover:scale-105
                            `}
                            title="Modifier le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                            <span className="hidden sm:inline">Mot de passe</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(user.id, user.name)}
                            disabled={isDeleting === user.id}
                            className="
                              flex items-center gap-2
                              p-2 px-4
                              rounded-lg
                              bg-[var(--danger)] hover:bg-[var(--danger-hover)]
                              text-white
                              transition-all duration-200
                              hover:scale-105
                              disabled:opacity-50
                              disabled:cursor-not-allowed
                              disabled:hover:scale-100
                            "
                            title="Supprimer l'utilisateur"
                          >
                            {isDeleting === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Supprimer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gift Lists Management */}
        <div
          className="
            rounded-3xl
            shadow-xl
            border
            overflow-hidden
            animate-fadeInUp
            surface-card
            border-[var(--border)]
            mt-6
          "
          style={{ animationDelay: '0.2s' }}
        >
          <div className="p-6 sm:p-8 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <ListChecks className={`w-6 h-6 ${isChristmas ? 'text-white' : 'text-[var(--primary)]'}`} />
              <h2 className={`text-xl font-bold ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                Gestion des listes
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nom de la liste</label>
              <input
                value={newListLabel}
                onChange={(e) => setNewListLabel(e.target.value)}
                placeholder="ex. Léa"
                className="w-full rounded-lg px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Propriétaire</label>
              <select
                value={newListOwner}
                onChange={(e) => setNewListOwner(e.target.value)}
                className="w-full rounded-lg px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                <option value="">Aucun (sans compte)</option>
                {(usersList ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateList}
              disabled={!newListLabel.trim()}
              className="py-2 px-6 rounded-lg text-white font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              Créer
            </button>
          </div>
          {listError && <p className="px-6 pt-3 text-sm text-[var(--error)]">{listError}</p>}

          {!giftLists && (
            <div className="p-8 text-center">
              <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-4 ${isChristmas ? 'text-white' : 'text-[var(--primary)]'}`} />
              <p className={`text-lg ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>Chargement des listes...</p>
            </div>
          )}

          {giftLists && giftLists.length > 0 && (
            <div className="divide-y divide-[var(--border)]">
              {giftLists.map((gList) => (
                <div
                  key={gList.slug}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <div>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {gList.label}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      /{gList.slug}
                      {gList.is_common ? ' — Liste commune' : gList.owner_name ? ` — ${gList.owner_name}` : ' — Sans compte'}
                    </p>
                  </div>
                  <div className="flex items-center">
                  <button
                    onClick={() => handleToggleList(gList.slug)}
                    disabled={togglingSlug === gList.slug}
                    className="relative"
                    title={gList.enabled ? 'Désactiver' : 'Activer'}
                  >
                    {togglingSlug === gList.slug ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <div
                        className={`
                          w-12 h-7 rounded-full
                          transition-all duration-300 cursor-pointer
                          flex items-center px-1
                          ${gList.enabled
                            ? 'bg-[var(--success)]'
                            : 'bg-[var(--border)]'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 rounded-full bg-white shadow-md
                            transition-transform duration-300
                            ${gList.enabled ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </div>
                    )}
                  </button>
                  {!gList.is_common && (
                    <button
                      onClick={() => setListToDelete(gList)}
                      className="ml-3 p-2 rounded-lg bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white"
                      title="Supprimer la liste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 animate-overlayShow"
            onClick={handleDeleteCancel}
          />

          {/* Dialog content */}
          <div
            className="
              relative
              z-50
              max-w-md w-full
              rounded-2xl
              p-8
              shadow-xl
              animate-fadeInUp
              dialog-surface
            "
          >
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              Confirmer la suppression
            </h3>
            <p className="mb-6 text-[var(--text-secondary)]">
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              <span className="font-bold text-[var(--text-primary)]">
                &quot;{userToDelete.name}&quot;
              </span>{' '}
              ? Cette action est irréversible.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting !== null}
                className="
                  px-6 py-2
                  rounded-lg
                  transition-all duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]
                "
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting !== null}
                className="
                  flex items-center gap-2
                  px-6 py-2
                  rounded-lg
                  bg-[var(--danger)] hover:bg-[var(--danger-hover)]
                  text-white
                  transition-all duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {isDeleting !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 animate-overlayShow" onClick={() => setListToDelete(null)} />
          <div className="relative z-50 max-w-md w-full rounded-2xl p-8 shadow-xl animate-fadeInUp dialog-surface">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Supprimer la liste</h3>
            <p className="mb-6 text-[var(--text-secondary)]">
              Supprimer <span className="font-bold text-[var(--text-primary)]">&quot;{listToDelete.label}&quot;</span>{' '}
              supprimera aussi toutes ses idées. Action irréversible.
            </p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setListToDelete(null)} className="px-6 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]">Annuler</button>
              <button onClick={handleDeleteList} className="px-6 py-2 rounded-lg bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Superadmin;
