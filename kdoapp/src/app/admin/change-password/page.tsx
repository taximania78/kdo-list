'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { PaperState } from '@/components/ui/PaperState';

export default function ChangePassword() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/');
    else if (user && !user.isAdmin) router.push('/list');
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) return <PaperState kind="loading">Chargement…</PaperState>;
  if (!isAuthenticated) return null;

  return (
    <PageShell narrow>
      <PageTitle className="mb-7 mt-6 md:mt-12">Modifier mon mot de passe</PageTitle>
      <FormModifyPwd />
    </PageShell>
  );
}
