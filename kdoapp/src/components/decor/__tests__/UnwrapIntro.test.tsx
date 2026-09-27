import { act, fireEvent, render, screen } from '@testing-library/react';
import UnwrapIntro, { shouldPlayUnwrap } from '@/components/decor/UnwrapIntro';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('shouldPlayUnwrap', () => {
  it('plays once per session', () => {
    const storage = memoryStorage();
    expect(shouldPlayUnwrap(storage, false)).toBe(true);
    expect(shouldPlayUnwrap(storage, false)).toBe(false);
  });

  it('never plays without storage, with a failing storage, or in an automated browser', () => {
    const failing = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
    };
    expect(shouldPlayUnwrap(null, false)).toBe(false);
    expect(shouldPlayUnwrap(failing, false)).toBe(false);
    expect(shouldPlayUnwrap(memoryStorage(), true)).toBe(false);
  });
});

describe('UnwrapIntro', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('covers the screen, opens by itself, then disappears', () => {
    render(<UnwrapIntro />);
    const overlay = screen.getByTestId('unwrap');
    expect(overlay).not.toHaveClass('is-opening');

    act(() => jest.advanceTimersByTime(500));
    expect(overlay).toHaveClass('is-opening');

    act(() => jest.advanceTimersByTime(1100));
    expect(screen.queryByTestId('unwrap')).toBeNull();
  });

  it('opens right away on tap', () => {
    render(<UnwrapIntro />);
    fireEvent.click(screen.getByTestId('unwrap'));
    expect(screen.getByTestId('unwrap')).toHaveClass('is-opening');
  });

  it('does not play again in the same session', () => {
    const { unmount } = render(<UnwrapIntro />);
    unmount();
    render(<UnwrapIntro />);
    expect(screen.queryByTestId('unwrap')).toBeNull();
  });
});
