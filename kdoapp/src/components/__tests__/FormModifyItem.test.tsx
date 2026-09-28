import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModifyItem from '@/components/FormModifyItem';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), delete: jest.fn() },
}));

const put = api.put as jest.Mock;

const listOptions = [{ value: 'paul', label: 'Liste de Paul', user: 'Paul' }];

describe('FormModifyItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gives its « Modifier » trigger a 44px tall hit area', () => {
    const kdo = { id: 3, name: 'Vélo', price: 120, user: 'Paul', url: null, comment: '', image: '' };
    render(<FormModifyItem kdo={kdo} id={3} listOptions={listOptions} />);
    expect(screen.getByRole('button', { name: 'Modifier' })).toHaveClass('tap-y');
  });

  it('sends null when the URL and price are cleared', async () => {
    put.mockResolvedValue({ status: 200, data: { success: true } });
    const kdo = { id: 3, name: 'Vélo', price: 120, user: 'Paul', url: 'https://example.com/velo', comment: '', image: '' };
    render(<FormModifyItem kdo={kdo} id={3} listOptions={listOptions} />);

    await userEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    await userEvent.clear(screen.getByLabelText(/^URL( \(facultatif\))?$/));
    await userEvent.clear(screen.getByLabelText(/^Prix( \(facultatif\))?$/));
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ id: 3, name: 'Vélo', price: null, url: null });
  });

  it('opens on an idea saved without price or URL', async () => {
    put.mockResolvedValue({ status: 200, data: { success: true } });
    const kdo = { id: 4, name: 'Livre', price: null, user: 'Paul', url: null, comment: null, image: null };
    render(<FormModifyItem kdo={kdo} id={4} listOptions={listOptions} />);

    await userEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ id: 4, name: 'Livre', price: null, url: null });
  });
});
