import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GiftImage } from '@/components/gift/GiftImage';
import { GiftTag } from '@/components/gift/GiftTag';
import type { Kdo } from '@/lib/gifts';

const velo: Kdo = {
  id: 7,
  name: 'Vélo de route',
  price: 120,
  user: 'Paul',
  url: 'https://example.com/velo',
  comment: 'Taille M',
  imageDisplay: 'unknown.jpg',
  availability: true,
  takenBy: null,
};

const noop = () => {};

describe('GiftTag', () => {
  it('offers « Je prends ! » on a free idea', async () => {
    const onTake = jest.fn();
    render(<GiftTag kdo={velo} state="free" canRelease={false} onTake={onTake} onRelease={noop} />);
    await userEvent.click(screen.getByRole('button', { name: /Je prends/ }));
    expect(onTake).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Déjà emballé')).toBeNull();
  });

  it('shows the price, the product link and the comment', () => {
    render(<GiftTag kdo={velo} state="free" canRelease={false} onTake={noop} onRelease={noop} />);
    expect(screen.getByText(/120,00\s€/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Voir le produit' });
    expect(link).toHaveAttribute('href', 'https://example.com/velo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Taille M')).toBeInTheDocument();
  });

  it('leaves no trace of a missing price or link', () => {
    render(
      <GiftTag kdo={{ ...velo, price: null, url: null }} state="free" canRelease={false} onTake={noop} onRelease={noop} />
    );
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('wraps my reservation and lets me untie it', async () => {
    const onRelease = jest.fn();
    const mine = { ...velo, availability: false, takenBy: 'marie' };
    render(<GiftTag kdo={mine} state="mine" canRelease={false} onTake={noop} onRelease={onRelease} />);
    expect(screen.getByText('À toi · chut !')).toBeInTheDocument();
    expect(screen.getByText(/c'est toi qui l'offres/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dénouer le ruban' }));
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('marks the wrap as untying while the ribbon comes off', () => {
    const mine = { ...velo, availability: false, takenBy: 'marie' };
    const { rerender } = render(
      <GiftTag kdo={mine} state="mine" canRelease={false} onTake={noop} onRelease={noop} />
    );
    expect(screen.getByLabelText('Vélo de route')).not.toHaveClass('is-untying');
    rerender(<GiftTag kdo={mine} state="mine" canRelease={false} untying onTake={noop} onRelease={noop} />);
    expect(screen.getByLabelText('Vélo de route')).toHaveClass('is-untying');
  });

  it("shows who wrapped someone else's reservation, without action", () => {
    const taken = { ...velo, availability: false, takenBy: 'Paul' };
    render(<GiftTag kdo={taken} state="taken" canRelease={false} onTake={noop} onRelease={noop} />);
    expect(screen.getByText('Emballé par Paul')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('lets an admin release a reservation', async () => {
    const onRelease = jest.fn();
    const taken = { ...velo, availability: false, takenBy: 'Paul' };
    render(<GiftTag kdo={taken} state="taken" canRelease onTake={noop} onRelease={onRelease} />);
    await userEvent.click(screen.getByRole('button', { name: 'Libérer la réservation' }));
    expect(onRelease).toHaveBeenCalledTimes(1);
  });
});

describe('GiftImage', () => {
  it('shows the gift name in big letters when there is no image', () => {
    render(<GiftImage imageDisplay="unknown.jpg" name="Casque audio" seed={1} sizes="100px" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Casque')).toBeInTheDocument();
  });

  it('shows the photo, and falls back to the name if it fails to load', () => {
    render(<GiftImage imageDisplay="12.jpg" name="Casque audio" seed={1} sizes="100px" />);
    const img = screen.getByRole('img', { name: 'Casque audio' });
    expect(img.getAttribute('src')).toContain('12.jpg');

    fireEvent.error(img);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Casque')).toBeInTheDocument();
  });
});
