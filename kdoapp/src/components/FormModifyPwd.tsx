'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import { strongPassword } from '@/lib/passwordRules';
import { Button, buttonClass } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PasswordRules } from '@/components/PasswordRules';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
const MISMATCH = 'Les mots de passe ne correspondent pas.';

const formSchema = z
  .object({
    currentPassword: z.string().optional(),
    password: strongPassword,
    passwordConfirmation: strongPassword,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: MISMATCH,
    path: ['passwordConfirmation'],
  });

type FormData = z.infer<typeof formSchema>;

export default function FormModifyPwd({ firstConnection = false }: { firstConnection?: boolean }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(formSchema) });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' }) ?? '';

  // Retour immédiat pendant la saisie de la confirmation, sans attendre l'envoi
  const checkConfirmation = (value: string) => {
    if (value !== form.getValues('password')) {
      form.setError('passwordConfirmation', { type: 'manual', message: MISMATCH });
    } else {
      form.clearErrors('passwordConfirmation');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.post(`${ApiAdress}/api/modify-password/`, {
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        currentPassword: data.currentPassword,
        firstConnection,
      });
      if (firstConnection) sessionStorage.removeItem('requirePasswordChange');
      router.push('/');
    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage(apiErrorMessage(error, 'Une erreur est survenue. Veuillez réessayer.'));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {!firstConnection && (
        <Field label="Mot de passe actuel" htmlFor="currentPassword">
          <Input
            {...form.register('currentPassword')}
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Entrer votre mot de passe actuel"
            disabled={isLoading}
          />
        </Field>
      )}
      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        error={errors.password?.message}
        hint={<PasswordRules password={password} />}
      >
        <Input
          {...form.register('password')}
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Entrer votre nouveau mot de passe"
          disabled={isLoading}
        />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="passwordConfirmation" error={errors.passwordConfirmation?.message}>
        <Input
          {...form.register('passwordConfirmation', { onChange: (e) => checkConfirmation(e.target.value) })}
          id="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Confirmer votre mot de passe"
          disabled={isLoading}
        />
      </Field>
      {errorMessage && (
        <p role="alert" className="animate-shake w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
          {errorMessage}
        </p>
      )}
      <div className="mt-2 flex gap-3">
        {!firstConnection && (
          <Link href="/" className={`${buttonClass('outline')} flex-1`}>
            Retour
          </Link>
        )}
        <Button type="submit" pending={isLoading} className="flex-1 py-3">
          {isLoading ? 'Modification…' : 'Modifier'}
        </Button>
      </div>
    </form>
  );
}
