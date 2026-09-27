import { z } from 'zod';
import { optionalPrice, optionalUrl } from '@/lib/optionalFields';

// Partagé par l'ajout et la modification d'une idée.
export const ideaSchema = z.object({
  name: z.string().trim().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  price: optionalPrice,
  list_slug: z.string().min(1, { message: 'Sélectionnez une liste' }),
  url: optionalUrl,
  comment: z.string().nullable().optional(),
  image: z
    .union([z.url({ error: "L'URL de l'image n'est pas valide." }), z.literal('')])
    .nullable()
    .optional(),
});

export type IdeaInput = z.input<typeof ideaSchema>;
export type IdeaOutput = z.output<typeof ideaSchema>;
