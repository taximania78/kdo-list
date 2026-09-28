import { z } from 'zod';

export const PASSWORD_MESSAGES = {
  minLength: 'Le mot de passe doit contenir au moins 8 caractères.',
  uppercase: 'Le mot de passe doit contenir au moins une lettre majuscule.',
  number: 'Le mot de passe doit contenir au moins un chiffre.',
  special: 'Le mot de passe doit contenir au moins un caractère spécial.',
} as const;

export const strongPassword = z
  .string()
  .min(8, { message: PASSWORD_MESSAGES.minLength })
  .regex(/[A-Z]/, { message: PASSWORD_MESSAGES.uppercase })
  .regex(/\d/, { message: PASSWORD_MESSAGES.number })
  .regex(/[\W_]/, { message: PASSWORD_MESSAGES.special });

const RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'Au moins 8 caractères', test: (p) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /\d/.test(p) },
  { label: 'Un caractère spécial', test: (p) => /[\W_]/.test(p) },
];

export function passwordChecks(password: string): { label: string; met: boolean }[] {
  return RULES.map((rule) => ({ label: rule.label, met: rule.test(password) }));
}
