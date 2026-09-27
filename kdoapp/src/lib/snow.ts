export const SNOW_TOTAL = 250;
export const SNOW_FRONT = 20;

export type Flake = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
  front: boolean;
};

type Rand = () => number;

/** `anywhere` : position de départ n'importe où (premier affichage) ; sinon juste au-dessus de l'écran. */
export function makeFlake(
  front: boolean,
  width: number,
  height: number,
  rand: Rand = Math.random,
  anywhere = true
): Flake {
  const radius = front ? 4 + rand() * 3 : 1 + rand() * 2.2;
  return {
    front,
    radius,
    x: rand() * width,
    y: anywhere ? rand() * height : -radius * 2,
    speed: front ? 1.1 + rand() * 0.9 : 0.25 + (radius - 1) * 0.25 + rand() * 0.35,
    drift: 0.3 + rand() * 0.8,
    phase: rand() * Math.PI * 2,
    alpha: front ? 0.85 : 0.55 + rand() * 0.45,
  };
}

export function createFlakes(width: number, height: number, rand: Rand = Math.random): Flake[] {
  return Array.from({ length: SNOW_TOTAL }, (_, i) =>
    makeFlake(i >= SNOW_TOTAL - SNOW_FRONT, width, height, rand)
  );
}

/** Avance d'une image. Modifie `flake` sur place : pas d'allocation par image. */
export function advanceFlake(
  flake: Flake,
  time: number,
  width: number,
  height: number,
  rand: Rand = Math.random
): void {
  flake.y += flake.speed;
  flake.x += Math.sin(time / 1400 + flake.phase) * flake.drift * 0.5;
  if (flake.y > height + flake.radius * 2) {
    Object.assign(flake, makeFlake(flake.front, width, height, rand, false));
    return;
  }
  if (flake.x < -10) flake.x = width + 5;
  else if (flake.x > width + 10) flake.x = -5;
}
