import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddItem from '@/app/admin/add/page';
import api from '@/lib/api';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      data: [
        { slug: 'liste-1', label: 'Liste 1', owner_id: 1, owner_name: 'Alice', is_common: false, enabled: true },
        { slug: 'commune', label: 'Liste commune', owner_id: null, owner_name: null, is_common: true, enabled: true },
      ],
    }),
    post: jest.fn(),
  },
}));

describe('AddItem list dropdown', () => {
  it('renders options fetched from the API', async () => {
    render(<AddItem />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Liste 1' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Liste commune' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Bob' })).toBeNull();
  });
});

describe('AddItem optional fields', () => {
  it('submits an idea with only a name and a list (price and URL sent as null)', async () => {
    const post = api.post as jest.Mock;
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<AddItem />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'Liste 1' })).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Nom'), 'Vélo');
    await userEvent.click(screen.getByRole('button', { name: /Ajouter/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'Vélo', list_slug: 'liste-1', price: null, url: null });
  });
});
