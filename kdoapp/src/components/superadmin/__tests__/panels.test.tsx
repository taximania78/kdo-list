import { act, render, screen, waitFor, within } from '@testing-library/react';
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
  beforeEach(() => jest.resetAllMocks());

  it('deletes a person after confirmation', async () => {
    mocked.delete.mockResolvedValue({ status: 200, data: {} });
    const onChanged = jest.fn();
    render(<UsersPanel users={users} meId={1} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(screen.getByRole('button', { name: /Oui, supprimer/ })).toHaveClass('bg-primary');
    await userEvent.click(screen.getByRole('button', { name: /Oui, supprimer/ }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(mocked.delete).toHaveBeenCalledWith(expect.stringMatching(/\/api\/delete-user\/2$/));
  });

  it('cannot delete my own account, but can delete the others', () => {
    render(<UsersPanel users={users} meId={1} onChanged={jest.fn()} />);
    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
    expect(within(rows[1]).getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
  });

  it('gives the text actions a 44px tall hit area', () => {
    render(<UsersPanel users={users} meId={1} onChanged={jest.fn()} />);
    for (const name of ['Rendre admin', 'Supprimer']) {
      expect(screen.getByRole('button', { name })).toHaveClass('tap-y');
    }
    for (const link of screen.getAllByRole('link', { name: 'Mot de passe' })) expect(link).toHaveClass('tap-y');
  });

  it('rounds the text actions for a rounded focus ring', () => {
    render(<UsersPanel users={users} meId={1} onChanged={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Rendre admin' })).toHaveClass('rounded-md');
    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass('rounded-md');
    for (const link of screen.getAllByRole('link', { name: 'Mot de passe' })) expect(link).toHaveClass('rounded-md');
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

  it('disables the role button and sends a single request on a double click', async () => {
    let resolvePatch: (value: unknown) => void = () => {};
    mocked.patch.mockReturnValue(
      new Promise((resolve) => {
        resolvePatch = resolve;
      })
    );
    const onChanged = jest.fn();
    render(<UsersPanel users={users} meId={1} onChanged={onChanged} />);
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: 'Rendre admin' });
    await user.dblClick(button);

    expect(mocked.patch).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();

    await act(async () => {
      resolvePatch({ status: 200, data: {} });
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });

  it('toggles two different users concurrently, each button disabled independently', async () => {
    const twoToggleable = [
      { id: 2, name: 'Léa', isAdmin: false, isMegaAdmin: false },
      { id: 3, name: 'Théo', isAdmin: false, isMegaAdmin: false },
    ];
    let resolveA: (value: unknown) => void = () => {};
    let resolveB: (value: unknown) => void = () => {};
    mocked.patch
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveA = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveB = resolve;
          })
      );

    render(<UsersPanel users={twoToggleable} meId={1} onChanged={jest.fn()} />);
    const [buttonA, buttonB] = screen.getAllByRole('button', { name: 'Rendre admin' });

    await userEvent.click(buttonA);
    await userEvent.click(buttonB);

    expect(mocked.patch).toHaveBeenCalledTimes(2);
    expect(mocked.patch).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/api\/users\/2\/role$/), { isAdmin: true });
    expect(mocked.patch).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/api\/users\/3\/role$/), { isAdmin: true });
    expect(buttonA).toBeDisabled();
    expect(buttonB).toBeDisabled();

    await act(async () => {
      resolveA({ status: 200, data: {} });
    });
    await waitFor(() => expect(buttonA).not.toBeDisabled());
    expect(buttonB).toBeDisabled();

    await act(async () => {
      resolveB({ status: 200, data: {} });
    });
    await waitFor(() => expect(buttonB).not.toBeDisabled());
  });
});

describe('ListsPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mocked.get.mockResolvedValue({
      status: 200,
      data: [{ slug: 'lea', label: 'Léa', owner_id: 2, owner_name: 'Léa', is_common: false, enabled: true }],
    });
  });

  it('keeps the primary confirm button to delete a list', async () => {
    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(screen.getByRole('button', { name: /Oui, supprimer/ })).toHaveClass('bg-primary');
  });

  it('gives the visibility switch and the text actions a 44px tall hit area', async () => {
    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });
    expect(screen.getByRole('switch', { name: 'Liste Léa visible' })).toHaveClass('h-11');
    expect(screen.getByRole('button', { name: 'Modifier' })).toHaveClass('tap-y');
    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass('tap-y');
  });

  it('rounds the list text actions for a rounded focus ring', async () => {
    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });
    expect(screen.getByRole('button', { name: 'Modifier' })).toHaveClass('rounded-md');
    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass('rounded-md');
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

  it('ignores a close request while saving, and shows the error once the save fails', async () => {
    let rejectPatch: (error: unknown) => void = () => {};
    mocked.patch.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectPatch = reject;
      })
    );
    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mocked.patch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: 'Modifier la liste' })).toBeInTheDocument();

    await act(async () => {
      rejectPatch({ response: { data: { detail: 'Échec réseau' } } });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Échec réseau');
    expect(screen.getByRole('heading', { name: 'Modifier la liste' })).toBeInTheDocument();
  });

  it('keeps each toggle disabled independently while its own request is in flight', async () => {
    mocked.get.mockResolvedValue({
      status: 200,
      data: [
        { slug: 'lea', label: 'Léa', owner_id: 2, owner_name: 'Léa', is_common: false, enabled: true },
        { slug: 'theo', label: 'Théo', owner_id: 3, owner_name: 'Théo', is_common: false, enabled: true },
      ],
    });
    let resolveA: (value: unknown) => void = () => {};
    let resolveB: (value: unknown) => void = () => {};
    mocked.patch
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveA = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveB = resolve;
          })
      );

    render(<ListsPanel users={users} />);
    await screen.findByText('Léa', { selector: 'p' });

    const switchA = screen.getByRole('switch', { name: 'Liste Léa visible' });
    const switchB = screen.getByRole('switch', { name: 'Liste Théo visible' });

    await userEvent.click(switchA);
    await userEvent.click(switchB);

    expect(switchA).toBeDisabled();
    expect(switchB).toBeDisabled();

    await act(async () => {
      resolveA({ status: 200, data: {} });
    });
    await waitFor(() => expect(switchA).not.toBeDisabled());
    expect(switchB).toBeDisabled();

    await act(async () => {
      resolveB({ status: 200, data: {} });
    });
    await waitFor(() => expect(switchB).not.toBeDisabled());
  });
});
