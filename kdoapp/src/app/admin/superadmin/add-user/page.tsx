'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import { strongPassword } from '@/lib/passwordRules';
import { PasswordRules } from '@/components/PasswordRules';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { BackLink } from '@/components/ui/BackLink';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const formSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères." }),
  userPassword: strongPassword,
  isAdmin: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddUser() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: { isAdmin: false } });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: 'userPassword' }) ?? '';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push('/');
    else if (user && !user.isMegaAdmin) router.push('/admin');
  }, [isAuthenticated, user, isLoading, router]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await api.post(`${ApiAdress}/api/create-user/`, {
        name: data.username,
        password: data.userPassword,
        isAdmin: data.isAdmin,
      });
      router.push('/admin/superadmin');
    } catch (e) {
      setError(apiErrorMessage(e, "Le compte n'a pas pu être créé."));
    }
  };

  return (
    <PageShell narrow>
      <BackLink href="/admin/superadmin">Super admin</BackLink>
      <PageTitle className="mb-7">Nouvelle personne</PageTitle>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <Field label="Nom d'utilisateur" htmlFor="username" error={errors.username?.message}>
          <Input {...form.register('username')} id="username" autoComplete="off" placeholder="Ex. lea" />
        </Field>
        <Field
          label="Mot de passe provisoire"
          htmlFor="userPassword"
          error={errors.userPassword?.message}
          hint={<PasswordRules password={password} />}
        >
          <Input {...form.register('userPassword')} id="userPassword" type="password" autoComplete="new-password" />
        </Field>
        <label className="tap-y flex items-center gap-2.5 font-semibold text-on-bg">
          <input type="checkbox" {...form.register('isAdmin')} className="size-4 accent-primary" />
          Peut gérer les idées (admin)
        </label>
        {error && (
          <p role="alert" className="w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
            {error}
          </p>
        )}
        <Button type="submit" block pending={isSubmitting} className="mt-2 py-3.5">
          Créer le compte
        </Button>
      </form>
    </PageShell>
  );
}
