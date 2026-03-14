// FormModifyItem.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { z } from 'zod';
import api from '@/lib/api';
import { isChristmas } from '@/lib/theme';
import {
  ChevronDown,
  Tag,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  Image as ImageIcon,
  Save,
  Trash2,
} from 'lucide-react';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const listOptions = [
  { value: 'marie-eve', label: 'Marie-Eve', user: 'Marie-Eve' },
  { value: 'mathieu', label: 'Mathieu', user: 'Mathieu' },
  { value: 'commune', label: 'Liste commune', user: null },
];

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  price: z.number().positive(),
  list_slug: z.enum(['marie-eve', 'mathieu', 'commune']),
  url: z.string().url({ message: 'Invalid url' }),
  comment: z.string().optional().nullable(),
  image: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface FormModifyItemProps {
  kdo: {
    id: number;
    name: string;
    price: number;
    user: string;
    url?: string;
    comment?: string | null;
    image?: string | null;
  };
  id: number;
  onFormSubmit?: () => void;
}

export default function FormModifyItem({
  kdo,
  id,
  onFormSubmit,
}: FormModifyItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const initialListSlug = React.useMemo(() => {
    // Si kdo.user = null/undefined (venant du backend sur la liste commune) => 'commune'
    if (!kdo.user) return 'commune';
    // Sinon on cherche la correspondance stricte
    const opt = listOptions.find((l) => l.user === kdo.user);
    return opt ? opt.value as 'marie-eve' | 'mathieu' | 'commune' : 'commune';
  }, [kdo.user]);

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: kdo.id,
      name: kdo.name,
      price: kdo.price,
      list_slug: initialListSlug,
      url: kdo.url ?? '',
      comment: kdo.comment ?? '',
      image: kdo.image ?? '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const apiUrl = `${ApiAdress}/api/modify-item/`;
    setIsDialogOpen(false);

    // Résoudre le user à partir du list_slug
    const selectedList = listOptions.find((l) => l.value === values.list_slug);
    const payload = {
      ...values,
      user: selectedList?.user || undefined, // undefined pour commune
      list_slug: values.list_slug,
    };

    try {
      const response = await api.put(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }

      const data = response.data;
      console.log('Success:', data, values);
      setIsDialogOpen(false);
      if (onFormSubmit) {
        onFormSubmit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteKdo = async (id: number) => {
    const apiUrl = `${ApiAdress}/api/delete-item/${id}/`;

    try {
      const response = await api.delete(apiUrl);

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }

      if (onFormSubmit) {
        onFormSubmit();
      }

      console.log('Item deleted successfully');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const inputClasses =
    'block w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--input-focus)]';

  return (
    <AlertDialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialog.Trigger asChild>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2 font-medium transition-all duration-200 bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
        >
          <Save className="w-4 h-4" />
          Modifier
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 data-[state=open]:animate-overlayShow" />
        <AlertDialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[85vh] w-[90vw] max-w-[600px] z-50 overflow-y-auto surface-card rounded-2xl p-8 shadow-xl focus:outline-none data-[state=open]:animate-contentShow ${
            isChristmas ? 'backdrop-blur-lg' : ''
          }`}
        >
          <AlertDialog.Title className="text-2xl font-bold mb-6 flex items-center gap-3 text-[var(--text-primary)]">
            <Save className="w-6 h-6 text-[var(--primary)]" />
            Modifier : {kdo.name}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div>
              <form
                id={`modify-form-${id}`}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="relative">
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="name"
                  >
                    Nom
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <Tag className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <input
                    {...register('name')}
                    className={inputClasses}
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Entrer le nom"
                    defaultValue={kdo.name}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="price"
                  >
                    Prix
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <DollarSign className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    className={inputClasses}
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    placeholder="Entrer le prix"
                    defaultValue={kdo.price}
                  />
                </div>

                <div>
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="list_slug"
                  >
                    Pour
                  </label>
                  <select
                    {...register('list_slug')}
                    className="block w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] focus:ring-[var(--input-focus)]"
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

                <div className="relative">
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="url"
                  >
                    URL
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <LinkIcon className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <input
                    {...register('url')}
                    className={inputClasses}
                    type="text"
                    id="url"
                    name="url"
                    placeholder="Entrer l'URL"
                    defaultValue={kdo.url ?? ''}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="comment"
                  >
                    Commentaire
                  </label>
                  <div className="absolute top-12 left-0 pl-3 flex items-start pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <textarea
                    {...register('comment')}
                    className={`${inputClasses} min-h-[80px]`}
                    id="comment"
                    name="comment"
                    placeholder="Entrer un commentaire"
                    defaultValue={kdo.comment ?? ''}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block font-medium mb-2 text-[var(--text-secondary)]"
                    htmlFor="image"
                  >
                    URL de l&apos;image
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                  <input
                    {...register('image')}
                    className={inputClasses}
                    type="text"
                    id="image"
                    name="image"
                    placeholder="Entrer l'URL de l'image"
                    defaultValue={kdo.image ?? ''}
                  />
                </div>
              </form>
            </div>
          </AlertDialog.Description>

          <div className="mt-6 flex gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 border bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border-[var(--border)]"
              >
                Annuler
              </button>
            </AlertDialog.Cancel>

            <button
              type="button"
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[var(--on-primary)] font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-primary)] ${
                isChristmas
                  ? 'bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700'
                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
              }`}
            >
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </div>

          <div className="mt-4">
            <Accordion.Root
              className="rounded-lg overflow-hidden border border-[var(--danger)] bg-[var(--surface-muted)]"
              type="single"
              collapsible
            >
              <Accordion.Item value="item-1" className="border-none">
                <Accordion.Trigger className="flex justify-between items-center w-full px-4 py-3 text-[var(--danger)] hover:text-[var(--danger-hover)] transition-colors duration-200 group">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Supprimer l&apos;idée ?
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
                <Accordion.Content className="px-4 pb-4 pt-2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-lg text-[var(--on-primary)] px-6 py-3 bg-[var(--danger)] hover:bg-[var(--danger-hover)] font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Êtes-vous sûr de vouloir supprimer cet article?'
                        )
                      ) {
                        deleteKdo(kdo.id);
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    Confirmer la suppression
                  </button>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
