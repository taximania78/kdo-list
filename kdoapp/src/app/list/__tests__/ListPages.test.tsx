import { render, screen } from '@testing-library/react';
import ListSelectorPage from '@/app/list/page';
import ListDetailPage from '@/app/list/[slug]/page';
import api from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ slug: 'lea' }),
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { isAdmin: false } }),
}));
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/components/KdosList', () => ({
  __esModule: true,
  default: ({ listSlug }: { listSlug: string }) => <p>idées de {listSlug}</p>,
}));

const get = api.get as jest.Mock;

const lists = [
  { slug: 'lea', label: 'Léa', owner_name: 'Léa', is_common: false, enabled: true },
  { slug: 'commune', label: 'Liste commune', owner_name: null, is_common: true, enabled: true },
];

describe('ListSelectorPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows one band per list, linking to it', async () => {
    get.mockResolvedValue({ status: 200, data: lists });
    render(<ListSelectorPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'À qui fait-on plaisir ?' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Léa/ })).toHaveAttribute('href', '/list/lea');
    expect(screen.getByRole('link', { name: /Liste commune/ })).toHaveClass('is-common');
  });

  it('reassures that the gift stays a surprise', () => {
    get.mockResolvedValue({ status: 200, data: lists });
    render(<ListSelectorPage />);
    expect(screen.getByText('la personne ne saura pas ce que tu lui offres')).toBeInTheDocument();
  });

  it('shows only the first name on each band, without a repeated « Voir les idées »', async () => {
    get.mockResolvedValue({ status: 200, data: lists });
    render(<ListSelectorPage />);

    // Le nom accessible du lien est exactement le libellé de la liste.
    expect(await screen.findByRole('link', { name: 'Léa' })).toHaveAttribute('href', '/list/lea');
    expect(screen.getByRole('link', { name: 'Liste commune' })).toHaveAttribute('href', '/list/commune');
    expect(screen.queryByText('Voir les idées')).toBeNull();
  });

  it('shows an empty state', async () => {
    get.mockResolvedValue({ status: 200, data: [] });
    render(<ListSelectorPage />);
    expect(await screen.findByText('Aucune liste pour le moment.')).toBeInTheDocument();
  });

  it('shows an error when the lists cannot be loaded', async () => {
    get.mockRejectedValue(new Error('Network Error'));
    render(<ListSelectorPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent("Les listes n'ont pas pu être chargées.");
  });
});

describe('ListDetailPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the person's name in big and their ideas", async () => {
    get.mockResolvedValue({ status: 200, data: lists });
    render(<ListDetailPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Léa' })).toBeInTheDocument();
    expect(screen.getByText('Les envies de')).toBeInTheDocument();
    expect(screen.getByText('idées de lea')).toBeInTheDocument();
  });

  it('balances the giant first name so a lone word never sits alone on the last line', async () => {
    get.mockResolvedValue({ status: 200, data: lists });
    render(<ListDetailPage />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Léa' })).toHaveClass('text-balance');
  });

  it('says so when the list does not exist', async () => {
    get.mockResolvedValue({ status: 200, data: [lists[1]] });
    render(<ListDetailPage />);

    expect(await screen.findByText("Cette liste n'existe pas ou n'est pas accessible.")).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Toutes les listes/ }).length).toBeGreaterThan(0);
  });
});
