import type { ReactNode } from 'react';

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div
      className={`mx-auto w-full px-5 pb-10 pt-2 md:px-10 md:pb-16 md:pt-4 ${narrow ? 'max-w-[560px]' : 'max-w-[1280px]'}`}
    >
      {children}
    </div>
  );
}
