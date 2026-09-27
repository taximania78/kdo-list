import { render, screen } from '@testing-library/react';
import { AppHeader } from '@/components/AppHeader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

jest.mock('next/navigation', () => ({ usePathname: () => '/list' }));
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));

const loggedAs = (user: { isAdmin: boolean; isMegaAdmin: boolean } | null) =>
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: user !== null, user, isLoading: false });

describe('AppHeader', () => {
  it('shows only the app title when logged out', () => {
    loggedAs(null);
    render(<AppHeader />);
    expect(screen.getByRole('link', { name: "Liste d'anniversaire" })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('uses the Christmas title under the Christmas theme', () => {
    loggedAs(null);
    render(
      <ThemeProvider theme="christmas">
        <AppHeader />
      </ThemeProvider>
    );
    expect(screen.getByText('Liste de Noël')).toBeInTheDocument();
  });

  it('shows the super admin link only to a super admin', () => {
    loggedAs({ isAdmin: true, isMegaAdmin: false });
    const { unmount } = render(<AppHeader />);
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
    unmount();

    loggedAs({ isAdmin: true, isMegaAdmin: true });
    render(<AppHeader />);
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/superadmin');
  });

  it('marks the current section', () => {
    loggedAs({ isAdmin: false, isMegaAdmin: false });
    render(<AppHeader />);
    expect(screen.getByRole('link', { name: 'Listes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
  });
});
