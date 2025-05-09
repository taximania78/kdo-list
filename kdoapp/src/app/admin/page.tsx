'use client';

import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import * as Select from '@radix-ui/react-select';
import FormModifyItem from '@/components/FormModifyItem';

const theme = process.env.THEME || 'default';
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
        className="w-[180px] inline-flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
        aria-label="Sélectionner l'utilisateur"
      >
        {/* Affiche la valeur sélectionnée */}
        <Select.Value placeholder="Utilisateur..." />
        <Select.Icon>
          <FaChevronDown />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md bg-white shadow-lg">
          <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-white">
            <FaChevronUp />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-1">
            <Select.Item
              value="Marie-Eve"
              className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-1 hover:bg-gray-100"
            >
              <Select.ItemText>Marie-Eve</Select.ItemText>
            </Select.Item>
            <Select.Item
              value="Mathieu"
              className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-1 hover:bg-gray-100"
            >
              <Select.ItemText>Mathieu</Select.ItemText>
            </Select.Item>
          </Select.Viewport>

          <Select.ScrollDownButton className="flex h-6 items-center justify-center bg-white">
            <FaChevronDown />
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
    <div className="container mx-auto p-2">
      <div className="flex items-center gap-4">
        <SelectUser />
        <Link
          href="/admin/add/"
          className={`rounded-lg text-white px-6 py-2 transition-colors flex items-center space-x-2 bg-gradient-to-r ${theme == 'christmas' ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700' : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700'}  `}
        >
          <FaPlus className="mr-2" /> Ajouter une idée
        </Link>
      </div>
      <br />

      {!kdosList && <p>Chargement des données...</p>}
      {kdosList && kdosList.length === 0 && (
        <p>Aucun cadeau trouvé pour cet utilisateur.</p>
      )}
      {kdosList && kdosList.length != 0 && (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="align-middle text-center">Image</th>
              <th className="align-middle text-center">Idée</th>
              <th className="align-middle text-center">Pour</th>
              <th className="align-middle text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {kdosList.map((kdo) => (
              <tr key={kdo.id} className="mt-2">
                <td className="align-middle text-center">
                  <Image
                    src={`/api/kdos/${kdo.imageDisplay}`}
                    alt={`Image ${kdo.name}`}
                    width={50}
                    height={50}
                    className="inline-block align-middle object-contain"
                  />
                </td>
                <td className="align-middle text-center">{kdo.name}</td>
                <td className="align-middle text-center">{kdo.user}</td>
                <td className="align-middle text-center">
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
      )}
    </div>
  );
}

export default Admin;
