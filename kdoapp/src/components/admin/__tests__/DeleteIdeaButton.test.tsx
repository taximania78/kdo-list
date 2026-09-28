import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteIdeaButton } from '@/components/admin/DeleteIdeaButton';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { delete: jest.fn() } }));

const del = api.delete as jest.Mock;

describe('DeleteIdeaButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for confirmation, deletes, then reports it', async () => {
    del.mockResolvedValue({ status: 200, data: { success: true } });
    const onDeleted = jest.fn();
    render(<DeleteIdeaButton id={5} name="Vélo" onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(screen.getByRole('heading', { name: "Supprimer l'idée ?" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oui, supprimer/ })).toHaveClass('bg-primary');
    await userEvent.click(screen.getByRole('button', { name: /Oui, supprimer/ }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith(expect.stringMatching(/\/api\/delete-item\/5\/$/));
  });

  it('gives its text trigger a 44px tall hit area', () => {
    render(<DeleteIdeaButton id={5} name="Vélo" onDeleted={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass('tap-y');
  });

  it('rounds its text trigger for a rounded focus ring', () => {
    render(<DeleteIdeaButton id={5} name="Vélo" onDeleted={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass('rounded-md');
  });

  it('does nothing without confirmation', async () => {
    render(<DeleteIdeaButton id={5} name="Vélo" onDeleted={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(del).not.toHaveBeenCalled();
  });
});
