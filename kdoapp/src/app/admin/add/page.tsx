'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import {
  Plus,
  DollarSign,
  User,
  Link as LinkIcon,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

const formSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  user: z.enum(['Personne', 'Mathieu']),
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
    console.log('📝 [ADD-ITEM] Submitting form:', values);

    try {
      // api instance automatically:
      // - Adds Bearer token
      // - Handles Content-Type
      // - Refreshes token if needed
      // - Throws on error (no response.ok check needed)
      const response = await api.post('/api/add-item/', values);

      // Axios stores response data in response.data (not response.json())
      const data = response.data;
      console.log('✅ [ADD-ITEM] Success:', data);

      router.push('/admin');
    } catch (error) {
      console.error('❌ [ADD-ITEM] Error:', error);
      // TODO: Show error message to user
    }
  }

  return (
    <div
      className="
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        py-8
      "
    >
      <div className="w-full max-w-2xl z-10">
        {/* Glassmorphism card */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-8
            border
            border-white/20
            ${theme === 'christmas' ? 'animate-glow' : ''}
          `}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Plus className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Ajouter une idée
            </h1>
            <p className="mt-2 text-white/80 text-sm">
              Remplissez les informations ci-dessous
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name input */}
            <div className="relative">
              <label htmlFor="name" className="block text-white font-medium mb-2">
                Nom
              </label>
              <input
                {...form.register('name')}
                className="
                  block
                  w-full
                  px-4
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
                "
                type="text"
                id="name"
                name="name"
                placeholder="Entrer le nom"
              />
              {form.formState.errors.name && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Price input */}
            <div className="relative">
              <label
                htmlFor="price"
                className="block text-white font-medium mb-2"
              >
                Prix
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('price', { valueAsNumber: true })}
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
                  "
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  placeholder="Entrer le prix"
                />
              </div>
              {form.formState.errors.price && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            {/* User select */}
            <div className="relative">
              <label htmlFor="user" className="block text-white font-medium mb-2">
                Pour
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/60" />
                </div>
                <select
                  {...form.register('user')}
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
                    focus:outline-none
                    focus:ring-2
                    focus:ring-white/50
                    transition-all
                    duration-200
                  "
                  id="user"
                  name="user"
                >
                  <option value="Personne" className="text-gray-900">
                    Personne
                  </option>
                  <option value="Mathieu" className="text-gray-900">
                    Mathieu
                  </option>
                </select>
              </div>
              {form.formState.errors.user && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.user.message}
                </p>
              )}
            </div>

            {/* URL input */}
            <div className="relative">
              <label htmlFor="url" className="block text-white font-medium mb-2">
                URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('url')}
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
                  "
                  type="text"
                  id="url"
                  name="url"
                  placeholder="Entrer l'URL"
                />
              </div>
              {form.formState.errors.url && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            {/* Comment input */}
            <div className="relative">
              <label
                htmlFor="comment"
                className="block text-white font-medium mb-2"
              >
                Commentaire (optionnel)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('comment')}
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
                  "
                  type="text"
                  id="comment"
                  name="comment"
                  placeholder="Entrer un commentaire"
                />
              </div>
              {form.formState.errors.comment && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.comment.message}
                </p>
              )}
            </div>

            {/* Image URL input */}
            <div className="relative">
              <label
                htmlFor="image"
                className="block text-white font-medium mb-2"
              >
                URL de l&apos;image (optionnel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('image')}
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
                  "
                  type="text"
                  id="image"
                  name="image"
                  placeholder="Entrer l'URL de l'image"
                />
              </div>
              {form.formState.errors.image && (
                <p className="text-red-300 text-sm mt-1 font-medium">
                  {form.formState.errors.image.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="
                  w-full
                  sm:w-1/2
                  px-6
                  py-3
                  rounded-xl
                  bg-white/20
                  backdrop-blur-sm
                  border
                  border-white/30
                  text-white
                  font-semibold
                  hover:bg-white/30
                  transition-all
                  duration-200
                "
              >
                Retour
              </button>
              <button
                type="submit"
                className={`
                  w-full
                  sm:w-1/2
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
                  ${
                    theme === 'christmas'
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
                  }
                `}
              >
                <Plus className="w-5 h-5" />
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddItem;
