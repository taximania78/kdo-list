import { render, screen } from '@testing-library/react';
import { Nav } from '@/components/Nav';
import { ThemeProvider } from '@/components/ThemeProvider';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin' }));
jest.mock('@/lib/auth', () => ({
  isTokenDecodable: () => true,
  decodeToken: jest.fn(),
  clearAuthStorage: jest.fn(),
}));
import { decodeToken } from '@/lib/auth';

describe('Nav role-based links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('authToken', 'fake');
  });

  it('shows the superadmin Admin link for a megaAdmin', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: true, isMegaAdmin: true });
    render(<Nav />);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('hides the superadmin Admin link for a non-mega admin', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: true, isMegaAdmin: false });
    render(<Nav />);
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('shows the Christmas title when the theme is christmas', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: false, isMegaAdmin: false });
    render(
      <ThemeProvider theme="christmas">
        <Nav />
      </ThemeProvider>,
    );
    expect(screen.getByText(/Liste de Noël/)).toBeInTheDocument();
  });

  it('shows the birthday title by default', () => {
    (decodeToken as jest.Mock).mockReturnValue({ username: 'whoever', isAdmin: false, isMegaAdmin: false });
    render(<Nav />);
    expect(screen.getByText(/Liste d'anniversaire/)).toBeInTheDocument();
  });
});
