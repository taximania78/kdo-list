'use client';

import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { useRouter } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const theme = process.env.THEME || 'default';
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

const formSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  user: z.enum(['Marie-Eve', 'Mathieu']),
  url: z.string().url({ message: 'Invalid url' }),
  comment: z.string().optional(),
  image: z.union([z.string().url(), z.literal('')]).optional(),
  availability: z.boolean().default(true).optional(),
  takenBy: z.string().default('None').optional(),
});

function AddItem() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form values:', values);
    const token = localStorage.getItem('authToken');
    const apiUrl = `${ApiAdress}/api/add-item/`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // Convertir les valeurs en JSON
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Success:', data);
      router.push('/admin');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto p-2 mt-2">
      <h1 className="sm:text-4xl text-3xl font-bold text-center">
        <span
          className={
            theme === 'christmas'
              ? mountains_of_christmas.className
              : knewave.className
          }
        >
          Ajouter une idée
        </span>
      </h1>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="name">
            Nom
          </label>
          <input
            {...form.register('name')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="name"
            name="name"
            placeholder="Entrer le nom"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="price">
            Prix
          </label>
          <input
            {...form.register('price', { valueAsNumber: true })}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="number"
            step="0.01"
            id="price"
            name="price"
            placeholder="Entrer le prix"
          />
          {form.formState.errors.price && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.price.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="user">
            Pour
          </label>
          <select
            {...form.register('user')}
            className="shadow border rounded w-full py-2 px-3"
            id="user"
            name="user"
          >
            <option value="Marie-Eve">Marie-Eve</option>
            <option value="Mathieu">Mathieu</option>
          </select>
          {form.formState.errors.user && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.user.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="url">
            URL
          </label>
          <input
            {...form.register('url')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="url"
            name="url"
            placeholder="Entrer l'URL"
          />
          {form.formState.errors.url && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.url.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="comment">
            Commentaire
          </label>
          <input
            {...form.register('comment')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="comment"
            name="comment"
            placeholder="Entrer un commentaire"
          />
          {form.formState.errors.comment && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.comment.message}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block font-bold" htmlFor="image">
            URL de l&apos;image
          </label>
          <input
            {...form.register('image')}
            className="shadow appearance-none border rounded w-full py-1 px-3"
            type="text"
            id="image"
            name="image"
            placeholder="Entrer l'URL de l'image"
          />
          {form.formState.errors.image && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.image.message}
            </p>
          )}
        </div>
        <div className="w-full flex gap-x-2 mt-4">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="w-1/2 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Retour
          </button>
          <button
            type="submit"
            className={
              `w-1/2 rounded-lg text-white px-6 py-2 transition-colors bg-gradient-to-r ` +
              (theme === 'christmas'
                ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700'
                : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700')
            }
          >
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddItem;
