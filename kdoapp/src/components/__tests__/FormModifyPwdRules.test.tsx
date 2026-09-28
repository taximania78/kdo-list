import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModifyPwd from '@/components/FormModifyPwd';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}));

describe('FormModifyPwd live password rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('updates the live rules list while typing the new password', async () => {
    render(<FormModifyPwd firstConnection={true} />);

    const newPwd = screen.getByPlaceholderText('Entrer votre nouveau mot de passe');

    // Before typing, the special-character rule is not met.
    const specialCharItem = screen.getByText('Un caractère spécial').closest('li')!;
    expect(specialCharItem).toHaveAttribute('data-met', 'false');

    await userEvent.type(newPwd, 'Abcdefg1!');

    expect(specialCharItem).toHaveAttribute('data-met', 'true');
  });
});
