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

interface FormModifyPwdProps {
  firstConnection?: boolean;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export default function FormModifyPwd({ firstConnection }: FormModifyPwdProps) {
  const theme = process.env.NEXT_PUBLIC_THEME || 'default';
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
        throw new Error('La réponse réseau n\'était pas OK');
      }
      router.push('/');
    } catch (error) {
      console.error('Erreur:', error);
      setIsLoading(false);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        // 3) C'est bien une erreur Axios, on peut extraire safe la réponse
        const err = error as AxiosError<ApiErrorResponse>;
        const detail =
          err.response?.data?.detail ??
          err.response?.data?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
        setErrorMessage(detail);
        console.error('Erreur Axios:', detail);
      } else {
        // Ce n'était pas une erreur Axios, on remonte un message générique
        console.error('Erreur non-Axios:', error);
        setErrorMessage('Une erreur inattendue est survenue.');
      }
    }
  };

  return (
    <div className={`w-full ${firstConnection ? '' : 'container mx-auto p-4 max-w-md'}`}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!firstConnection && (
          <div className="relative">
            <label
              className="block text-white font-medium mb-2"
              htmlFor="currentPassword"
            >
              Votre mot de passe actuel
            </label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
              <Lock className="h-5 w-5 text-white/60" />
            </div>
            <input
              {...form.register('currentPassword')}
              className="
                block
                w-full
                pl-12
                pr-4
                py-3
                bg-white/20
                backdrop-blur-sm
                border
                border-white/30
                rounded-xl
                text-white
                placeholder-white/60
                focus:outline-none
                focus:ring-2
                focus:ring-white/50
                focus:border-transparent
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              type="password"
              id="currentPassword"
              name="currentPassword"
              placeholder="Entrer votre mot de passe actuel"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="relative">
          <label className="block text-white font-medium mb-2" htmlFor="password">
            Nouveau mot de passe
          </label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
            <Lock className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...form.register('password')}
            className="
              block
              w-full
              pl-12
              pr-4
              py-3
              bg-white/20
              backdrop-blur-sm
              border
              border-white/30
              rounded-xl
              text-white
              placeholder-white/60
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
              focus:border-transparent
              transition-all
              duration-200
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            type="password"
            id="password"
            name="password"
            placeholder="Entrer votre nouveau mot de passe"
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isLoading}
          />
          {form.formState.errors.password && (
            <p className="text-red-300 text-sm mt-2 font-medium">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="relative">
          <label
            className="block text-white font-medium mb-2"
            htmlFor="passwordConfirmation"
          >
            Confirmer votre mot de passe
          </label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-8">
            <Lock className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...form.register('passwordConfirmation')}
            className="
              block
              w-full
              pl-12
              pr-4
              py-3
              bg-white/20
              backdrop-blur-sm
              border
              border-white/30
              rounded-xl
              text-white
              placeholder-white/60
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
              focus:border-transparent
              transition-all
              duration-200
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            type="password"
            id="passwordConfirmation"
            name="passwordConfirmation"
            placeholder="Confirmer votre mot de passe"
            onChange={(e) => handlePasswordConfirmation(e.target.value)}
            disabled={isLoading}
          />
          {form.formState.errors.passwordConfirmation && (
            <p className="text-red-300 text-sm mt-2 font-medium">
              {form.formState.errors.passwordConfirmation.message}
            </p>
          )}
        </div>

        <div className="space-y-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <p className="text-white/90 text-sm font-medium">
            Le mot de passe doit :
          </p>
          <ul className="space-y-2">
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                passwordRequirements.minLength
                  ? 'text-green-400'
                  : 'text-white/70'
              }`}
            >
              {passwordRequirements.minLength ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins 8 caractères
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                passwordRequirements.hasUppercase
                  ? 'text-green-400'
                  : 'text-white/70'
              }`}
            >
              {passwordRequirements.hasUppercase ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins une lettre majuscule
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                passwordRequirements.hasNumber
                  ? 'text-green-400'
                  : 'text-white/70'
              }`}
            >
              {passwordRequirements.hasNumber ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              Contenir au moins un chiffre
            </li>
            <li
              className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                passwordRequirements.hasSpecialChar
                  ? 'text-green-400'
                  : 'text-white/70'
              }`}
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
          <div className="p-4 bg-red-500/90 text-white rounded-lg text-center font-medium animate-shake backdrop-blur-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4 justify-center mt-8 w-full">
          {!firstConnection ? (
            <Link
              href="/"
              className="flex-1 text-center cursor-pointer text-white rounded-xl px-6 py-3 transition-all duration-200 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 font-medium"
            >
              Retour
            </Link>
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              ${firstConnection ? 'w-full' : 'flex-1'}
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
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:hover:scale-100
              ${
                theme === 'christmas'
                  ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
              }
            `}
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
