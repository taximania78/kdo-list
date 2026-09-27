import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';

function setup(onConfirm: () => Promise<void>) {
  const onOpenChange = jest.fn();
  render(
    <ConfirmSheet
      open
      onOpenChange={onOpenChange}
      title="Tu t'en occupes ?"
      confirmLabel="Oui, je l'emballe"
      onConfirm={onConfirm}
    >
      <p>Casque audio</p>
    </ConfirmSheet>
  );
  return { onOpenChange };
}

describe('ConfirmSheet', () => {
  it('shows the title, the body and both actions', () => {
    setup(jest.fn().mockResolvedValue(undefined));
    expect(screen.getByRole('heading', { name: "Tu t'en occupes ?" })).toBeInTheDocument();
    expect(screen.getByText('Casque audio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oui, je l'emballe/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('confirms only once on a double tap, then closes', async () => {
    let resolve: () => void = () => {};
    const onConfirm = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { onOpenChange } = setup(onConfirm);

    await userEvent.dblClick(screen.getByRole('button', { name: /Oui, je l'emballe/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => resolve());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('stays open and shows the API message when the action fails', async () => {
    const onConfirm = jest.fn().mockRejectedValue({
      response: { data: { detail: "Cette idée vient d'être réservée." } },
    });
    const { onOpenChange } = setup(onConfirm);

    await userEvent.click(screen.getByRole('button', { name: /Oui, je l'emballe/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Cette idée vient d'être réservée.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('closes on cancel', async () => {
    const { onOpenChange } = setup(jest.fn().mockResolvedValue(undefined));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ignores Escape while a confirm is pending, then closes once it resolves', async () => {
    let resolve: () => void = () => {};
    const onConfirm = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { onOpenChange } = setup(onConfirm);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Oui, je l'emballe/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    await act(async () => resolve());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('still shows the error and stays open after a pending confirm rejects, even if Escape was pressed while pending', async () => {
    let reject: (error: unknown) => void = () => {};
    const onConfirm = jest.fn(() => new Promise<void>((_resolve, r) => { reject = r; }));
    const { onOpenChange } = setup(onConfirm);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Oui, je l'emballe/ }));
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    await act(async () => reject({
      response: { data: { detail: "Cette idée vient d'être réservée." } },
    }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Cette idée vient d'être réservée.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
