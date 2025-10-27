'use client';

import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import FormModifyItem from '@/components/FormModifyItem';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

/** ---------------------
 *  Types & Schemas
 * --------------------- */

type Kdo = {
  id: number;
  name: string;
  price: number;
  user: 'Marie-Eve' | 'Mathieu';
  url: string;
  comment?: string | null;
  image?: string | null;
  imageDisplay?: string | null;
};

interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number; // Timestamp d'expiration
}

/** ---------------------
 *  Composant Admin
 * --------------------- */

function Admin() {
  const router = useRouter();
  const [kdosList, setKdosList] = useState<Kdo[] | null>(null);

  // Fonction de vérification du token
  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    const admin = localStorage.getItem('isAdmin');

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const isExpired = decoded.exp < Date.now() / 1000;
        if (isExpired) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            localStorage.clear();
            router.push('/');
            return;
          }
          const isExpired = decoded.exp < Date.now() / 1000;
          if (isExpired) {
            localStorage.clear();
            router.push('/');
            return;
          }
          const response = await fetch(`${ApiAdress}/api/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!response.ok) {
            localStorage.clear();
            router.push('/');
            return;
          }
          const data = await response.json();
          localStorage.setItem('accessToken', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);
        } else {
          if (admin !== 'true') {
            // Non admin => redirection vers /list
            console.log("L'utilisateur n'est pas admin => /list");
            router.push('/list');
          } else {
            console.log('Utilisateur admin => on reste sur la page admin');
          }
        }
      } catch (error) {
        console.error('Token verification error:', error);
        localStorage.clear();
        router.push('/');
      }
    } else {
      console.log("Aucun token => retour vers l'accueil pour authentification");
      router.push('/');
    }
  };

  useEffect(() => {
    checkAuth();
  }, [router]);

  const [selectedUser, setSelectedUser] = useState('Marie-Eve');

  const handleValueChange = (value: string) => {
    setSelectedUser(value);
    fetchKdos(value);
  };

  const fetchKdos = async (user: string) => {
    let apiUrl = `${ApiAdress}/api/kdos-admin/?format=json`;
    if (user) {
      apiUrl += `&user=${encodeURIComponent(user)}`;
    }

    try {
      const response = await api.get(apiUrl);
      console.log('Response status:', response.status);
      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }
      const data: Kdo[] = response.data;
      setKdosList(data);
    } catch (error) {
      console.error('Failed to fetch kdos:', error);
      router.push('/');
    }
  };

  /** ---------------------
   *  Composant Dropdown List
   * --------------------- */

  const SelectUser = () => (
    <Select.Root value={selectedUser} onValueChange={handleValueChange}>
      <Select.Trigger
        className={`
          w-[180px]
          inline-flex
          items-center
          justify-between
          rounded-xl
          px-4
          py-3
          bg-white/20
          backdrop-blur-sm
          border
          border-white/30
          text-white
          focus:outline-none
          focus:ring-2
          focus:ring-white/50
          transition-all
          duration-200
          hover:bg-white/30
        `}
        aria-label="Sélectionner l'utilisateur"
      >
        <Select.Value placeholder="Utilisateur..." />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-xl bg-white/90 backdrop-blur-lg shadow-2xl border border-white/20">
          <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-white/50">
            <ChevronUp className="w-4 h-4" />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-2">
            <Select.Item
              value="Marie-Eve"
              className={`
                relative
                flex
                cursor-pointer
                select-none
                items-center
                rounded-lg
                px-4
                py-2
                transition-colors
                ${
                  theme === 'christmas'
                    ? 'hover:bg-red-100 text-red-900'
                    : 'hover:bg-sky-100 text-sky-900'
                }
              `}
            >
              <Select.ItemText>Marie-Eve</Select.ItemText>
            </Select.Item>
            <Select.Item
              value="Mathieu"
              className={`
                relative
                flex
                cursor-pointer
                select-none
                items-center
                rounded-lg
                px-4
                py-2
                transition-colors
                ${
                  theme === 'christmas'
                    ? 'hover:bg-red-100 text-red-900'
                    : 'hover:bg-sky-100 text-sky-900'
                }
              `}
            >
              <Select.ItemText>Mathieu</Select.ItemText>
            </Select.Item>
          </Select.Viewport>

          <Select.ScrollDownButton className="flex h-6 items-center justify-center bg-white/50">
            <ChevronDown className="w-4 h-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );

  // Chargement initial : fetchKdos
  useEffect(() => {
    fetchKdos('Marie-Eve');
  }, []);

  return (
    <div
      className={`
        min-h-screen
        px-4
        sm:px-6
        lg:px-8
        py-8
        relative
        overflow-hidden
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with title and controls */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-6
            sm:p-8
            border
            border-white/20
            mb-8
            ${theme === 'christmas' ? 'animate-glow' : ''}
          `}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-white" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Modifier mes idées
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SelectUser />
              <Link
                href="/admin/add/"
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-3
                  px-6
                  rounded-xl
                  text-white
                  font-semibold
                  transition-all
                  duration-200
                  transform
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  ${
                    theme === 'christmas'
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
                  }
                `}
              >
                <Plus className="w-5 h-5" />
                Ajouter une idée
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        {!kdosList && (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white text-lg">Chargement des données...</p>
          </div>
        )}

        {kdosList && kdosList.length === 0 && (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white text-lg">
              Aucun cadeau trouvé pour cet utilisateur.
            </p>
          </div>
        )}

        {kdosList && kdosList.length !== 0 && (
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
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
                    <th className="px-6 py-4 text-left text-white font-semibold">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-white font-semibold">
                      Idée
                    </th>
                    <th className="px-6 py-4 text-left text-white font-semibold">
                      Pour
                    </th>
                    <th className="px-6 py-4 text-center text-white font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {kdosList.map((kdo) => (
                    <tr
                      key={kdo.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                          <Image
                            src={`/api/kdos/${kdo.imageDisplay}`}
                            alt={`Image ${kdo.name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {kdo.name}
                      </td>
                      <td className="px-6 py-4 text-white">{kdo.user}</td>
                      <td className="px-6 py-4 text-center">
                        <FormModifyItem
                          kdo={kdo}
                          id={kdo.id}
                          theme={theme}
                          onFormSubmit={() => fetchKdos(kdo.user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
