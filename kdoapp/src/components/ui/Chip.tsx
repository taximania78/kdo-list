import type { ReactNode } from 'react';

type ChipProps = {
  pressed: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
};

/**
 * Filtre en pilule. Le bouton offre une zone à toucher de 44px de haut (compensée par une
 * marge négative) ; la pilule visible, et son anneau de focus, sont portés par l'intérieur.
 */
export function Chip({ pressed, onClick, count, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="group -my-1.5 inline-flex min-h-11 shrink-0 items-center rounded-full focus-visible:outline-none"
    >
      <span className="inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-on-bg-muted ring-[1.5px] ring-inset ring-on-bg/25 outline-offset-2 outline-primary group-focus-visible:outline-[2.5px] group-focus-visible:outline-solid group-aria-pressed:bg-on-bg group-aria-pressed:text-bg group-aria-pressed:ring-0">
        {children}
        {count !== undefined && <span className="font-mono text-xs">{count}</span>}
      </span>
    </button>
  );
}
