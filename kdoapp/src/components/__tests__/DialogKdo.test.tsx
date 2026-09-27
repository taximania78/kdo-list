import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DialogKdo from '@/components/DialogKdo';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const post = api.post as jest.Mock;

const takenByPaul = {
  id: 7,
  name: 'Vélo',
  comment: '',
  availability: false,
  takenBy: 'Paul',
};

describe('DialogKdo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables the button on someone else's reservation for a regular user", () => {
    render(<DialogKdo {...takenByPaul} userLogged="Marie" />);
    expect(screen.getByRole('button', { name: /Pris par Paul/ })).toBeDisabled();
  });

  it('lets the taker release their own reservation', () => {
    render(<DialogKdo {...takenByPaul} userLogged="Paul" />);
    expect(screen.getByRole('button', { name: /Je ne souhaite plus prendre/ })).toBeEnabled();
  });

  it("lets an admin release someone else's reservation", async () => {
    post.mockResolvedValue({ status: 200, data: { success: true } });
    const onValidation = jest.fn();
    render(<DialogKdo {...takenByPaul} userLogged="Julie" canReleaseOthers onValidation={onValidation} />);

    await userEvent.click(screen.getByRole('button', { name: /Libérer la réservation de Paul/ }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, libérer/ }));

    await waitFor(() => expect(onValidation).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/untake-api\/7$/));
  });
});
