'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import config from '../../../../../config.json';
import api from '@/lib/api';

const ApiAdress = config.apiAddress;

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
  }),
  userPassword: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
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

export default function Password() {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post(`${ApiAdress}/api/create-user/`, {
        name: data.username,
        password: data.userPassword,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error('La réponse réseau n’était pas OK');
      }
      router.push('/admin/superadmin');
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="container mx-auto p-2 w-full max-w-sm mt-4">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="username">
            Nom d&apos;utilisateur
          </label>
          <input
            {...form.register('username')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="username"
            name="username"
            placeholder="Entrer un nom d'utilisateur"
          />
          {form.formState.errors.username && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="userPassword">
            Mot de passe temporaire
          </label>
          <input
            {...form.register('userPassword')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="userPassword"
            name="userPassword"
            placeholder="Entrer un mot de passe temporaire"
          />
          {form.formState.errors.userPassword && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.userPassword.message}
            </p>
          )}
        </div>
        <div className="flex gap-4 justify-center text-center mt-2">
          <Link
            className="text-white rounded-lg px-6 py-2 bg-gray-500 hover:bg-gray-600 transition-colors space-x-2 flex items-center"
            href="/admin/superadmin"
          >
            Retour
          </Link>
          <button
            type="submit"
            className="cursor-pointer text-white rounded-lg px-6 py-2 bg-gray-500 hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            Ajouter l&apos;utilisateur
          </button>
        </div>
      </form>
    </div>
  );
}
