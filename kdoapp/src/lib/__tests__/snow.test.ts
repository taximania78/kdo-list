import { SNOW_FRONT, SNOW_TOTAL, advanceFlake, createFlakes, frameDelta, makeFlake, rescaleFlakes } from '@/lib/snow';

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
    advanceFlake(flake, 0, 390, 800, 1, fixed(0.5));
    expect(flake.y).toBeLessThan(0);
    expect(flake.front).toBe(true);
  });

  it('wraps a flake that drifted off the side', () => {
    const flake = { ...makeFlake(false, 390, 800, fixed(0.5)), x: -20, drift: 0 };
    advanceFlake(flake, 0, 390, 800);
    expect(flake.x).toBe(395);
  });
});

describe('frame rate independence', () => {
  it('moves a flake twice as far when twice as much time has passed', () => {
    const one = { ...makeFlake(false, 390, 800, fixed(0.5)), y: 100 };
    const two = { ...one };
    advanceFlake(one, 700, 390, 800, 1);
    advanceFlake(two, 700, 390, 800, 2);
    expect(two.y - 100).toBeCloseTo((one.y - 100) * 2);
    expect(two.x - 195).toBeCloseTo((one.x - 195) * 2);
  });

  it('measures the elapsed time in 60 Hz frames, clamped between 0 and 3', () => {
    expect(frameDelta(1016.67, 1000)).toBeCloseTo(1);
    expect(frameDelta(1008.335, 1000)).toBeCloseTo(0.5); // écran 120 Hz
    expect(frameDelta(1033.34, 1000)).toBeCloseTo(2); // 30 images/s
    expect(frameDelta(5000, 1000)).toBe(3); // retour d'un onglet en pause
    expect(frameDelta(900, 1000)).toBe(0);
  });
});

describe('rescaleFlakes', () => {
  it('keeps each flake at the same relative place when the screen is resized', () => {
    const flakes = [
      { ...makeFlake(false, 400, 800, fixed(0.5)), x: 100, y: 200 },
      { ...makeFlake(true, 400, 800, fixed(0.5)), x: 300, y: 600 },
    ];
    rescaleFlakes(flakes, 400, 800, 800, 400);
    expect(flakes.map((f) => [f.x, f.y])).toEqual([
      [200, 100],
      [600, 300],
    ]);
  });

  it('leaves the flakes alone when the old size is unknown', () => {
    const flakes = [{ ...makeFlake(false, 400, 800, fixed(0.5)), x: 100, y: 200 }];
    rescaleFlakes(flakes, 0, 0, 800, 400);
    expect([flakes[0].x, flakes[0].y]).toEqual([100, 200]);
  });
});
