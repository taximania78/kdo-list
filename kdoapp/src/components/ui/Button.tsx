import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'outline' | 'ghost';

// outline : posé sur le fond de page ; ghost : posé sur du papier.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  outline: 'text-on-bg ring-[1.5px] ring-inset ring-on-bg/30 hover:bg-on-bg/10',
  ghost: 'text-ink ring-[1.5px] ring-inset ring-ink/20 hover:bg-paper-2',
};

export function buttonClass(variant: Variant = 'primary', block = false): string {
  return [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[15px] font-bold transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    block ? 'w-full' : '',
  ].join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  pending?: boolean;
};

export function Button({
  variant = 'primary',
  block = false,
  pending = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${buttonClass(variant, block)} ${className}`}
      {...rest}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
