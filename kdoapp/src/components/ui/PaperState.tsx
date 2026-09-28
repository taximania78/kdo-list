import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type PaperStateProps = {
  kind: 'loading' | 'empty' | 'error';
  children: ReactNode;
};

export function PaperState({ kind, children }: PaperStateProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="mx-auto my-12 flex w-fit max-w-md items-center gap-3 rounded-lg bg-paper px-5 py-4 text-ink shadow-paper"
    >
      {kind === 'loading' && <Loader2 className="size-5 animate-spin text-primary" aria-hidden />}
      <p className="font-semibold">{children}</p>
    </div>
  );
}
