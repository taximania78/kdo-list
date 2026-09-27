import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { PaperState } from '@/components/ui/PaperState';
import { PageTitle } from '@/components/ui/PageTitle';

describe('Button', () => {
  it('is a plain button by default and fires onClick', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Je prends !</Button>);
    const button = screen.getByRole('button', { name: 'Je prends !' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while pending', () => {
    render(<Button pending>Envoyer</Button>);
    const button = screen.getByRole('button', { name: 'Envoyer' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Field', () => {
  it('links the label to the control and shows the error', () => {
    render(
      <Field label="Nom" htmlFor="name" error="Le nom est obligatoire.">
        <Input id="name" />
      </Field>
    );
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Le nom est obligatoire.');
  });

  it('shows no alert without error', () => {
    render(
      <Field label="Nom" htmlFor="name">
        <Input id="name" />
      </Field>
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Chip', () => {
  it('exposes its pressed state and count', async () => {
    const onClick = jest.fn();
    render(<Chip pressed={false} count={5} onClick={onClick}>Libres</Chip>);
    const chip = screen.getByRole('button', { name: /Libres/ });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toHaveTextContent('5');
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('PaperState', () => {
  it('announces errors as alerts and the rest as status', () => {
    const { rerender } = render(<PaperState kind="error">Échec</PaperState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Échec');
    rerender(<PaperState kind="loading">Chargement…</PaperState>);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
  });
});

describe('PageTitle', () => {
  it('renders a level-1 heading and the handwritten line', () => {
    render(<PageTitle hand="personne ne saura qui offre quoi">À qui fait-on plaisir ?</PageTitle>);
    expect(screen.getByRole('heading', { level: 1, name: 'À qui fait-on plaisir ?' })).toBeInTheDocument();
    expect(screen.getByText('personne ne saura qui offre quoi')).toBeInTheDocument();
  });
});
