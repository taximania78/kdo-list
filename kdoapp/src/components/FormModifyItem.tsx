// FormModifyItem.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { z } from 'zod';
import api from '@/lib/api';
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

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  price: z.number().positive(),
  user: z.string(),
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
  theme: string;
  onFormSubmit?: () => void;
}

export default function FormModifyItem({
  kdo,
  id,
  theme,
  onFormSubmit,
}: FormModifyItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // État pour contrôler le dialogue

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: kdo.id,
      name: kdo.name,
      price: kdo.price,
      user: kdo.user,
      url: kdo.url ?? '',
      comment: kdo.comment ?? '',
      image: kdo.image ?? '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const apiUrl = `${ApiAdress}/api/modify-item/`;
    setIsDialogOpen(false);

    try {
      const response = await api.put(apiUrl, values, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
      }

      const data = response.data;
      console.log('Success:', data, values);
      setIsDialogOpen(false); // Fermer le dialogue après succès
      // window.location.reload();
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

  return (
    <AlertDialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialog.Trigger asChild>
        <button
          onClick={() => setIsDialogOpen(true)}
          className={`
            inline-flex
            items-center
            gap-2
            rounded-lg
            px-6
            py-2
            font-medium
            transition-all
            duration-200
            ${
              theme === 'christmas'
                ? 'bg-white/90 text-red-700 hover:bg-white border border-red-200/50'
                : 'bg-white/90 text-sky-700 hover:bg-white border border-sky-200/50'
            }
          `}
        >
          <Save className="w-4 h-4" />
          Modifier
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/90 data-[state=open]:animate-overlayShow" />
        <AlertDialog.Content
          className={`
            fixed
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            max-h-[85vh]
            w-[90vw]
            max-w-[600px]
            overflow-y-auto
            backdrop-blur-lg
            ${
              theme === 'christmas'
                ? 'bg-red-900/90'
                : 'bg-indigo-900/90'
            }
            rounded-2xl
            p-8
            border
            border-white/20
            shadow-2xl
            focus:outline-none
            data-[state=open]:animate-contentShow
          `}
        >
          <AlertDialog.Title className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Save className="w-6 h-6" />
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
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="name"
                  >
                    Nom
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <Tag className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    {...register('name')}
                    className="
                      block
                      w-full
                      pl-10
                      pr-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
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
                    defaultValue={kdo.name}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="price"
                  >
                    Prix
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <DollarSign className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    className="
                      block
                      w-full
                      pl-10
                      pr-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
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
                    defaultValue={kdo.price}
                  />
                </div>

                <div>
                  <label
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="user"
                  >
                    Pour
                  </label>
                  <select
                    {...register('user')}
                    className="
                      block
                      w-full
                      px-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
                      text-white
                      focus:outline-none
                      focus:ring-2
                      focus:ring-white/50
                      focus:border-transparent
                      transition-all
                      duration-200
                    "
                    id="user"
                    name="user"
                    defaultValue={kdo.user}
                  >
                    <option value="Marie-Eve" className="text-gray-900">
                      Marie-Eve
                    </option>
                    <option value="Mathieu" className="text-gray-900">
                      Mathieu
                    </option>
                  </select>
                </div>

                <div className="relative">
                  <label
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="url"
                  >
                    URL
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <LinkIcon className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    {...register('url')}
                    className="
                      block
                      w-full
                      pl-10
                      pr-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
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
                    defaultValue={kdo.url ?? ''}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="comment"
                  >
                    Commentaire
                  </label>
                  <div className="absolute top-12 left-0 pl-3 flex items-start pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-white/60" />
                  </div>
                  <textarea
                    {...register('comment')}
                    className="
                      block
                      w-full
                      pl-10
                      pr-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
                      text-white
                      placeholder-white/60
                      focus:outline-none
                      focus:ring-2
                      focus:ring-white/50
                      focus:border-transparent
                      transition-all
                      duration-200
                      min-h-[80px]
                    "
                    id="comment"
                    name="comment"
                    placeholder="Entrer un commentaire"
                    defaultValue={kdo.comment ?? ''}
                  />
                </div>

                <div className="relative">
                  <label
                    className="block text-white/90 font-medium mb-2"
                    htmlFor="image"
                  >
                    URL de l&apos;image
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-8">
                    <ImageIcon className="h-5 w-5 text-white/60" />
                  </div>
                  <input
                    {...register('image')}
                    className="
                      block
                      w-full
                      pl-10
                      pr-4
                      py-3
                      bg-white/20
                      backdrop-blur-sm
                      border
                      border-white/30
                      rounded-lg
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
                className="
                  flex-1
                  px-4
                  py-3
                  rounded-lg
                  bg-white/20
                  hover:bg-white/30
                  text-white
                  font-medium
                  transition-all
                  duration-200
                  backdrop-blur-sm
                  border
                  border-white/30
                "
              >
                Annuler
              </button>
            </AlertDialog.Cancel>

            <button
              type="button"
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
              className={`
                flex-1
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-3
                rounded-lg
                text-white
                font-semibold
                transition-all
                duration-200
                transform
                hover:scale-[1.02]
                active:scale-[0.98]
                ${
                  theme === 'christmas'
                    ? 'bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-lg shadow-sky-500/30'
                }
              `}
            >
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </div>

          <div className="mt-4">
            <Accordion.Root
              className={`
                rounded-lg
                overflow-hidden
                border
                ${
                  theme === 'christmas'
                    ? 'border-red-700/50 bg-red-950/30'
                    : 'border-indigo-700/50 bg-indigo-950/30'
                }
                backdrop-blur-sm
              `}
              type="single"
              collapsible
            >
              <Accordion.Item value="item-1" className="border-none">
                <Accordion.Trigger
                  className="
                    flex
                    justify-between
                    items-center
                    w-full
                    px-4
                    py-3
                    text-red-400
                    hover:text-red-300
                    transition-colors
                    duration-200
                    group
                  "
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Supprimer l&apos;idée ?
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
                <Accordion.Content className="px-4 pb-4 pt-2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  <button
                    className="
                      w-full
                      flex
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      text-white
                      px-6
                      py-3
                      bg-red-600
                      hover:bg-red-700
                      font-semibold
                      transition-all
                      duration-200
                      transform
                      hover:scale-[1.02]
                      active:scale-[0.98]
                      shadow-lg
                      shadow-red-500/30
                    "
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
