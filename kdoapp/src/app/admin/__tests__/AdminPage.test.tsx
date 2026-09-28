import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Admin from '@/app/admin/page';
import api from '@/lib/api';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { isAdmin: true } }),
}));
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));

const get = api.get as jest.Mock;

const idea = (id: number, name: string) => ({
  id,
  name,
  price: null,
  user: '',
  url: null,
  comment: null,
  image: null,
  imageDisplay: 'unknown.jpg',
});

function slugFrom(url: string): string {
  const match = /list=([^&]+)/.exec(url);
  return match ? decodeURIComponent(match[1]) : '';
}

describe('Admin page — list switching races', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the ideas of the last selected list, ignoring a stale response', async () => {
    const lists = [
      { slug: 'other', label: 'Autre', owner_name: 'Autre', is_common: false, enabled: true },
      { slug: 'a', label: 'Liste A', owner_name: 'Alice', is_common: false, enabled: true },
      { slug: 'b', label: 'Liste B', owner_name: 'Bob', is_common: false, enabled: true },
    ];
    const pending: Record<string, { resolve: (value: unknown) => void }> = {};
    get.mockImplementation((url: string) => {
      if (url.includes('/api/lists/all/')) return Promise.resolve({ status: 200, data: lists });
      const slug = slugFrom(url);
      return new Promise((resolve) => {
        pending[slug] = { resolve };
      });
    });

    render(<Admin />);

    await userEvent.click(await screen.findByRole('button', { name: 'Liste A' }));
    await waitFor(() => expect(pending.a).toBeDefined());

    await userEvent.click(screen.getByRole('button', { name: 'Liste B' }));
    await waitFor(() => expect(pending.b).toBeDefined());

    // La liste B répond en premier…
    await act(async () => {
      pending.b.resolve({ status: 200, data: [idea(2, 'Idée B')] });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText('Idée B')).toBeInTheDocument();

    // …puis la réponse tardive de A arrive : elle ne doit rien changer, la
    // sélection courante (B) doit rester affichée.
    await act(async () => {
      pending.a.resolve({ status: 200, data: [idea(1, 'Idée A')] });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByText('Idée A')).toBeNull();
    expect(screen.getByText('Idée B')).toBeInTheDocument();
  });

  it('clears a previous error immediately when selecting another list, and shows its ideas once loaded', async () => {
    const lists = [
      { slug: 'a', label: 'Liste A', owner_name: 'Alice', is_common: false, enabled: true },
      { slug: 'b', label: 'Liste B', owner_name: 'Bob', is_common: false, enabled: true },
    ];
    const pending: Record<string, { resolve: (value: unknown) => void }> = {};
    get.mockImplementation((url: string) => {
      if (url.includes('/api/lists/all/')) return Promise.resolve({ status: 200, data: lists });
      const slug = slugFrom(url);
      if (slug === 'a') return Promise.reject(new Error('boom'));
      return new Promise((resolve) => {
        pending[slug] = { resolve };
      });
    });

    render(<Admin />);

    expect(await screen.findByRole('alert')).toHaveTextContent("Les idées n'ont pas pu être chargées.");

    await userEvent.click(screen.getByRole('button', { name: 'Liste B' }));
    await waitFor(() => expect(pending.b).toBeDefined());

    // Dès la sélection d'une autre liste, l'ancienne erreur ne doit plus s'afficher
    // (même si la nouvelle requête n'a pas encore répondu).
    expect(screen.queryByRole('alert')).toBeNull();

    await act(async () => {
      pending.b.resolve({ status: 200, data: [idea(2, 'Idée B')] });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Idée B')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Admin page — list chips layout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('wraps the list chips on every screen size instead of scrolling sideways', async () => {
    get.mockImplementation((url: string) =>
      url.includes('/api/lists/all/')
        ? Promise.resolve({
            status: 200,
            data: [{ slug: 'a', label: 'Liste A', owner_name: 'Alice', is_common: false, enabled: true }],
          })
        : Promise.resolve({ status: 200, data: [] })
    );
    render(<Admin />);

    const group = await screen.findByRole('group', { name: 'Choisir une liste' });
    expect(group).toHaveClass('flex-wrap');
    expect(group).not.toHaveClass('overflow-x-auto');
    expect(group.className).not.toMatch(/(^|\s)-mx-/);
  });
});
