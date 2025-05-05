// FormModifyItem.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { z } from 'zod';
import config from '../../config.json';
import api from '@/lib/api';
import { FaChevronDown } from 'react-icons/fa6';

const ApiAdress = config.apiAddress;

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
          onClick={() => setIsDialogOpen(true)} // Ouvrir le dialogue
          className="inline-block rounded-lg text-black px-6 py-2 transition-colors bg-white border hover:bg-gray-100"
        >
          Modifier
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black data-[state=open]:animate-overlayShow opacity-90" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray-100 p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow">
          <AlertDialog.Title className="text-lg font-bold">
            Modifier : {kdo.name}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mb-2">
              <form id={`modify-form-${id}`} onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="name">
                    Nom
                  </label>
                  <input
                    {...register('name')}
                    className="shadow appearance-none border rounded w-full py-1 px-3"
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Entrer le nom"
                    defaultValue={kdo.name}
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="price">
                    Prix
                  </label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    className="shadow appearance-none border rounded w-full py-1 px-3"
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    placeholder="Entrer le prix"
                    defaultValue={kdo.price}
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="user">
                    Pour
                  </label>
                  <select
                    {...register('user')}
                    className="shadow border rounded w-full py-2 px-3"
                    id="user"
                    name="user"
                    defaultValue={kdo.user}
                  >
                    <option value="Marie-Eve">Marie-Eve</option>
                    <option value="Mathieu">Mathieu</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="url">
                    URL
                  </label>
                  <input
                    {...register('url')}
                    className="shadow appearance-none border rounded w-full py-1 px-3"
                    type="text"
                    id="url"
                    name="url"
                    placeholder="Entrer l'URL"
                    defaultValue={kdo.url ?? ''}
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="comment">
                    Commentaire
                  </label>
                  <input
                    {...register('comment')}
                    className="shadow appearance-none border rounded w-full py-1 px-3"
                    type="text"
                    id="comment"
                    name="comment"
                    placeholder="Entrer un commentaire"
                    defaultValue={kdo.comment ?? ''}
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-bold" htmlFor="image">
                    URL de l&apos;image
                  </label>
                  <input
                    {...register('image')}
                    className="shadow appearance-none border rounded w-full py-1 px-3"
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

          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)} // Fermer le dialogue
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Annuler
              </button>
            </AlertDialog.Cancel>

            <button
              type="button"
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
              className={
                `rounded-lg text-white px-6 py-2 transition-colors bg-gradient-to-r ` +
                (theme === 'christmas'
                  ? 'from-green-600 to-red-600 hover:from-green-700 hover:to-red-700'
                  : 'from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700')
              }
            >
              Modifier
            </button>
          </div>
          <div>
            <Accordion.Root
              className="mt-2 bg-gray-100 rounded-lg p-2"
              type="single"
              collapsible
            >
              <Accordion.Item value="item-1">
                <Accordion.Trigger className="flex justify-between w-full">
                  <span className="text-sm text-red-500">
                    Supprimer l&apos;idée ?
                  </span>
                  <span className="ml-auto">
                    <FaChevronDown />
                  </span>
                </Accordion.Trigger>
                <Accordion.Content>
                  <button
                    className="w-full rounded-lg text-white px-6 py-2 bg-red-500 mt-2"
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
                    Supprimer
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
