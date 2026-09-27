import { render, screen } from '@testing-library/react';
import KdosList from '@/components/KdosList';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({
  getUserInfo: () => ({ username: 'marie', isAdmin: false, isMegaAdmin: false }),
}));

const get = api.get as jest.Mock;

const baseKdo = {
  id: 1,
  name: 'Vélo',
  user: 'Paul',
  comment: '',
  imageDisplay: 'unknown.jpg',
  availability: true,
  takenBy: null,
};

describe('KdosList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the price and the product link when they are set', async () => {
    get.mockResolvedValue({ status: 200, data: [{ ...baseKdo, price: 120, url: 'https://example.com/velo' }] });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText('120€')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir le produit' })).toHaveAttribute('href', 'https://example.com/velo');
  });

  it('hides the price and the product link when they are empty', async () => {
    get.mockResolvedValue({ status: 200, data: [{ ...baseKdo, price: null, url: null }] });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText('Vélo')).toBeInTheDocument();
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Voir le produit' })).toBeNull();
  });
});
