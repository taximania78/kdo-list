import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonClass } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { PaperState } from '@/components/ui/PaperState';
import { PageTitle } from '@/components/ui/PageTitle';
import { PageShell } from '@/components/ui/PageShell';
import { BackLink } from '@/components/ui/BackLink';

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

  it('fires onClick for the outline variant', async () => {
    const onClick = jest.fn();
    render(
      <Button variant="outline" onClick={onClick}>
        Annuler
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick for the ghost variant', async () => {
    const onClick = jest.fn();
    render(
      <Button variant="ghost" onClick={onClick}>
        Fermer
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('buttonClass() returns a class string usable on a non-button element like a Link', () => {
    render(
      <a href="/liste" className={buttonClass('ghost')}>
        Voir la liste
      </a>
    );
    const link = screen.getByRole('link', { name: 'Voir la liste' });
    expect(link.className.length).toBeGreaterThan(0);
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

  it('renders the hint content', () => {
    render(
      <Field label="Prix" htmlFor="price" hint={<span>En euros</span>}>
        <Input id="price" />
      </Field>
    );
    expect(screen.getByText('En euros')).toBeInTheDocument();
  });

  it('still links the label to the control when tone is "paper"', () => {
    render(
      <Field label="Prix" htmlFor="price" tone="paper">
        <Input id="price" />
      </Field>
    );
    expect(screen.getByLabelText('Prix')).toBeInTheDocument();
  });
});

describe('Input', () => {
  it('exposes the underlying <input> element via ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Nom" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });
});

describe('Select', () => {
  it('is linked to its label via Field, renders its options and reports the chosen value', async () => {
    render(
      <Field label="Liste" htmlFor="list">
        <Select id="list" defaultValue="paul">
          <option value="paul">Liste de Paul</option>
          <option value="julie">Liste de Julie</option>
        </Select>
      </Field>
    );
    const select = screen.getByLabelText('Liste') as HTMLSelectElement;
    expect(screen.getByRole('option', { name: 'Liste de Julie' })).toBeInTheDocument();
    await userEvent.selectOptions(select, 'julie');
    expect(select.value).toBe('julie');
  });
});

describe('Select styling', () => {
  it("drops the native arrow for the app's chevron, decorative only", () => {
    render(
      <Field label="Liste" htmlFor="list">
        <Select id="list">
          <option value="paul">Liste de Paul</option>
        </Select>
      </Field>
    );
    const select = screen.getByLabelText('Liste');
    expect(select).toHaveClass('appearance-none', 'pr-10');
    const chevron = select.parentElement?.querySelector('svg');
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron).toHaveClass('pointer-events-none', 'text-ink-muted');
    expect(select.parentElement).toHaveClass('relative');
  });

  it('still hands its ref to the <select> (react-hook-form)', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select ref={ref} aria-label="Liste">
        <option value="paul">Liste de Paul</option>
      </Select>
    );
    expect(ref.current).toBe(screen.getByRole('combobox', { name: 'Liste' }));
  });
});

describe('Textarea', () => {
  it('is linked to its label via Field and accepts typed text', async () => {
    render(
      <Field label="Commentaire" htmlFor="comment">
        <Textarea id="comment" />
      </Field>
    );
    const textarea = screen.getByLabelText('Commentaire');
    await userEvent.type(textarea, 'Merci beaucoup');
    expect(textarea).toHaveValue('Merci beaucoup');
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

// Zones à toucher ≥ 44px (jsdom ne calcule pas la mise en page : on vérifie les classes
// qui la garantissent ; la mesure réelle se fait dans le navigateur à 390px).
describe('touch targets', () => {
  it('gives every button a 44px minimum height', () => {
    render(<Button>Je prends !</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-11');
    expect(buttonClass('ghost')).toContain('min-h-11');
  });

  it('gives the chip a 44px tall hit area, compensated so the pill keeps its place', () => {
    render(<Chip pressed={false} onClick={jest.fn()}>Libres</Chip>);
    expect(screen.getByRole('button', { name: /Libres/ })).toHaveClass('min-h-11', '-my-1.5');
  });

  it('gives the back link a 44px tall hit area', () => {
    render(<BackLink href="/admin">Retour aux idées</BackLink>);
    const link = screen.getByRole('link', { name: 'Retour aux idées' });
    expect(link).toHaveAttribute('href', '/admin');
    expect(link).toHaveClass('tap-y');
  });
});

describe('rounded focus rings', () => {
  it('rounds the back link so its focus ring follows a rounded outline', () => {
    render(<BackLink href="/list">Toutes les listes</BackLink>);
    expect(screen.getByRole('link', { name: 'Toutes les listes' })).toHaveClass('rounded-md');
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

describe('PageShell', () => {
  it('renders its children', () => {
    render(
      <PageShell>
        <p>Contenu de la page</p>
      </PageShell>
    );
    expect(screen.getByText('Contenu de la page')).toBeInTheDocument();
  });
});
