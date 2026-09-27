import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModifyItem from '@/components/FormModifyItem';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), delete: jest.fn() },
}));

const put = api.put as jest.Mock;

const listOptions = [{ value: 'paul', label: 'Liste de Paul', user: 'Paul' }];
const kdo = { id: 3, name: 'Vélo', price: 120, user: 'Paul', url: null, comment: '', image: '' };

describe('FormModifyItem while saving', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignores Escape while the save is pending, then shows the error once it fails', async () => {
    let reject: (error: unknown) => void = () => {};
    put.mockReturnValue(new Promise((_resolve, r) => { reject = r; }));

    const user = userEvent.setup();
    render(<FormModifyItem kdo={kdo} id={3} listOptions={listOptions} />);

    await user.click(screen.getByRole('button', { name: /Modifier/ }));
    expect(screen.getByRole('heading', { name: 'Modifier : Vélo' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Enregistrer/ }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));

    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: 'Modifier : Vélo' })).toBeInTheDocument();

    await act(async () => reject(new Error('boom')));

    expect(await screen.findByRole('alert')).toHaveTextContent("L'idée n'a pas pu être enregistrée.");
    expect(screen.getByRole('heading', { name: 'Modifier : Vélo' })).toBeInTheDocument();
  });
});
