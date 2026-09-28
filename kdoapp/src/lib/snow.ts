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

const FRAME_MS = 1000 / 60;
const MAX_FRAME_DELTA = 3;

/** Temps écoulé depuis l'image précédente, en images à 60 Hz, borné à [0, 3] (évite un saut au retour d'un onglet). */
export function frameDelta(time: number, last: number): number {
  return Math.min(Math.max((time - last) / FRAME_MS, 0), MAX_FRAME_DELTA);
}

/**
 * Avance de `dt` images à 60 Hz (même vitesse à 30, 60 ou 120 images/s).
 * Modifie `flake` sur place : pas d'allocation par image.
 */
export function advanceFlake(
  flake: Flake,
  time: number,
  width: number,
  height: number,
  dt = 1,
  rand: Rand = Math.random
): void {
  flake.y += flake.speed * dt;
  flake.x += Math.sin(time / 1400 + flake.phase) * flake.drift * 0.5 * dt;
  if (flake.y > height + flake.radius * 2) {
    Object.assign(flake, makeFlake(flake.front, width, height, rand, false));
    return;
  }
  if (flake.x < -10) flake.x = width + 5;
  else if (flake.x > width + 10) flake.x = -5;
}

/** Garde chaque flocon à la même place relative quand l'écran change de taille (sur place). */
export function rescaleFlakes(flakes: Flake[], oldW: number, oldH: number, newW: number, newH: number): void {
  if (oldW <= 0 || oldH <= 0) return;
  const sx = newW / oldW;
  const sy = newH / oldH;
  for (const flake of flakes) {
    flake.x *= sx;
    flake.y *= sy;
  }
}
