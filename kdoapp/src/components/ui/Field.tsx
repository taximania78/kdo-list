import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

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
        <p role="alert" className="w-fit rounded-sm bg-paper px-2 py-1 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClass} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} min-h-20 ${className}`} {...props} />;
}
