import type { ReactNode } from 'react';

type ChipProps = {
  pressed: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
};

export function Chip({ pressed, onClick, count, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex shrink-0 items-baseline gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-on-bg-muted ring-[1.5px] ring-inset ring-on-bg/25 aria-pressed:bg-on-bg aria-pressed:text-bg aria-pressed:ring-0"
    >
      {children}
      {count !== undefined && <span className="font-mono text-xs">{count}</span>}
    </button>
  );
}
