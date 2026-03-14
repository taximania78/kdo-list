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
import { isChristmas } from '@/lib/theme';

const listOptions = [
  { value: 'marie-eve', label: 'Marie-Eve', user: 'Marie-Eve' },
  { value: 'mathieu', label: 'Mathieu', user: 'Mathieu' },
  { value: 'commune', label: 'Liste commune', user: null },
];

const formSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  list_slug: z.enum(['marie-eve', 'mathieu', 'commune']),
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

    // Résoudre le user à partir du list_slug
    const selectedList = listOptions.find(l => l.value === values.list_slug);
    const payload = {
      ...values,
      user: selectedList?.user || undefined,
      list_slug: values.list_slug,
    };

    try {
      const response = await api.post('/api/add-item/', payload);
      const data = response.data;
      console.log('✅ [ADD-ITEM] Success:', data);

      router.push('/admin');
    } catch (error) {
      console.error('❌ [ADD-ITEM] Error:', error);
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
        {/* Card */}
        <div
          className={`
            rounded-3xl
            shadow-xl
            p-8
            border
            ${isChristmas
              ? 'backdrop-blur-lg bg-white/10 border-white/20 animate-glow'
              : 'surface-card border-[var(--border)]'
            }
          `}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Plus className={`w-16 h-16 ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--primary)]'}`} />
            </div>
            <h1 className={`text-3xl font-bold ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--text-primary)]'}`}>
              Ajouter une idée
            </h1>
            <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
              Remplissez les informations ci-dessous
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name input */}
            <div className="relative">
              <label htmlFor="name" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                Nom
              </label>
              <input
                {...form.register('name')}
                className={`
                  block
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  focus:outline-none
                  focus:ring-2
                  transition-all
                  duration-200
                  ${isChristmas
                    ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                    : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                  }
                `}
                type="text"
                id="name"
                name="name"
                placeholder="Entrer le nom"
              />
              {form.formState.errors.name && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Price input */}
            <div className="relative">
              <label
                htmlFor="price"
                className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}
              >
                Prix
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('price', { valueAsNumber: true })}
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                    }
                  `}
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  placeholder="Entrer le prix"
                />
              </div>
              {form.formState.errors.price && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            {/* List select */}
            <div className="relative">
              <label htmlFor="list_slug" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                Pour
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <select
                  {...form.register('list_slug')}
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                    }
                  `}
                  id="list_slug"
                  name="list_slug"
                >
                  {listOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.formState.errors.list_slug && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.list_slug.message}
                </p>
              )}
            </div>

            {/* URL input */}
            <div className="relative">
              <label htmlFor="url" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LinkIcon className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('url')}
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                    }
                  `}
                  type="text"
                  id="url"
                  name="url"
                  placeholder="Entrer l'URL"
                />
              </div>
              {form.formState.errors.url && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            {/* Comment input */}
            <div className="relative">
              <label
                htmlFor="comment"
                className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}
              >
                Commentaire (optionnel)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                  <MessageSquare className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('comment')}
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                    }
                  `}
                  type="text"
                  id="comment"
                  name="comment"
                  placeholder="Entrer un commentaire"
                />
              </div>
              {form.formState.errors.comment && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.comment.message}
                </p>
              )}
            </div>

            {/* Image URL input */}
            <div className="relative">
              <label
                htmlFor="image"
                className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}
              >
                URL de l&apos;image (optionnel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('image')}
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]'
                    }
                  `}
                  type="text"
                  id="image"
                  name="image"
                  placeholder="Entrer l'URL de l'image"
                />
              </div>
              {form.formState.errors.image && (
                <p className="text-[var(--error)] text-sm mt-1 font-medium">
                  {form.formState.errors.image.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className={`
                  w-full
                  sm:w-1/2
                  px-6
                  py-3
                  rounded-xl
                  border
                  font-semibold
                  transition-all
                  duration-200
                  ${isChristmas
                    ? 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'
                    : 'surface-card border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
                  }
                `}
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
                    isChristmas
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-primary)]'
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
