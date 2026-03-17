import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the environment variable
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

describe('LoginPage Component', () => {
  const mockPush = jest.fn();
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    global.fetch = mockFetch;

    // Default useAuth state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText("Nom d'utilisateur")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mot de passe")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('redirects to /list if user is already authenticated (regular user)', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { isAdmin: false },
    });
    
    render(<LoginPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/list');
  });

  it('redirects to /admin if user is already authenticated (admin)', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { isAdmin: true },
    });
    
    render(<LoginPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('shows an error message on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<LoginPage />);

    const userEntry = screen.getByPlaceholderText("Nom d'utilisateur");
    const pwdEntry = screen.getByPlaceholderText("Mot de passe");
    const btn = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(userEntry, 'wronguser');
    const form = btn.closest('form')!;
    Object.defineProperty(form, 'username', { value: userEntry });
    Object.defineProperty(form, 'password', { value: pwdEntry });
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Nom d'utilisateur ou mot de passe invalide.")).toBeInTheDocument();
    });
  });

  it('handles successful login and redirects to /first-connection if required', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'fakeToken',
        refresh_token: 'fakeRefresh',
        isAdmin: false,
        username: 'testuser',
        firstConnection: true,
      }),
    });

    render(<LoginPage />);

    const userEntry = screen.getByPlaceholderText("Nom d'utilisateur");
    const pwdEntry = screen.getByPlaceholderText("Mot de passe");
    const btn = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(userEntry, 'testuser');
    const form = btn.closest('form')!;
    Object.defineProperty(form, 'username', { value: userEntry });
    Object.defineProperty(form, 'password', { value: pwdEntry });
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('fakeToken');
      expect(sessionStorage.getItem('requirePasswordChange')).toBe('true');
      expect(mockPush).toHaveBeenCalledWith('/first-connection');
    });
  });
});
