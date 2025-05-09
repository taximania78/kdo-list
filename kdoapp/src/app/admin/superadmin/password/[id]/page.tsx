'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import api from '@/lib/api';
import { use } from 'react';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const formSchema = z.object({
  newPassword: z
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

export default function Password({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Utilisateur inconnu';
  const { id } = use(params);
  const userId = parseInt(id, 10);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir modifier le mot de passe de "${name}"?`
      )
    ) {
      return;
    }
    try {
      const response = await api.patch(
        `${ApiAdress}/api/modify-password-admin/${userId}/`,
        { password: data.newPassword }
      );
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
      <h1 className="font-bold text-xl mb-4">
        Modification mot de passe : {name}
      </h1>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="newPassword">
            Nouveau mot de passe
          </label>
          <input
            {...form.register('newPassword')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder="Entrer le nouveau mot de passe"
          />
          {form.formState.errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="flex gap-4 justify-center text-center mt-4">
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
            Modifier le mot de passe
          </button>
        </div>
      </form>
    </div>
  );
}
