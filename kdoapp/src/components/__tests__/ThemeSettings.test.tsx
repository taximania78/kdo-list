import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSettings from '@/components/ThemeSettings';
import api from '@/lib/api';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

const put = api.put as jest.Mock;

describe('ThemeSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks the active theme and marks it as active', () => {
    render(<ThemeSettings />);
    expect(screen.getByRole('radio', { name: /Anniversaire/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Noël/ })).not.toBeChecked();
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('disables the apply button while nothing changed', () => {
    render(<ThemeSettings />);
    expect(screen.getByRole('button', { name: /Appliquer/ })).toBeDisabled();
  });

  it('saves the selected theme then refreshes the page', async () => {
    put.mockResolvedValue({ status: 200, data: { theme: 'christmas' } });
    render(<ThemeSettings />);

    await userEvent.click(screen.getByRole('radio', { name: /Noël/ }));
    await userEvent.click(screen.getByRole('button', { name: /Appliquer/ }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/\/api\/settings\/theme$/), { theme: 'christmas' });
    expect(screen.getByText(/Thème mis à jour/)).toBeInTheDocument();
  });

  it('sends a single request on double click', async () => {
    let resolvePut: (v: unknown) => void = () => {};
    put.mockReturnValue(new Promise((r) => { resolvePut = r; }));
    render(<ThemeSettings />);

    await userEvent.click(screen.getByRole('radio', { name: /Noël/ }));
    const button = screen.getByRole('button', { name: /Appliquer/ });
    await userEvent.click(button);
    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(put).toHaveBeenCalledTimes(1);
    resolvePut({ status: 200, data: { theme: 'christmas' } });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it('shows an error and does not refresh when the API fails', async () => {
    put.mockRejectedValue(new Error('boom'));
    render(<ThemeSettings />);

    await userEvent.click(screen.getByRole('radio', { name: /Noël/ }));
    await userEvent.click(screen.getByRole('button', { name: /Appliquer/ }));

    await waitFor(() => expect(screen.getByText(/Erreur/)).toBeInTheDocument());
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: /Noël/ })).toBeChecked();
  });
});
