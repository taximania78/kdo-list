'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs } from 'radix-ui';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { AppUser } from '@/lib/users';
import ThemeSettings from '@/components/ThemeSettings';
import { ListsPanel } from '@/components/superadmin/ListsPanel';
import { UsersPanel } from '@/components/superadmin/UsersPanel';
import { buttonClass } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { PaperState } from '@/components/ui/PaperState';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  { value: 'users', label: 'Personnes' },
  { value: 'lists', label: 'Listes' },
  { value: 'theme', label: 'Thème' },
];

export default function Superadmin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [users, setUsers] = useState<AppUser[] | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/');
    else if (user && !user.isMegaAdmin) router.push('/admin');
  }, [isAuthenticated, user, isLoading, router]);

  const fetchUsers = useCallback(() => {
    return api
      .get(`${ApiAdress}/api/users/`)
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) return <PaperState kind="loading">Chargement…</PaperState>;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageTitle>Super admin</PageTitle>
        <Link href="/admin/superadmin/add-user" className={buttonClass('primary')}>
          <UserPlus className="size-4" aria-hidden />
          Ajouter une personne
        </Link>
      </div>
      <Tabs.Root defaultValue="users" className="mt-6">
        <Tabs.List aria-label="Sections" className="mb-5 flex gap-6 border-b-[1.5px] border-on-bg/20">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="relative min-h-11 rounded-md py-2.5 text-[15px] font-bold text-on-bg-muted data-[state=active]:text-on-bg data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-[2.5px] data-[state=active]:after:bg-primary"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="users">
          <UsersPanel users={users} meId={user ? Number(user.sub) : null} onChanged={fetchUsers} />
        </Tabs.Content>
        <Tabs.Content value="lists">
          <ListsPanel users={users ?? []} />
        </Tabs.Content>
        <Tabs.Content value="theme">
          <ThemeSettings />
        </Tabs.Content>
      </Tabs.Root>
    </PageShell>
  );
}
