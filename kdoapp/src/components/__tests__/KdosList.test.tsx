import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KdosList from '@/components/KdosList';
import api from '@/lib/api';
import { getUserInfo } from '@/lib/auth';

type GetResult = { status: number; data: object[] };

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@/lib/auth', () => ({ getUserInfo: jest.fn() }));

const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

const baseKdo = {
  id: 1,
  name: 'Vélo',
  price: null,
  user: 'Paul',
  url: null,
  comment: '',
  imageDisplay: 'unknown.jpg',
  availability: true,
  takenBy: null,
};

const listOf = (...kdos: object[]) => get.mockResolvedValue({ status: 200, data: kdos });

describe('KdosList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'marie', isAdmin: false, isMegaAdmin: false });
  });

  it('shows the price and the product link when they are set', async () => {
    listOf({ ...baseKdo, price: 120, url: 'https://example.com/velo' });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText(/120,00\s€/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir le produit' })).toHaveAttribute('href', 'https://example.com/velo');
  });

  it('hides the price and the product link when they are empty', async () => {
    listOf(baseKdo);
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Voir le produit' })).toBeNull();
  });

  it('reserves a free idea, then reloads the list', async () => {
    listOf(baseKdo);
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    expect(screen.getByRole('heading', { name: 'Tu prends ce cadeau ?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oui, je le prends/ })).toHaveClass('bg-primary');
    await userEvent.click(screen.getByRole('button', { name: /Oui, je le prends/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/take-api\/1$/)));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('reassures with a handwritten note that says what the person will not know', async () => {
    listOf(baseKdo);
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    expect(screen.getByText('la personne ne saura pas ce que tu lui offres.')).toBeInTheDocument();
  });

  it("shows the idea's comment in the take sheet when there is one", async () => {
    listOf({ ...baseKdo, comment: 'Taille M, bleu marine' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    const comment = within(screen.getByRole('dialog')).getByText('Taille M, bleu marine');
    expect(comment).toBeInTheDocument();
    // Lisible : couleur d'encre, 15px, sous un fin séparateur, avec une icône décorative.
    expect(comment).toHaveClass('text-ink', 'text-[15px]');
    expect(comment).not.toHaveClass('text-ink-muted');
    const block = comment.closest('.border-t');
    expect(block).toHaveClass('border-line');
    expect(block?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows no comment in the take sheet when the idea has none', async () => {
    listOf({ ...baseKdo, comment: null });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText('Taille M', { exact: false })).toBeNull();
    expect(dialog.querySelector('.text-ink-muted')).toBeNull();
  });

  it('keeps the sheet open with the API message when someone was faster', async () => {
    listOf(baseKdo);
    post.mockRejectedValue({ response: { status: 409, data: { detail: "Cette idée vient d'être réservée." } } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, je le prends/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Cette idée vient d'être réservée.");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('lets me untie my own reservation', async () => {
    listOf({ ...baseKdo, availability: false, takenBy: 'marie' });
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Je ne prends plus' }));
    expect(screen.getByRole('heading', { name: 'Tu ne prends plus ce cadeau ?' })).toBeInTheDocument();
    expect(screen.getByText(/redeviendra disponible pour les autres/)).toBeInTheDocument();
    const untake = screen.getByRole('button', { name: /Oui, je ne le prends plus/ });
    expect(untake).not.toHaveClass('bg-primary');
    expect(untake).toHaveClass('text-primary', 'ring-primary');
    await userEvent.click(screen.getByRole('button', { name: /Oui, je ne le prends plus/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/untake-api\/1$/)));
  });

  it("does not let a family member release someone else's reservation", async () => {
    listOf({ ...baseKdo, id: 7, availability: false, takenBy: 'Paul' });
    render(<KdosList listSlug="paul" />);

    expect(await screen.findByText('Pris par Paul')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Libérer/ })).toBeNull();
  });

  it("lets an admin release someone else's reservation", async () => {
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'julie', isAdmin: true, isMegaAdmin: false });
    listOf({ ...baseKdo, id: 7, availability: false, takenBy: 'Paul' });
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Libérer la réservation' }));
    expect(screen.getByRole('heading', { name: 'Libérer la réservation ?' })).toBeInTheDocument();
    expect(screen.getByText(/est pris par Paul\. Il redeviendra disponible pour tout le monde\./)).toBeInTheDocument();
    const release = screen.getByRole('button', { name: /Oui, libérer/ });
    expect(release).not.toHaveClass('bg-primary');
    expect(release).toHaveClass('text-primary', 'ring-primary');
    await userEvent.click(screen.getByRole('button', { name: /Oui, libérer/ }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/untake-api\/7$/)));
  });

  it('shows the same idea summary (image, name, price) in the untake sheet', async () => {
    listOf({ ...baseKdo, price: 42, imageDisplay: 'velo.jpg', availability: false, takenBy: 'marie' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Je ne prends plus' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Vélo' })).toBeInTheDocument();
    expect(within(dialog).getByText('Vélo', { selector: 'p' })).toBeInTheDocument();
    expect(within(dialog).getByText(/42,00\s€/)).toBeInTheDocument();
    expect(within(dialog).getByText(/redeviendra disponible pour les autres/)).toBeInTheDocument();
  });

  it('shows the same idea summary (image, name, price) in the admin release sheet', async () => {
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'julie', isAdmin: true, isMegaAdmin: false });
    listOf({ ...baseKdo, id: 7, price: 42, imageDisplay: 'velo.jpg', availability: false, takenBy: 'Paul' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Libérer la réservation' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Vélo' })).toBeInTheDocument();
    expect(within(dialog).getByText('Vélo', { selector: 'p' })).toBeInTheDocument();
    expect(within(dialog).getByText(/42,00\s€/)).toBeInTheDocument();
    expect(within(dialog).getByText(/est pris par Paul\. Il redeviendra disponible pour tout le monde\./)).toBeInTheDocument();
  });

  it('keeps the take sheet preview in color (the idea is still free)', async () => {
    listOf({ ...baseKdo, imageDisplay: 'velo.jpg' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Vélo' }).parentElement).not.toHaveClass('is-wrapped');
  });

  it('greys the preview in the untake sheet (the idea is taken, by me)', async () => {
    listOf({ ...baseKdo, imageDisplay: 'velo.jpg', availability: false, takenBy: 'marie' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Je ne prends plus' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Vélo' }).parentElement).toHaveClass('is-wrapped');
  });

  it('greys the preview in the admin release sheet (the idea is taken, by someone else)', async () => {
    (getUserInfo as jest.Mock).mockReturnValue({ username: 'julie', isAdmin: true, isMegaAdmin: false });
    listOf({ ...baseKdo, id: 7, imageDisplay: 'velo.jpg', availability: false, takenBy: 'Paul' });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Libérer la réservation' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img', { name: 'Vélo' }).parentElement).toHaveClass('is-wrapped');
  });

  it('spaces wrapped filter rows so their 44px touch zones never overlap', async () => {
    listOf(baseKdo);
    render(<KdosList listSlug="paul" />);
    const group = await screen.findByRole('group', { name: 'Filtrer les idées' });
    // Pastille visible 32px, zone de 44px (−6px de chaque côté) : il faut au moins 12px entre deux lignes.
    expect(group).toHaveClass('flex-wrap', 'gap-x-2', 'gap-y-3');
  });

  it('filters the free ideas and mine', async () => {
    listOf(
      baseKdo,
      { ...baseKdo, id: 2, name: 'Pull', availability: false, takenBy: 'Paul' },
      { ...baseKdo, id: 3, name: 'Livre', availability: false, takenBy: 'marie' }
    );
    render(<KdosList listSlug="paul" />);
    await screen.findByRole('heading', { name: 'Pull' });

    await userEvent.click(screen.getByRole('button', { name: /Disponibles/ }));
    expect(screen.getByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pull' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Pris par moi/ }));
    expect(screen.getByRole('heading', { name: 'Livre' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vélo' })).toBeNull();
  });

  it('says so when the list cannot be loaded', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    get.mockRejectedValue(new Error('Network Error'));
    render(<KdosList listSlug="paul" />);
    expect(await screen.findByRole('alert')).toHaveTextContent("La liste n'a pas pu être chargée.");
    expect(consoleError).toHaveBeenCalledWith('Failed to fetch kdos:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('gives the tying animation its full 1.4s only once the reload actually shows the wrapped card', async () => {
    jest.useFakeTimers();
    try {
      get.mockResolvedValueOnce({ status: 200, data: [baseKdo] });
      post.mockResolvedValue({ status: 200, data: { success: true } });
      // La recharge (2e appel GET) prend 800 ms, simulée par un vrai minuteur : elle ne
      // doit démarrer le nœud qu'à son terme, pas au moment où le POST se résout.
      get.mockImplementationOnce(
        () =>
          new Promise<GetResult>((resolve) => {
            setTimeout(
              () => resolve({ status: 200, data: [{ ...baseKdo, availability: false, takenBy: 'marie' }] }),
              800
            );
          })
      );

      render(<KdosList listSlug="paul" />);
      fireEvent.click(await screen.findByRole('button', { name: /Je prends/ }));
      fireEvent.click(screen.getByRole('button', { name: /Oui, je le prends/ }));

      // Laisse le POST se résoudre et l'appel de recharge démarrer, sans avancer le
      // minuteur de 800 ms de la recharge elle-même.
      await act(async () => {});

      const tag = screen.getByLabelText('Vélo');
      expect(tag).toHaveAttribute('data-state', 'free'); // la recharge n'est pas terminée
      expect(tag).not.toHaveClass('is-tying'); // et le nœud n'a donc pas encore démarré

      await act(async () => {
        jest.advanceTimersByTime(800); // la recharge se termine
      });
      expect(tag).toHaveAttribute('data-state', 'mine');
      expect(tag).toHaveClass('is-tying');

      // 1400 ms après la confirmation (donc 600 ms après la fin de la recharge) : le nœud
      // doit encore jouer, car son minuteur de 1,4 s n'a démarré qu'une fois la carte
      // réservée affichée, pas au moment du clic.
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(tag).toHaveClass('is-tying');

      // 1400 ms après la fin de la recharge : le nœud s'arrête.
      await act(async () => {
        jest.advanceTimersByTime(800);
      });
      expect(tag).not.toHaveClass('is-tying');
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps the freshly wrapped gift visible by switching back to "Tout" when "Disponibles" was active', async () => {
    get
      .mockResolvedValueOnce({ status: 200, data: [baseKdo] })
      .mockResolvedValueOnce({ status: 200, data: [{ ...baseKdo, availability: false, takenBy: 'marie' }] });
    post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<KdosList listSlug="paul" />);

    await userEvent.click(await screen.findByRole('button', { name: /Disponibles/ }));
    await userEvent.click(screen.getByRole('button', { name: /Je prends/ }));
    await userEvent.click(screen.getByRole('button', { name: /Oui, je le prends/ }));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
  });

  it('ignores a stale response when the list slug changes before the first request resolves', async () => {
    let resolveFirst: (value: GetResult) => void = () => {};
    let resolveSecond: (value: GetResult) => void = () => {};
    get
      .mockImplementationOnce(() => new Promise<GetResult>((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise<GetResult>((resolve) => { resolveSecond = resolve; }));

    const { rerender } = render(<KdosList listSlug="paul" />);
    rerender(<KdosList listSlug="julie" />);

    // La 2e requête (julie, la bonne) se résout la première.
    await act(async () => {
      resolveSecond({ status: 200, data: [{ ...baseKdo, id: 2, name: 'Pull' }] });
    });
    expect(await screen.findByRole('heading', { name: 'Pull' })).toBeInTheDocument();

    // La 1re requête (paul, périmée) se résout ensuite : elle ne doit pas écraser l'affichage.
    await act(async () => {
      resolveFirst({ status: 200, data: [{ ...baseKdo, id: 1, name: 'Vélo' }] });
    });
    expect(screen.getByRole('heading', { name: 'Pull' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vélo' })).toBeNull();
  });

  it('plays the untie animation (350 ms) before reloading, once the release succeeded', async () => {
    jest.useFakeTimers();
    try {
      get
        .mockResolvedValueOnce({ status: 200, data: [{ ...baseKdo, availability: false, takenBy: 'marie' }] })
        .mockResolvedValueOnce({ status: 200, data: [baseKdo] });
      post.mockResolvedValue({ status: 200, data: { success: true } });
      render(<KdosList listSlug="paul" />);
      fireEvent.click(await screen.findByRole('button', { name: 'Je ne prends plus' }));
      fireEvent.click(screen.getByRole('button', { name: /Oui, je ne le prends plus/ }));
      await act(async () => {}); // le POST se résout

      const tag = screen.getByLabelText('Vélo');
      expect(tag).toHaveClass('is-untying');
      expect(tag).toHaveAttribute('data-state', 'mine'); // le ruban est encore là pendant qu'il se dénoue
      expect(get).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(349);
      });
      expect(get).toHaveBeenCalledTimes(1); // pas de recharge avant la fin de l'animation

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(get).toHaveBeenCalledTimes(2);
      expect(tag).toHaveAttribute('data-state', 'free');
      expect(tag).not.toHaveClass('is-untying');
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps the released gift visible by switching back to "Tout" when "Pris par moi" was active', async () => {
    jest.useFakeTimers();
    try {
      get
        .mockResolvedValueOnce({ status: 200, data: [{ ...baseKdo, availability: false, takenBy: 'marie' }] })
        .mockResolvedValueOnce({ status: 200, data: [baseKdo] });
      post.mockResolvedValue({ status: 200, data: { success: true } });
      render(<KdosList listSlug="paul" />);
      fireEvent.click(await screen.findByRole('button', { name: /Pris par moi/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Je ne prends plus' }));
      fireEvent.click(screen.getByRole('button', { name: /Oui, je ne le prends plus/ }));
      await act(async () => {});

      expect(screen.getByLabelText('Vélo')).toHaveClass('is-untying');
      await act(async () => {
        jest.advanceTimersByTime(350);
      });
      expect(get).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('heading', { name: 'Vélo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tout/ })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      jest.useRealTimers();
    }
  });

  it("names the list owner when there is no idea yet", async () => {
    listOf();
    render(<KdosList listSlug="lea" listLabel="Léa" />);
    expect(await screen.findByText("Aucune idée pour Léa pour l'instant.")).toBeInTheDocument();
  });

  it('falls back to a generic sentence when the owner is unknown', async () => {
    listOf();
    render(<KdosList listSlug="lea" />);
    expect(await screen.findByText("Aucune idée pour l'instant.")).toBeInTheDocument();
  });
});
