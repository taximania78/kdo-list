import { Check, X } from 'lucide-react';
import { passwordChecks } from '@/lib/passwordRules';

export function PasswordRules({ password }: { password: string }) {
  return (
    <ul aria-label="Règles du mot de passe" className="grid gap-1 text-sm">
      {passwordChecks(password).map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-2 ${rule.met ? 'font-semibold text-on-bg' : 'text-on-bg-muted'}`}
        >
          {rule.met ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
