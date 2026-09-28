'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { isActive, navItems } from '@/lib/navigation';
import { logout } from '@/lib/logout';

const linkClass =
  'rounded-md px-3 py-2 text-[15px] font-semibold text-on-bg-muted hover:text-on-bg aria-[current=page]:rounded-none aria-[current=page]:text-on-bg aria-[current=page]:shadow-[inset_0_-2px_0_var(--primary)]';

export function AppHeader() {
  const { config } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const items = navItems(isAuthenticated ? user : null);

  return (
    <header className="grain sticky top-0 z-40 bg-bg">
      <div className="mx-auto flex h-15 max-w-[1280px] items-center justify-between px-5 md:h-18 md:px-10">
        <Link
          href={isAuthenticated ? '/list' : '/'}
          className="flex min-h-11 items-center gap-2.5 font-display text-[19px] font-bold tracking-[-0.02em] text-on-bg"
        >
          <Gift className="size-6 text-wordmark" aria-hidden />
          {config.appTitle}
        </Link>
        {items.length > 0 && (
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={linkClass}
              >
                {item.label}
              </Link>
            ))}
            <button type="button" onClick={() => logout()} className={linkClass}>
              Déconnexion
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
