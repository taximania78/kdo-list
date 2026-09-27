'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
import { ideaSchema, type IdeaInput, type IdeaOutput } from '@/lib/ideaSchema';
import { toListOptions, type ListOption } from '@/lib/lists';
import { IdeaFields } from '@/components/admin/IdeaFields';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { PageTitle } from '@/components/ui/PageTitle';

export default function AddItem() {
  const router = useRouter();
  const form = useForm<IdeaInput, unknown, IdeaOutput>({ resolver: zodResolver(ideaSchema) });
  const [listOptions, setListOptions] = useState<ListOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/lists/all/')
      .then((res) => {
        const opts = toListOptions(res.data);
        setListOptions(opts);
        if (opts.length > 0) form.setValue('list_slug', opts[0].value);
      })
      .catch((e) => {
        console.error('Failed to load lists:', e);
        setError("Les listes n'ont pas pu être chargées.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: IdeaOutput) {
    setError(null);
    const selectedList = listOptions.find((l) => l.value === values.list_slug);
    try {
      await api.post('/api/add-item/', { ...values, user: selectedList?.user || undefined });
      router.push('/admin');
    } catch (e) {
      setError(apiErrorMessage(e, "L'idée n'a pas pu être ajoutée."));
    }
  }

  return (
    <PageShell narrow>
      <Link href="/admin" className="mb-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-bg-muted hover:text-on-bg">
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux idées
      </Link>
      <PageTitle className="mb-7">Ajouter une idée</PageTitle>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <IdeaFields register={form.register} errors={form.formState.errors} listOptions={listOptions} />
        {error && (
          <p role="alert" className="w-fit rounded-md bg-paper px-3 py-2 font-semibold text-error">
            {error}
          </p>
        )}
        <Button type="submit" block pending={form.formState.isSubmitting} className="mt-2 py-3.5">
          <Plus className="size-4" aria-hidden />
          Ajouter l&apos;idée
        </Button>
      </form>
    </PageShell>
  );
}
