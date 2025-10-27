'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { Shield, UserPlus, Trash2, Key, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import Snowflakes from '@/components/Snowflakes';

type User = {
  id: number;
  name: string;
};

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
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
  const [usersList, setUsersList] = useState<User[] | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

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

    const apiUrl = `${ApiAdress}/api/delete-user/${userToDelete.id}/`;
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

  // Chargement datas
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div
      className={`
        min-h-screen
        px-4 sm:px-6 lg:px-8
        py-8
        relative overflow-hidden
        ${
          theme === 'christmas'
            ? 'bg-gradient-to-br from-red-700 via-green-800 to-red-900'
            : 'bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600'
        }
        animate-gradient
      `}
    >
      {/* Snowflakes for Christmas theme */}
      {theme === 'christmas' && <Snowflakes />}

      {/* Main container */}
      <div className="max-w-6xl mx-auto z-10 relative">
        {/* Header with glassmorphism */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-6 sm:p-8
            border border-white/20
            mb-6
            ${theme === 'christmas' ? 'animate-glow' : ''}
            animate-fadeInUp
          `}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              <h1
                className={`
                  text-2xl sm:text-3xl lg:text-4xl
                  font-bold
                  text-white
                  drop-shadow-lg
                  ${
                    theme === 'christmas'
                      ? mountains_of_christmas.className
                      : knewave.className
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
                  theme === 'christmas'
                    ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
                }
              `}
            >
              <UserPlus className="w-5 h-5" />
              <span className="whitespace-nowrap">Ajouter un utilisateur</span>
            </Link>
          </div>
        </div>

        {/* Users table with glassmorphism */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            border border-white/20
            overflow-hidden
            ${theme === 'christmas' ? 'animate-glow' : ''}
            animate-fadeInUp
          `}
          style={{ animationDelay: '0.1s' }}
        >
          {!usersList && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Chargement des données...</p>
            </div>
          )}

          {usersList && usersList.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-white text-lg">Aucun utilisateur trouvé.</p>
            </div>
          )}

          {usersList && usersList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={`
                    ${
                      theme === 'christmas'
                        ? 'bg-red-900/30'
                        : 'bg-indigo-900/30'
                    }
                    backdrop-blur-sm
                  `}
                >
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold text-lg">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-right text-white font-semibold text-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {usersList.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-white text-lg font-medium">
                        {user.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Link
                            href={`/admin/superadmin/password/${user.id}?name=${user.name}`}
                            className={`
                              flex items-center gap-2
                              p-2 px-4
                              rounded-lg
                              transition-all duration-200
                              ${
                                theme === 'christmas'
                                  ? 'bg-green-500/80 hover:bg-green-600'
                                  : 'bg-sky-500/80 hover:bg-sky-600'
                              }
                              text-white backdrop-blur-sm
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
                              bg-red-500/80 hover:bg-red-600
                              text-white
                              transition-all duration-200
                              backdrop-blur-sm
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
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/90 z-50 animate-overlayShow"
            onClick={handleDeleteCancel}
          />

          {/* Dialog content */}
          <div
            className={`
              relative
              max-w-md w-full
              backdrop-blur-lg
              ${
                theme === 'christmas'
                  ? 'bg-red-900/90'
                  : 'bg-indigo-900/90'
              }
              rounded-2xl
              p-8
              border border-white/20
              shadow-2xl
              animate-fadeInUp
            `}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-white/80 mb-6">
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              <span className="font-bold text-white">
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
                  bg-white/20
                  hover:bg-white/30
                  text-white
                  transition-all duration-200
                  backdrop-blur-sm
                  disabled:opacity-50
                  disabled:cursor-not-allowed
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
                  bg-red-600 hover:bg-red-700
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
    </div>
  );
}

export default Superadmin;
