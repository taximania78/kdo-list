import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/** Lien retour en haut de page ; zone à toucher de 44px de haut (tap-y) sans décaler la page. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mb-3.5 flex">
      <Link
        href={href}
        className="tap-y inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-on-bg-muted hover:text-on-bg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {children}
      </Link>
    </div>
  );
}
