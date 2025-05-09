'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { FaPlus } from 'react-icons/fa6';
import api from '@/lib/api';

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

  const handleDelete = async (id: number, name: string) => {
    const apiUrl = `${ApiAdress}/api/delete-user/${id}/`;

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'utilisateur "${name}" ?`
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(apiUrl);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }
      console.log('User deleted successfully');
      fetchUsers(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Chargement datas
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-8 mt-1">
        <h1 className="sm:text-4xl text-3xl font-bold text-center">
          <span
            className={
              theme === 'christmas'
                ? mountains_of_christmas.className
                : knewave.className
            }
          >
            Liste des utilisateurs
          </span>
        </h1>
        <Link
          href="/admin/superadmin/add-user"
          className={`rounded-lg text-white px-6 py-2 transition-colors flex items-center space-x-2 bg-gradient-to-r ${theme == 'christmas' ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700' : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700'}  `}
        >
          <FaPlus className="mr-2" /> Ajouter un utilisateur
        </Link>
      </div>
      {!usersList && <p className="mt-4">Chargement des données...</p>}
      {usersList && usersList.length === 0 && (
        <p className="mt-4">Aucun utilisateur trouvé.</p>
      )}
      {usersList && usersList.length != 0 && (
        <div>
          <table className="table-auto w-full border-collapse border border-gray-300 mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center w-full">
                  Utilisateur
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((user) => (
                <tr
                  key={user.id}
                  className="border border-gray-300 odd:bg-white even:bg-gray-50"
                >
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {user.name}
                  </td>
                  <td className="flex gap-4 border border-gray-300 px-4 py-2 text-center whitespace-nowrap">
                    <Link
                      href={`/admin/superadmin/password/${user.id}?name=${user.name}`}
                      className="text-white rounded-lg px-6 py-2 bg-gray-500 hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      Modifier mot de passe
                    </Link>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-white rounded-lg px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      Supprimer l&apos;utilisateur
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Superadmin;
