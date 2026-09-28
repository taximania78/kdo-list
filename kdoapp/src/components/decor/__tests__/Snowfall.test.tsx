import { render, screen } from '@testing-library/react';
import Snowfall from '@/components/decor/Snowfall';

let mockPathname = '/list';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));

function fakeContext() {
  return {
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    createRadialGradient: () => ({ addColorStop: jest.fn() }),
    globalAlpha: 1,
    fillStyle: '',
  };
}

describe('Snowfall', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders two decorative canvases without crashing when canvas is unavailable', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<Snowfall />);
    expect(screen.getByTestId('snow-back')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('snow-front')).toHaveAttribute('aria-hidden', 'true');
  });

  // Un contexte factice par canvas : on sait ainsi sur quelle couche chaque flocon est dessiné.
  function renderOneFrame() {
    const contexts = new Map<string, ReturnType<typeof fakeContext>>();
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      const key = this.dataset.testid ?? 'sprite';
      if (!contexts.has(key)) contexts.set(key, fakeContext());
      return contexts.get(key) as unknown as CanvasRenderingContext2D;
    } as unknown as typeof HTMLCanvasElement.prototype.getContext);
    let frames = 0;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames += 1;
      if (frames === 1) cb(16);
      return frames;
    });
    render(<Snowfall />);
    return { back: contexts.get('snow-back')!, front: contexts.get('snow-front')! };
  }

  it.each(['/list', '/list/lea'])('puts the 20 big flakes in front of the content on a list page (%s)', (path) => {
    mockPathname = path;
    const { back, front } = renderOneFrame();
    expect(back.drawImage).toHaveBeenCalledTimes(230);
    expect(front.drawImage).toHaveBeenCalledTimes(20);
  });

  it.each(['/', '/first-connection', '/admin', '/admin/add', '/admin/superadmin', '/admin/change-password'])(
    'draws all 250 flakes behind the content elsewhere (%s)',
    (path) => {
      mockPathname = path;
      const { back, front } = renderOneFrame();
      expect(back.drawImage).toHaveBeenCalledTimes(250);
      expect(front.drawImage).not.toHaveBeenCalled();
    }
  );

  it('does not mistake a path that merely starts with "list" for a list page', () => {
    mockPathname = '/listing';
    const { back, front } = renderOneFrame();
    expect(back.drawImage).toHaveBeenCalledTimes(250);
    expect(front.drawImage).not.toHaveBeenCalled();
  });

  it('draws the 250 flakes on each frame', () => {
    const ctx = fakeContext();
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    let frames = 0;
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames += 1;
      if (frames === 1) cb(16); // une seule image dessinée pendant le test
      return frames;
    });

    render(<Snowfall />);

    expect(ctx.drawImage).toHaveBeenCalledTimes(250);
  });
});
