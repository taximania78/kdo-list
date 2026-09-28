import type { ReactNode } from 'react';

type PageTitleProps = { children: ReactNode; hand?: string; className?: string };

export function PageTitle({ children, hand, className = '' }: PageTitleProps) {
  return (
    <div className={className}>
      <h1 className="font-display text-[40px] font-extrabold leading-[0.92] tracking-[-0.035em] text-on-bg break-words text-balance md:text-[clamp(56px,6vw,92px)]">
        {children}
      </h1>
      {hand && <p className="mt-2 font-hand text-2xl font-semibold text-hand">{hand}</p>}
    </div>
  );
}
