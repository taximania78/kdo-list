'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '@/lib/api';
import { useState } from 'react';
import { FaRegCircleCheck, FaRegCircleXmark } from 'react-icons/fa6';
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
  const theme = process.env.THEME || 'default';
  const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // État pour le message d'erreur

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
    try {
      const response = await api.post(`${ApiAdress}/api/modify-password/`, {
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        currentPassword: data.currentPassword,
        firstConnection,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error('La réponse réseau n’était pas OK');
      }
      router.push('/');
    } catch (error) {
      console.error('Erreur:', error);

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        // 3) C’est bien une erreur Axios, on peut extraire safe la réponse
        const err = error as AxiosError<ApiErrorResponse>;
        const detail =
          err.response?.data?.detail ??
          err.response?.data?.message ??
          'Une erreur est survenue. Veuillez réessayer.';
        setErrorMessage(detail);
        console.error('Erreur Axios:', detail);
      } else {
        // Ce n’était pas une erreur Axios, on remonte un message générique
        console.error('Erreur non-Axios:', error);
        setErrorMessage('Une erreur inattendue est survenue.');
      }
    }
  };

  return (
    <div className="container mx-auto p-2 w-full max-w-sm mt-4">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-2">
          {!firstConnection && (
            <>
              <label className="block font-bold" htmlFor="currentPassword">
                Votre mot de passe actuel
              </label>
              <input
                {...form.register('currentPassword')}
                className="shadow appearance-none border rounded w-full py-1 px-3 mb-1"
                type="password"
                id="currentPassword"
                name="currentPassword"
                placeholder="Entrer votre mot de passe actuel"
              />
            </>
          )}
          <label className="block font-bold" htmlFor="password">
            Nouveau mot de passe
          </label>
          <input
            {...form.register('password')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="password"
            id="password"
            name="password"
            placeholder="Entrer votre nouveau mot de passe"
            onChange={(e) => handlePasswordChange(e.target.value)}
          />
          {form.formState.errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="passwordConfirmation">
            Confirmer votre mot de passe
          </label>
          <input
            {...form.register('passwordConfirmation')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="password"
            id="passwordConfirmation"
            name="passwordConfirmation"
            placeholder="Confirmer votre mot de passe"
            onChange={(e) => handlePasswordConfirmation(e.target.value)}
          />
          {form.formState.errors.passwordConfirmation && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.passwordConfirmation.message}
            </p>
          )}
        </div>
        <div className="gap-4 justify-center mt-4">
          <p>Le mot de passe doit :</p>
          <ul className="list-none">
            <li
              className={`flex items-center ${
                passwordRequirements.minLength
                  ? 'text-green-700'
                  : 'text-red-500'
              }`}
            >
              <span className="mr-2">
                {passwordRequirements.minLength ? (
                  <FaRegCircleCheck />
                ) : (
                  <FaRegCircleXmark />
                )}
              </span>
              Contenir au moins 8 caractères
            </li>
            <li
              className={`flex items-center ${
                passwordRequirements.hasUppercase
                  ? 'text-green-700'
                  : 'text-red-500'
              }`}
            >
              <span className="mr-2">
                {passwordRequirements.hasUppercase ? (
                  <FaRegCircleCheck />
                ) : (
                  <FaRegCircleXmark />
                )}
              </span>{' '}
              Contenir au moins une lettre majuscule
            </li>
            <li
              className={`flex items-center ${
                passwordRequirements.hasNumber
                  ? 'text-green-700'
                  : 'text-red-500'
              }`}
            >
              <span className="mr-2">
                {passwordRequirements.hasNumber ? (
                  <FaRegCircleCheck />
                ) : (
                  <FaRegCircleXmark />
                )}
              </span>{' '}
              Contenir au moins un chiffre
            </li>
            <li
              className={`flex items-center ${
                passwordRequirements.hasSpecialChar
                  ? 'text-green-700'
                  : 'text-red-500'
              }`}
            >
              <span className="mr-2">
                {passwordRequirements.hasSpecialChar ? (
                  <FaRegCircleCheck />
                ) : (
                  <FaRegCircleXmark />
                )}
              </span>{' '}
              Contenir au moins un caractère spécial
            </li>
          </ul>
        </div>
        {errorMessage && ( // Affichage conditionnel du message d'erreur
          <p className="text-red-500 text-md mt-4 font-bold">{errorMessage}</p>
        )}
        <div className="flex gap-4 justify-center text-center mt-8 w-full">
          {!firstConnection ? (
            <Link
              href="/"
              className="w-full cursor-pointer text-white rounded-lg px-6 py-2 transition-colors space-x-2 text-center bg-gray-500 hover:bg-gray-600"
            >
              Retour
            </Link>
          ) : null}
          <button
            type="submit"
            className={`w-full cursor-pointer text-white rounded-lg px-6 py-2 transition-colors space-x-2 text-center bg-gradient-to-r ${theme == 'christmas' ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700' : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700'}`}
          >
            Modifier
          </button>
        </div>
      </form>
    </div>
  );
}
