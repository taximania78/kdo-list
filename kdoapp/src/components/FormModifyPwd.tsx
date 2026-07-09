'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '@/lib/api';
import { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import { isChristmas } from '@/lib/theme';

interface FormModifyPwdProps {
  firstConnection?: boolean;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export default function FormModifyPwd({ firstConnection }: FormModifyPwdProps) {
  const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    currentPassword: z.string().optional(),
    password: z
      .string()
      .min(8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      .regex(/[A-Z]/, {
        message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
      })
      .regex(/\d/, {
        message: 'Le mot de passe doit contenir au moins un chiffre.',
      })
      .regex(/[\W_]/, {
        message: 'Le mot de passe doit contenir au moins un caractère spécial.',
      }),
    passwordConfirmation: z
      .string()
      .min(8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      .regex(/[A-Z]/, {
        message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
      })
      .regex(/\d/, {
        message: 'Le mot de passe doit contenir au moins un chiffre.',
      })
      .regex(/[\W_]/, {
        message: 'Le mot de passe doit contenir au moins un caractère spécial.',
      }),
  });

  type FormData = z.infer<typeof formSchema>;

  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handlePasswordChange = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[\W_]/.test(password),
    });
  };

  const handlePasswordConfirmation = (password: string) => {
    if (password !== form.getValues('password')) {
      form.setError('passwordConfirmation', {
        type: 'manual',
        message: 'Les mots de passe ne correspondent pas.',
      });
    } else {
      form.clearErrors('passwordConfirmation');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post(`${ApiAdress}/api/modify-password/`, {
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        currentPassword: data.currentPassword,
        firstConnection,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error("La réponse réseau n'était pas OK");
      }
      if (firstConnection) {
        sessionStorage.removeItem('requirePasswordChange');
      }
      router.push('/');
    } catch (error) {
      console.error('Erreur:', error);
      setIsLoading(false);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const err = error as AxiosError<ApiErrorResponse>;
        const detail =
          err.response?.data?.detail ??
          err.response?.data?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
        setErrorMessage(detail);
        console.error('Erreur Axios:', detail);
      } else {
        console.error('Erreur non-Axios:', error);
        setErrorMessage('Une erreur inattendue est survenue.');
      }
    }
  };

  const inputClasses =
    'block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--input-focus)]';

  const getRequirementClasses = (met: boolean) =>
    met ? 'text-emerald-500' : 'text-[var(--text-muted)]';

  return (
    <div
      className={`w-full ${firstConnection ? '' : 'container mx-auto p-4 max-w-md'}`}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!firstConnection && (
          <div className="relative">
            <label
              className="block font-medium mb-2 text-[var(--text-secondary)]"
              htmlFor="currentPassword"
            >
              Votre mot de passe actuel
            </label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
              <Lock className="h-5 w-5 text-[var(--text-muted)]" />
            </div>
            <input
              {...form.register('currentPassword')}
              className={inputClasses}
              type="password"
              id="currentPassword"
              name="currentPassword"
              placeholder="Entrer votre mot de passe actuel"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="relative">
          <label
            className="block font-medium mb-2 text-[var(--text-secondary)]"
            htmlFor="password"
          >
            Nouveau mot de passe
          </label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
            <Lock className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <input
            {...form.register('password')}
            className={inputClasses}
            type="password"
            id="password"
            name="password"
            placeholder="Entrer votre nouveau mot de passe"
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isLoading}
          />
          {form.formState.errors.password && (
            <p className="text-[var(--danger)] text-sm mt-2 font-medium">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="relative">
          <label
            className="block font-medium mb-2 text-[var(--text-secondary)]"
            htmlFor="passwordConfirmation"
          >
            Confirmer votre mot de passe
          </label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
            <Lock className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <input
            {...form.register('passwordConfirmation')}
            className={inputClasses}
            type="password"
            id="passwordConfirmation"
            name="passwordConfirmation"
            placeholder="Confirmer votre mot de passe"
            onChange={(e) => handlePasswordConfirmation(e.target.value)}
            disabled={isLoading}
          />
          {form.formState.errors.passwordConfirmation && (
            <p className="text-[var(--danger)] text-sm mt-2 font-medium">
              {form.formState.errors.passwordConfirmation.message}
            </p>
          )}
        </div>

        <div className="space-y-3 p-4 rounded-xl border bg-[var(--surface-hover)] border-[var(--border-light)]">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Le mot de passe doit :
          </p>
          <ul className="space-y-2">
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${getRequirementClasses(passwordRequirements.minLength)}`}
            >
              {passwordRequirements.minLength ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins 8 caractères
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${getRequirementClasses(passwordRequirements.hasUppercase)}`}
            >
              {passwordRequirements.hasUppercase ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins une lettre majuscule
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${getRequirementClasses(passwordRequirements.hasNumber)}`}
            >
              {passwordRequirements.hasNumber ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins un chiffre
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${getRequirementClasses(passwordRequirements.hasSpecialChar)}`}
            >
              {passwordRequirements.hasSpecialChar ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins un caractère spécial
            </li>
          </ul>
        </div>

        {errorMessage && (
          <div className="p-4 bg-[var(--danger)] text-[var(--on-primary)] rounded-lg text-center font-medium animate-shake backdrop-blur-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4 justify-center mt-8 w-full">
          {!firstConnection ? (
            <Link
              href="/"
              className="flex-1 text-center cursor-pointer rounded-xl px-6 py-3 transition-all duration-200 border font-medium text-[var(--text-primary)] bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] border-[var(--border)]"
            >
              Retour
            </Link>
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className={`${firstConnection ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[var(--on-primary)] font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[var(--shadow-primary)] ${
              isChristmas
                ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700'
                : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Modification...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Modifier
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
