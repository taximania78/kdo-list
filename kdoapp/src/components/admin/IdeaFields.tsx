import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { IdeaInput } from '@/lib/ideaSchema';
import type { ListOption } from '@/lib/lists';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';

type IdeaFieldsProps = {
  register: UseFormRegister<IdeaInput>;
  errors: FieldErrors<IdeaInput>;
  listOptions: ListOption[];
  tone?: 'bg' | 'paper';
};

export function IdeaFields({ register, errors, listOptions, tone = 'bg' }: IdeaFieldsProps) {
  return (
    <>
      <Field tone={tone} label="Nom" htmlFor="name" error={errors.name?.message}>
        <Input {...register('name')} id="name" placeholder="Ex. Casque audio sans fil" />
      </Field>
      <Field tone={tone} label="Prix (facultatif)" htmlFor="price" error={errors.price?.message}>
        <Input
          {...register('price', { valueAsNumber: true })}
          id="price"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="Ex. 42,00"
        />
      </Field>
      <Field tone={tone} label="Pour" htmlFor="list_slug" error={errors.list_slug?.message}>
        <Select {...register('list_slug')} id="list_slug">
          {listOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field tone={tone} label="URL (facultatif)" htmlFor="url" error={errors.url?.message}>
        <Input {...register('url')} id="url" inputMode="url" placeholder="https://…" />
      </Field>
      <Field tone={tone} label="Commentaire (facultatif)" htmlFor="comment" error={errors.comment?.message}>
        <Textarea {...register('comment')} id="comment" placeholder="Ex. plutôt en blanc, taille M" />
      </Field>
      <Field tone={tone} label="URL de l'image (facultatif)" htmlFor="image" error={errors.image?.message}>
        <Input {...register('image')} id="image" inputMode="url" placeholder="https://…" />
      </Field>
    </>
  );
}
