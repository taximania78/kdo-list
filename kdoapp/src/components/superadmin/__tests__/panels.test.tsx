import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListsPanel } from '@/components/superadmin/ListsPanel';
import { UsersPanel } from '@/components/superadmin/UsersPanel';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mocked = api as unknown as Record<'get' | 'post' | 'patch' | 'delete', jest.Mock>;

const users = [
  { id: 1, name: 'Mathieu', isAdmin: true, isMegaAdmin: true },
  { id: 2, name: 'Léa', isAdmin: false, isMegaAdmin: false },
];

describe('UsersPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a person after confirmation', async () => {
    mocked.delete.mockResolvedValue({ status: 200, data: {} });
    const onChanged = jest.fn();
    render(<UsersPanel users={users} meId={1} onChanged={onChanged} />);

    const [, leaDelete] = screen.getAllByRole('button', { name: 'Supprimer' });
    await userEvent.click(leaDelete);
    await userEvent.click(screen.getByRole('button', { name: /Oui, supprimer/ }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(mocked.delete).toHaveBeenCalledWith(expect.stringMatching(/\/api\/delete-user\/2$/));
  });

  it('cannot change the role of a super admin nor my own', () => {
    render(<UsersPanel users={users} meId={1} onChanged={jest.fn()} />);
    expect(screen.getAllByRole('button', { name: /admin/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Rendre admin' })).toBeInTheDocument();
  });

  it('shows the error when the role change fails', async () => {
    mocked.patch.mockRejectedValue({ response: { data: { detail: 'Action interdite' } } });
    render(<UsersPanel users={users} meId={1} onChanged={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rendre admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Action interdite');
  });
});

describe('ListsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.get.mockResolvedValue({
      status: 200,
      data: [{ slug: 'lea', label: 'Léa', owner_id: 2, owner_name: 'Léa', is_common: false, enabled: true }],
    });
  });

  it('lists the gift lists with their owner', async () => {
    render(<ListsPanel users={users} />);
    expect(await screen.findByText('Léa', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Liste Léa visible' })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the API message when creating a list fails', async () => {
    mocked.post.mockRejectedValue({ response: { data: { detail: 'Ce nom existe déjà' } } });
    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });

    await userEvent.type(screen.getByLabelText('Nom de la liste'), 'Léa');
    await userEvent.click(screen.getByRole('button', { name: 'Créer la liste' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ce nom existe déjà');
  });
});
