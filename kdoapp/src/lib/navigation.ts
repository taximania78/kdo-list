export type NavIcon = 'list' | 'ideas' | 'admin';
export type NavItem = { href: string; label: string; icon: NavIcon };

type NavUser = { isAdmin: boolean; isMegaAdmin: boolean } | null;

export function navItems(user: NavUser): NavItem[] {
  if (!user) return [];
  const items: NavItem[] = [{ href: '/list', label: 'Listes', icon: 'list' }];
  if (user.isAdmin) items.push({ href: '/admin', label: 'Mes idées', icon: 'ideas' });
  if (user.isMegaAdmin) items.push({ href: '/admin/superadmin', label: 'Admin', icon: 'admin' });
  return items;
}

export function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname.startsWith('/admin') && !pathname.startsWith('/admin/superadmin');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
