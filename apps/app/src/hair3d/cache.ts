import type { Texture } from '@ilker/shared';

import { buildHair, cameraFor, type HairGeometry } from './model';
import { HairRenderer, type Look3D } from './renderer';

/**
 * Still renders of the 3D hair for cards and lists: one hidden WebGL canvas renders every look in turn and hands back
 * an image, so a screen full of looks needs a single GPU context instead of one per card.
 */

export type HairSpec3D = { colours: readonly [string, string, string]; texture: Texture; seed: string; streaks?: number; density?: number };

const urls = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();
const geometries = new Map<string, HairGeometry>();
type Job = { key: string; spec: HairSpec3D; w: number; h: number; resolve: (url: string | null) => void };
const queue: Job[] = [];
let renderer: HairRenderer | null = null;
let canvas: HTMLCanvasElement | null = null;
let busy = false;

export const strandsFor = (w: number, h: number, density = 1) => Math.round(Math.max(3200, Math.min(12000, ((w * h) / 52) * density)));

const keyOf = (spec: HairSpec3D, w: number, h: number) => `${spec.seed}|${spec.texture}|${spec.colours.join(',')}|${spec.streaks ?? 0}|${spec.density ?? 1}|${w}x${h}`;

export function lookOf(spec: HairSpec3D): Look3D {
  return { root: spec.colours[0], mid: spec.colours[1], ends: spec.colours[2], streaks: spec.streaks ?? 0, glow: spec.colours[1] };
}

/** The same strands for the same look, built once. */
export function geometryFor(spec: HairSpec3D, strands: number): HairGeometry {
  const key = `${spec.seed}|${spec.texture}|${strands}|${spec.streaks ?? 0}`;
  let g = geometries.get(key);
  if (!g) {
    g = buildHair({ texture: spec.texture, seed: spec.seed, strands, streaks: spec.streaks });
    geometries.set(key, g);
    if (geometries.size > 8) geometries.delete(geometries.keys().next().value as string);
  }
  return g;
}

export const cachedHairImage = (spec: HairSpec3D, w: number, h: number) => urls.get(keyOf(spec, w, h)) ?? null;

export function hairImage(spec: HairSpec3D, w: number, h: number): Promise<string | null> {
  const key = keyOf(spec, w, h);
  const done = urls.get(key);
  if (done) return Promise.resolve(done);
  const waiting = pending.get(key);
  if (waiting) return waiting;
  const promise = new Promise<string | null>((resolve) => {
    queue.push({ key, spec, w, h, resolve });
    void pump();
  });
  pending.set(key, promise);
  return promise;
}

async function pump() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const job = queue.shift()!;
    // Let the page breathe between renders.
    await new Promise((r) => setTimeout(r, 16));
    try {
      if (!renderer) {
        canvas = document.createElement('canvas');
        renderer = new HairRenderer(canvas, { preserve: true });
      }
      const geometry = geometryFor(job.spec, strandsFor(job.w, job.h, job.spec.density));
      renderer.setHair(geometry, lookOf(job.spec));
      renderer.render(cameraFor(job.spec.texture), { width: job.w, height: job.h });
      const blob = await new Promise<Blob | null>((r) => canvas!.toBlob(r, 'image/webp', 0.92));
      const url = blob ? URL.createObjectURL(blob) : null;
      if (url) urls.set(job.key, url);
      job.resolve(url);
    } catch {
      job.resolve(null);
    }
    pending.delete(job.key);
  }
  busy = false;
}
