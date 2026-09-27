'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import { ideaSchema, type IdeaInput, type IdeaOutput } from '@/lib/ideaSchema';
import type { ListOption } from '@/lib/lists';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { IdeaFields } from '@/components/admin/IdeaFields';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

interface FormModifyItemProps {
  kdo: {
    id: number;
    name: string;
    price: number | null;
    user: string;
    url?: string | null;
    comment?: string | null;
    image?: string | null;
  };
  id: number;
  onFormSubmit?: () => void;
  listOptions: ListOption[];
}

export default function FormModifyItem({ kdo, id, onFormSubmit, listOptions }: FormModifyItemProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sans propriétaire (ou propriétaire inconnu) : liste commune
  const initialListSlug = useMemo(
    () => listOptions.find((l) => kdo.user && l.user === kdo.user)?.value ?? 'commune',
    [kdo.user, listOptions]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IdeaInput, unknown, IdeaOutput>({ resolver: zodResolver(ideaSchema) });

  // Valeurs relues à chaque ouverture : les listes peuvent arriver après le premier rendu
  const openSheet = () => {
    reset({
      name: kdo.name,
      price: kdo.price,
      list_slug: initialListSlug,
      url: kdo.url ?? '',
      comment: kdo.comment ?? '',
      image: kdo.image ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const onSubmit = async (values: IdeaOutput) => {
    setError(null);
    const selectedList = listOptions.find((l) => l.value === values.list_slug);
    try {
      await api.put(
        `${ApiAdress}/api/modify-item/`,
        { ...values, id, user: selectedList?.user || undefined },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setOpen(false);
      onFormSubmit?.();
    } catch (e) {
      setError(apiErrorMessage(e, "L'idée n'a pas pu être enregistrée."));
    }
  };

  return (
    <>
      <button type="button" onClick={openSheet} className="text-sm font-bold text-primary underline-offset-4 hover:underline">
        Modifier
      </button>
      <Sheet open={open} onOpenChange={setOpen} title={`Modifier : ${kdo.name}`} wide>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 grid gap-4">
          <IdeaFields register={register} errors={errors} listOptions={listOptions} tone="paper" />
          {error && (
            <p role="alert" className="rounded-md bg-paper-2 px-3 py-2 text-sm font-semibold text-error">
              {error}
            </p>
          )}
          <div className="mt-2 grid gap-2.5 md:grid-cols-2">
            <Button type="submit" pending={isSubmitting} className="md:order-2">
              Enregistrer
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
