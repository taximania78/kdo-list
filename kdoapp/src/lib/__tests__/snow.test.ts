import { SNOW_FRONT, SNOW_TOTAL, advanceFlake, createFlakes, makeFlake } from '@/lib/snow';

const fixed = (value: number) => () => value;

describe('createFlakes', () => {
  it('creates exactly 250 flakes, 20 of them in front of the content', () => {
    const flakes = createFlakes(390, 800);
    expect(SNOW_TOTAL).toBe(250);
    expect(flakes).toHaveLength(250);
    expect(flakes.filter((f) => f.front)).toHaveLength(SNOW_FRONT);
    expect(SNOW_FRONT).toBe(20);
  });

  it('spreads the first flakes over the whole screen', () => {
    for (const flake of createFlakes(390, 800)) {
      expect(flake.x).toBeGreaterThanOrEqual(0);
      expect(flake.x).toBeLessThanOrEqual(390);
      expect(flake.y).toBeGreaterThanOrEqual(0);
      expect(flake.y).toBeLessThanOrEqual(800);
    }
  });

  it('makes front flakes bigger than back flakes', () => {
    expect(makeFlake(true, 100, 100, fixed(0)).radius).toBeGreaterThan(makeFlake(false, 100, 100, fixed(1)).radius);
  });
});

describe('advanceFlake', () => {
  it('moves a flake down by its speed', () => {
    const flake = makeFlake(false, 390, 800, fixed(0.5));
    const y = flake.y;
    advanceFlake(flake, 0, 390, 800);
    expect(flake.y).toBeCloseTo(y + flake.speed);
  });

  it('sends a flake that left the bottom back above the top, same layer', () => {
    const flake = { ...makeFlake(true, 390, 800, fixed(0.5)), y: 900 };
    advanceFlake(flake, 0, 390, 800, fixed(0.5));
    expect(flake.y).toBeLessThan(0);
    expect(flake.front).toBe(true);
  });

  it('wraps a flake that drifted off the side', () => {
    const flake = { ...makeFlake(false, 390, 800, fixed(0.5)), x: -20, drift: 0 };
    advanceFlake(flake, 0, 390, 800);
    expect(flake.x).toBe(395);
  });
});
