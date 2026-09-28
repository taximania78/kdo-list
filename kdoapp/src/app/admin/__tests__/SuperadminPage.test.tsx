import { render, screen } from '@testing-library/react';
import Superadmin from '@/app/admin/superadmin/page';
import api from '@/lib/api';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/admin/superadmin' }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { sub: '1', isAdmin: true, isMegaAdmin: true } }),
}));
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));

describe('Super admin page — tabs', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockResolvedValue({ status: 200, data: [] });
  });

  it('rounds the tab triggers so the focus ring follows a rounded outline, with a straight underline', async () => {
    render(<Superadmin />);
    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab).toHaveClass('rounded-md');
      // Le soulignement de l'onglet actif est une barre (::after), pas une ombre intérieure
      // qui suivrait les coins arrondis.
      expect(tab.className).not.toMatch(/shadow-\[inset/);
      expect(tab.className).toMatch(/after:bg-primary/);
    }
  });
});
