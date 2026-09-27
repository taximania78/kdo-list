import { z } from 'zod';

// Prix facultatif : un champ numérique vide vaut NaN (valueAsNumber) → envoyé comme null
export const optionalPrice = z.preprocess(
  (value) => (typeof value === 'number' && Number.isNaN(value) ? null : value),
  z.number().positive().nullable().optional()
);

// URL facultative : un champ vide est envoyé comme null (l'API refuse une URL "")
export const optionalUrl = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().url({ message: 'Invalid url' }).nullable().optional()
);
