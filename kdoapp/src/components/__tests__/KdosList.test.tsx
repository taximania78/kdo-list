import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KdosList from '@/components/KdosList';
import api from '@/lib/api';
import { getUserInfo } from '@/lib/auth';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({ getUserInfo: jest.fn() }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

const baseKdo = {
  id: 1,
  name: 'Vélo',
  price: null,
  user: 'Paul',
  url: null,
  comment: '',
  imageDisplay: 'unknown.jpg',
  availability: true,
  takenBy: null,
};

const listOf = (...kdos: object[]) => get.mockResolvedValue({ status: 200, data: kdos });

describe('KdosList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'marie', isAdmin: false, isMegaAdmin: false });
  });

  it('shows the price and the product link when they are set', async () => {
    listOf({ ...baseKdo, price: 120, url: 'https://example.com/velo' });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText(/120,00\s€/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir le produit' })).toHaveAttribute('href', 'https://example.com/velo');
  });

  it('hides the price and the product link when they are empty', async () => {
    listOf(baseKdo);
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Voir le produit' })).toBeNull();
  });

  it('reserves a free idea, then reloads the list', async () => {
    listOf(baseKdo);
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, je l'emballe/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/take-api\/1$/)));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('keeps the sheet open with the API message when someone was faster', async () => {
    listOf(baseKdo);
    post.mockRejectedValue({ response: { status: 409, data: { detail: "Cette idée vient d'être réservée." } } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, je l'emballe/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Cette idée vient d'être réservée.");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('lets me untie my own reservation', async () => {
    listOf({ ...baseKdo, availability: false, takenBy: 'marie' });
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Dénouer le ruban' }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, dénouer/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/untake-api\/1$/)));
  });

  it("does not let a family member release someone else's reservation", async () => {
    listOf({ ...baseKdo, id: 7, availability: false, takenBy: 'Paul' });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText('Emballé par Paul')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Libérer/ })).toBeNull();
  });

  it("lets an admin release someone else's reservation", async () => {
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'julie', isAdmin: true, isMegaAdmin: false });
    listOf({ ...baseKdo, id: 7, availability: false, takenBy: 'Paul' });
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Libérer la réservation' }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, libérer/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/untake-api\/7$/)));
  });

  it('filters the free ideas and mine', async () => {
    listOf(
      baseKdo,
      { ...baseKdo, id: 2, name: 'Pull', availability: false, takenBy: 'Paul' },
      { ...baseKdo, id: 3, name: 'Livre', availability: false, takenBy: 'marie' }
    );
    render(<KdosList listSlug="paul" />);
    await screen.findByRole('heading', { name: 'Pull' });

    await userEvent.click(screen.getByRole('button', { name: /Libres/ }));
    expect(screen.getByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pull' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Les miens/ }));
    expect(screen.getByRole('heading', { name: 'Livre' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vélo' })).toBeNull();
  });

  it('says so when the list cannot be loaded', async () => {
    get.mockRejectedValue(new Error('Network Error'));
    render(<KdosList listSlug="paul" />);
    expect(await screen.findByRole('alert')).toHaveTextContent("La liste n'a pas pu être chargée.");
  });
});
