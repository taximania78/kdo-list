import { render, screen } from '@testing-library/react';
import Snowfall from '@/components/decor/Snowfall';

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
