'use client';

import type { ReactNode } from 'react';
import { Dialog } from 'radix-ui';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
};

/** Panneau qui monte du bas sur mobile, fenêtre centrée à partir de md. */
export function Sheet({ open, onOpenChange, title, description, wide = false, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className={`sheet-panel fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-paper px-5 pb-8 pt-3 text-ink md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:p-7 ${wide ? 'md:w-[600px]' : 'md:w-[440px]'}`}
        >
          <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded bg-line md:hidden" />
          <Dialog.Title className="font-display text-3xl font-extrabold leading-none tracking-[-0.035em]">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description asChild>
              <div className="mt-4">{description}</div>
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
