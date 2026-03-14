'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, Settings, Download } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import FormModifyItem from '@/components/FormModifyItem';
import { isChristmas } from '@/lib/theme';

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

/** ---------------------
 *  Composant Admin
 * --------------------- */

function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [kdosList, setKdosList] = useState<Kdo[] | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [ADMIN] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isAdmin) {
        console.log('🚫 [ADMIN] Not admin, redirecting to list');
        router.push('/list');
      }
      // If admin, stay on page
    }
  }, [isAuthenticated, user, isLoading, router]);

  const [selectedUser, setSelectedUser] = useState('Marie-Eve');

  const handleValueChange = (value: string) => {
    setSelectedUser(value);
    fetchKdos(value);
  };

  const fetchKdos = async (selection: string) => {
    let apiUrl = `${ApiAdress}/api/kdos-admin/?format=json`;
    if (selection === 'commune') {
      apiUrl += `&list=commune`;
    } else if (selection) {
      apiUrl += `&user=${encodeURIComponent(selection)}`;
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

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`${ApiAdress}/api/export-csv/`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ideas_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
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
          focus:outline-none
          focus:ring-2
          transition-all
          duration-200
          ${isChristmas
            ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:ring-white/50 hover:bg-white/30'
            : 'surface-card border border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--primary)]/30 hover:bg-[var(--input-bg)]'
          }
        `}
        aria-label="Sélectionner l'utilisateur"
      >
        <Select.Value placeholder="Utilisateur..." />
        <Select.Icon>
          <ChevronDown className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-xl surface-card shadow-xl border border-[var(--border)] z-50">
          <Select.ScrollUpButton className="flex h-6 items-center justify-center bg-[var(--input-bg)]">
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
                hover:bg-[var(--primary)]/10 text-[var(--text-primary)]
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
                hover:bg-[var(--primary)]/10 text-[var(--text-primary)]
              `}
            >
              <Select.ItemText>Mathieu</Select.ItemText>
            </Select.Item>
            <Select.Item
              value="commune"
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
                hover:bg-[var(--primary)]/10 text-[var(--text-primary)]
              `}
            >
              <Select.ItemText>Liste commune</Select.ItemText>
            </Select.Item>
          </Select.Viewport>

          <Select.ScrollDownButton className="flex h-6 items-center justify-center bg-[var(--input-bg)]">
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
      className="
        px-4
        sm:px-6
        lg:px-8
        py-8
      "
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with title and controls */}
        <div
          className={`
            rounded-3xl
            shadow-xl
            p-6
            sm:p-8
            border
            mb-8
            ${isChristmas
              ? 'backdrop-blur-lg bg-white/10 border-white/20 animate-glow'
              : 'surface-card border-[var(--border)]'
            }
          `}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className={`w-8 h-8 ${isChristmas ? 'text-white' : 'text-[var(--primary)]'}`} />
              <h1 className={`text-2xl sm:text-3xl font-bold ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                Modifier mes idées
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SelectUser />
              <button
                onClick={handleExportCSV}
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
                    isChristmas
                      ? 'bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 shadow-lg shadow-green-500/50'
                      : 'bg-[var(--text-secondary)] hover:bg-[var(--text-secondary)]/90 shadow-lg'
                  }
                `}
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
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
                    isChristmas
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-primary)]'
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
          <div className="surface-card rounded-2xl p-8 border border-[var(--border)] shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[var(--text-primary)] text-lg">Chargement des données...</p>
          </div>
        )}

        {kdosList && kdosList.length === 0 && (
          <div className="surface-card rounded-2xl p-8 border border-[var(--border)] shadow-lg text-center">
            <p className="text-[var(--text-primary)] text-lg">
              Aucun cadeau trouvé pour cet utilisateur.
            </p>
          </div>
        )}

        {kdosList && kdosList.length !== 0 && (
          <div className="surface-card rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--table-header)]">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-[var(--text-primary)]">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[var(--text-primary)]">
                      Idée
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-[var(--text-primary)]">
                      Pour
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-[var(--text-primary)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {kdosList.map((kdo) => (
                    <tr
                      key={kdo.id}
                      className="hover:bg-[var(--primary)]/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[var(--input-bg)]">
                          <Image
                            src={`/api/kdos/${kdo.imageDisplay}`}
                            alt={`Image ${kdo.name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">
                        {kdo.name}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{kdo.user}</td>
                      <td className="px-6 py-4 text-center">
                        <FormModifyItem
                          kdo={kdo}
                          id={kdo.id}
                          onFormSubmit={() => fetchKdos(selectedUser)}
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
