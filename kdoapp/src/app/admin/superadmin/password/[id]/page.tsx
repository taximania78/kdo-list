'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { strongPassword } from '@/lib/passwordRules';
import { PasswordRules } from '@/components/PasswordRules';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Field, Input } from '@/components/ui/Field';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const formSchema = z.object({ newPassword: strongPassword });
type FormData = z.infer<typeof formSchema>;

export default function ResetPassword({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const name = useSearchParams().get('name') || 'Utilisateur inconnu';
  const userId = parseInt(use(params).id, 10);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(formSchema) });
  const password = useWatch({ control: form.control, name: 'newPassword' }) ?? '';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/');
    else if (user && !user.isMegaAdmin) router.push('/admin');
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <PageShell narrow>
      <Link href="/admin/superadmin" className="mb-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-bg-muted hover:text-on-bg">
        <ArrowLeft className="size-4" aria-hidden />
        Super admin
      </Link>
      <PageTitle className="mb-2">Nouveau mot de passe</PageTitle>
      <p className="mb-7 text-on-bg-muted">
        Pour <strong className="text-on-bg">{name}</strong>
      </p>
      <form noValidate onSubmit={form.handleSubmit(setPendingData)} className="grid gap-4">
        <Field
          label="Nouveau mot de passe"
          htmlFor="newPassword"
          error={form.formState.errors.newPassword?.message}
          hint={<PasswordRules password={password} />}
        >
          <Input {...form.register('newPassword')} id="newPassword" type="password" autoComplete="new-password" />
        </Field>
        <Button type="submit" block className="mt-2 py-3.5">
          Réinitialiser
        </Button>
      </form>
      <ConfirmSheet
        open={pendingData !== null}
        onOpenChange={(open) => {
          if (!open) setPendingData(null);
        }}
        title="Réinitialiser ?"
        confirmLabel="Oui, réinitialiser"
        onConfirm={async () => {
          if (!pendingData) return;
          await api.patch(`${ApiAdress}/api/modify-password-admin/${userId}`, { password: pendingData.newPassword });
          router.push('/admin/superadmin');
        }}
      >
        <p>
          <strong>{name}</strong> devra utiliser ce nouveau mot de passe dès sa prochaine connexion.
        </p>
      </ConfirmSheet>
    </PageShell>
  );
}
