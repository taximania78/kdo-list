'use client';

import { useEffect, useRef } from 'react';
import { advanceFlake, createFlakes, frameDelta, rescaleFlakes, type Flake } from '@/lib/snow';

const MAX_DPR = 2;

// Flocon pré-dessiné une fois par taille, puis simplement copié à chaque image.
function makeSprite(radius: number, soft: boolean, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = Math.ceil(radius * 2 + 4) * dpr;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(soft ? 0.35 : 0.6, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return canvas;
}

/** 250 flocons : 230 derrière le contenu, 20 devant (DESIGN.md › Motion). */
export default function Snowfall() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    const backCtx = back?.getContext('2d');
    const frontCtx = front?.getContext('2d');
    if (!back || !front || !backCtx || !frontCtx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    const resize = () => {
      const oldWidth = width;
      const oldHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      // Les flocons gardent leur place relative au lieu de repartir tous ensemble.
      rescaleFlakes(flakes, oldWidth, oldHeight, width, height);
      for (const canvas of [back, front]) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    flakes = createFlakes(width, height);
    const sprites = new Map<string, HTMLCanvasElement>();
    const spriteFor = (flake: Flake) => {
      const diameter = Math.round(flake.radius * 2);
      const key = `${flake.front ? 'f' : 'b'}${diameter}`;
      let sprite = sprites.get(key);
      if (!sprite) {
        sprite = makeSprite(diameter / 2, flake.front, dpr);
        sprites.set(key, sprite);
      }
      return sprite;
    };

    let frame = 0;
    let last: number | null = null; // null : première image (ou retour d'un onglet caché)
    const draw = (time: number) => {
      const dt = last === null ? 1 : frameDelta(time, last);
      last = time;
      backCtx.clearRect(0, 0, width, height);
      frontCtx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        advanceFlake(flake, time, width, height, dt);
        const ctx = flake.front ? frontCtx : backCtx;
        const sprite = spriteFor(flake);
        const size = sprite.width / dpr;
        ctx.globalAlpha = flake.alpha;
        ctx.drawImage(sprite, flake.x - size / 2, flake.y - size / 2, size, size);
      }
      frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = null; // pas de rattrapage du temps passé en pause
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={backRef}
        aria-hidden
        data-testid="snow-back"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <canvas
        ref={frontRef}
        aria-hidden
        data-testid="snow-front"
        className="pointer-events-none fixed inset-0 z-45 h-full w-full"
      />
    </>
  );
}
