import { render, screen } from '@testing-library/react';
import { TabBar } from '@/components/TabBar';
import { useAuth } from '@/hooks/useAuth';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin' }));
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));

const loggedAs = (user: { isAdmin: boolean; isMegaAdmin: boolean } | null) =>
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: user !== null, user, isLoading: false });

describe('TabBar', () => {
  it('renders nothing when logged out', () => {
    loggedAs(null);
    const { container } = render(<TabBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the lists tab and a sign-out tab to a family member', () => {
    loggedAs({ isAdmin: false, isMegaAdmin: false });
    render(<TabBar />);
    expect(screen.getByRole('link', { name: 'Listes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mes idées' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sortir' })).toBeInTheDocument();
  });

  it('shows every tab to a super admin and marks the current one', () => {
    loggedAs({ isAdmin: true, isMegaAdmin: true });
    render(<TabBar />);
    expect(screen.getByRole('link', { name: 'Mes idées' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('gives the tabs a rounded focus ring', () => {
    loggedAs({ isAdmin: false, isMegaAdmin: false });
    render(<TabBar />);
    expect(screen.getByRole('link', { name: /Listes/ })).toHaveClass('rounded-md');
  });
});
