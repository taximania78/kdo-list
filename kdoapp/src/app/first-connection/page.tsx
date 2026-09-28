'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { PaperState } from '@/components/ui/PaperState';

export default function FirstConnection() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [shouldShowPage, setShouldShowPage] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const requirePasswordChange = sessionStorage.getItem('requirePasswordChange');
    if (!isAuthenticated) {
      router.push('/');
    } else if (!requirePasswordChange) {
      router.push(user?.isAdmin ? '/admin' : '/list');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldShowPage(true);
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !shouldShowPage) return <PaperState kind="loading">Chargement…</PaperState>;

  return (
    <PageShell narrow>
      <PageTitle className="mb-3 mt-6 md:mt-12">Première connexion</PageTitle>
      <p className="mb-7 text-on-bg-muted">Choisis ton propre mot de passe pour sécuriser ton compte.</p>
      <FormModifyPwd firstConnection />
    </PageShell>
  );
}
