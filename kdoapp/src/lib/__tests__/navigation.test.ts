import { isActive, navItems } from '@/lib/navigation';

const hrefs = (user: Parameters<typeof navItems>[0]) => navItems(user).map((i) => i.href);

describe('navItems', () => {
  it('is empty when logged out', () => {
    expect(navItems(null)).toEqual([]);
  });

  it('gives each role its links', () => {
    expect(hrefs({ isAdmin: false, isMegaAdmin: false })).toEqual(['/list']);
    expect(hrefs({ isAdmin: true, isMegaAdmin: false })).toEqual(['/list', '/admin']);
    expect(hrefs({ isAdmin: true, isMegaAdmin: true })).toEqual(['/list', '/admin', '/admin/superadmin']);
  });
});

describe('isActive', () => {
  it('matches a section and its sub-pages', () => {
    expect(isActive('/list', '/list')).toBe(true);
    expect(isActive('/list/lea', '/list')).toBe(true);
    expect(isActive('/admin/add', '/admin')).toBe(true);
    expect(isActive('/admin/superadmin/add-user', '/admin/superadmin')).toBe(true);
  });

  it('keeps « Mes idées » off on super admin pages', () => {
    expect(isActive('/admin/superadmin', '/admin')).toBe(false);
    expect(isActive('/', '/list')).toBe(false);
  });
});
