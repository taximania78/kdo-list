import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

export const controlClass =
  'block w-full rounded-md border-[1.5px] border-line bg-paper px-3.5 py-3 text-ink placeholder:text-ink-muted/70 focus:outline-[2.5px] focus:outline-offset-1 focus:outline-primary disabled:opacity-50';

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  tone?: 'bg' | 'paper';
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, tone = 'bg', children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={htmlFor}
        className={`text-sm font-semibold ${tone === 'paper' ? 'text-ink-muted' : 'text-on-bg-muted'}`}
      >
        {label}
      </label>
      {children}
      {hint}
      {error && (
        <p role="alert" className="w-fit rounded-[3px] bg-paper px-2 py-1 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

/** Menu déroulant sans la flèche native : chevron de l'app, décoratif (le ref et les props vont au <select>). */
export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={`${controlClass} appearance-none pr-10 ${className}`} {...props} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${controlClass} min-h-20 ${className}`} {...props} />;
}
