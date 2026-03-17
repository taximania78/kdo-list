import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModifyPwd from '@/components/FormModifyPwd';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}));

describe('FormModifyPwd Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders correctly for first connection (no currentPassword field)', () => {
    render(<FormModifyPwd firstConnection={true} />);
    
    expect(screen.queryByPlaceholderText('Entrer votre mot de passe actuel')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrer votre nouveau mot de passe')).toBeInTheDocument();
  });

  it('renders correctly for standard modify (includes currentPassword field)', () => {
    render(<FormModifyPwd firstConnection={false} />);
    
    expect(screen.getByPlaceholderText('Entrer votre mot de passe actuel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrer votre nouveau mot de passe')).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    render(<FormModifyPwd firstConnection={true} />);
    
    const newPwd = screen.getByPlaceholderText('Entrer votre nouveau mot de passe');
    const confirmPwd = screen.getByPlaceholderText('Confirmer votre mot de passe');
    
    await userEvent.type(newPwd, 'StrongPass1!');
    await userEvent.type(confirmPwd, 'StrongPassw!');
    
    // The mismatch error is generated via onChange manually, not via Zod on submit.
    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
    });
  });

  it('shows validation errors for weak passwords', async () => {
    render(<FormModifyPwd firstConnection={true} />);
    
    const newPwd = screen.getByPlaceholderText('Entrer votre nouveau mot de passe');
    await userEvent.type(newPwd, 'weak');
    
    const submitBtn = screen.getByRole('button', { name: /Modifier/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      const errors = screen.getAllByText('Le mot de passe doit contenir au moins 8 caractères.');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toBeInTheDocument();
    });
  });
});
