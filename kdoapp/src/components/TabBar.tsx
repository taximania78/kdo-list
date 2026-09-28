'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, LogOut, Pencil, Shield, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isActive, navItems, type NavIcon } from '@/lib/navigation';
import { logout } from '@/lib/logout';

const ICONS: Record<NavIcon, LucideIcon> = { list: List, ideas: Pencil, admin: Shield };

const tabClass =
  'grid w-full justify-items-center gap-0.5 rounded-md py-2 text-xs font-semibold aria-[current=page]:text-primary';

/** Barre d'onglets du bas, mobile uniquement. */
export function TabBar() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const items = navItems(isAuthenticated ? user : null);
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navigation mobile"
      className="sticky bottom-0 z-40 border-t border-line bg-paper pb-[max(env(safe-area-inset-bottom),12px)] text-ink-muted md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={tabClass}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => logout()} className={tabClass}>
            <LogOut className="size-5" aria-hidden />
            Sortir
          </button>
        </li>
      </ul>
    </nav>
  );
}
