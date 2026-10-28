import { rng, type Texture } from '@ilker/shared';

/**
 * A head of hair in 3D, strand by strand. Roots are spread over the scalp (not the face), each strand is combed away
 * from a centre parting, drapes over the head, neck and shoulders and then falls; the texture (waves, curls, a bob, a
 * bun, a fade) shapes it after that. Strands gather into locks around guide strands, which is what makes hair look
 * like hair rather than a bundle of threads.
 */

export type V3 = [number, number, number];

/** The head: an ellipsoid at the origin, face towards +z, so the camera behind it looks along +z. */
export const HEAD = { r: [0.078, 0.1, 0.094] as V3 };

export type HairGeometry = {
  /** x, y, z per point. */
  positions: Float32Array;
  /** Unit direction along the strand per point. */
  tangents: Float32Array;
  /** Per point: t along the strand, tone, depth in the volume, streak (0 or 1). */
  attrs: Float32Array;
  /** Line segments: pairs of point indices. */
  index: Uint32Array;
  points: number;
};

export type Cut = { length: number; points: number; waves: number; amplitude: number; curl: boolean; bob: boolean; bun: boolean; fade: boolean; frizz: number };

export function cutFor(texture: Texture): Cut {
  switch (texture) {
    case 'curls':
      return { length: 0.42, points: 40, waves: 0, amplitude: 0, curl: true, bob: false, bun: false, fade: false, frizz: 0.004 };
    case 'bob':
      return { length: 0.19, points: 20, waves: 0, amplitude: 0.002, curl: false, bob: true, bun: false, fade: false, frizz: 0.0008 };
    case 'updo':
      return { length: 0.36, points: 34, waves: 0, amplitude: 0, curl: false, bob: false, bun: true, fade: false, frizz: 0.0012 };
    case 'fade':
      return { length: 0.03, points: 6, waves: 0, amplitude: 0, curl: false, bob: false, bun: false, fade: true, frizz: 0.001 };
    case 'sleek':
      return { length: 0.5, points: 30, waves: 0.4, amplitude: 0.002, curl: false, bob: false, bun: false, fade: false, frizz: 0.0002 };
    case 'straight':
      return { length: 0.46, points: 30, waves: 0.8, amplitude: 0.006, curl: false, bob: false, bun: false, fade: false, frizz: 0.0005 };
    case 'bangs':
    case 'waves':
    default:
      return { length: 0.5, points: 34, waves: 2.4, amplitude: 0.03, curl: false, bob: false, bun: false, fade: false, frizz: 0.0007 };
  }
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Keeps a point outside an ellipsoid (inflated by `pad`), pushing it out along the normal. */
function outside(p: V3, c: V3, r: V3, pad: number): V3 {
  const q: V3 = [(p[0] - c[0]) / (r[0] + pad), (p[1] - c[1]) / (r[1] + pad), (p[2] - c[2]) / (r[2] + pad)];
  const d = len(q);
  if (d >= 1) return p;
  const k = 1 / (d || 1);
  return [c[0] + q[0] * k * (r[0] + pad), c[1] + q[1] * k * (r[1] + pad), c[2] + q[2] * k * (r[2] + pad)];
}

/** The neck and the upper back, which long hair drapes over. */
const NECK = { c: [0, -0.15, -0.012] as V3, r: [0.052, 0.09, 0.05] as V3 };
const BACK = { c: [0, -0.33, 0.0] as V3, r: [0.2, 0.13, 0.115] as V3 };

function collide(p: V3, pad: number): V3 {
  let q = outside(p, [0, 0, 0], HEAD.r, pad);
  q = outside(q, NECK.c, NECK.r, pad * 0.8);
  q = outside(q, BACK.c, BACK.r, pad * 0.9);
  return q;
}

type Root = { p: V3; n: V3; side: number };

/** Roots over the scalp: a Fibonacci spread on the ellipsoid, kept above the hairline. */
function scalp(count: number, fade: boolean): Root[] {
  const out: Root[] = [];
  const n = Math.round(count * 2.6);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n && out.length < count; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const u: V3 = [Math.cos(th) * rad, y, Math.sin(th) * rad];
    const back = u[2] < -0.15;
    const front = u[2] > 0.45;
    const sideways = Math.abs(u[0]) > 0.75;
    if (front && u[1] < 0.42) continue;
    if (!back && sideways && u[1] < (fade ? 0.1 : -0.12)) continue;
    if (!back && !sideways && u[1] < 0.2) continue;
    if (back && u[1] < (fade ? -0.35 : -0.6)) continue;
    const p: V3 = [u[0] * HEAD.r[0], u[1] * HEAD.r[1], u[2] * HEAD.r[2]];
    const nrm = norm([u[0] / HEAD.r[0], u[1] / HEAD.r[1], u[2] / HEAD.r[2]]);
    out.push({ p, n: nrm, side: u[0] >= 0 ? 1 : -1 });
  }
  return out;
}

/** One strand from its root: combed, draped, then shaped by the cut. */
function grow(root: Root, cut: Cut, layer: number, length: number, phase: number, r: () => number): V3[] {
  const pts: V3[] = [];
  const P = cut.points;
  const seg = length / (P - 1);
  const pad = 0.002 + layer * (cut.fade ? 0.004 : 0.02);
  let p = add(root.p, mul(root.n, pad));
  // Away from the parting, down and a little back.
  // Hair at the back falls straight down; towards the sides it is combed a little outwards.
  const across = root.p[0] / HEAD.r[0];
  let comb: V3 = cut.bun ? norm(sub([0, -0.005, -0.104], p)) : norm([across * 0.42, -1, -0.28 + Math.max(0, root.n[2]) * 0.2]);
  comb = norm(sub(comb, mul(root.n, dot(comb, root.n))));
  if (cut.fade) comb = norm(add(mul(root.n, 0.75), [0, 0.15, 0.2]));
  let dir = comb;
  pts.push(p);
  const bunCentre: V3 = [0, -0.005, -0.118];
  let coil = -1;
  for (let i = 1; i < P; i++) {
    const t = i / (P - 1);
    if (cut.bun) {
      const toBun = sub(bunCentre, p);
      if (coil < 0 && len(toBun) < 0.03) coil = i;
      if (coil >= 0) {
        // Wind round the bun: a coil around an axis pointing straight back.
        const k = (i - coil) / Math.max(1, P - coil);
        const ang = phase + k * Math.PI * 3.2;
        const rr = 0.028 - k * 0.012 + layer * 0.006;
        p = [bunCentre[0] + Math.cos(ang) * rr, bunCentre[1] + Math.sin(ang) * rr * 0.85, bunCentre[2] - 0.012 - Math.sin(k * Math.PI) * 0.012];
        pts.push(p);
        continue;
      }
      dir = norm(lerp(dir, norm(toBun), 0.35));
    } else if (!cut.fade) {
      dir = norm(lerp(dir, [0, -1, -0.06], 0.16 + t * 0.1));
    }
    let next = add(p, mul(dir, seg));
    next = collide(next, pad + (cut.bob ? 0.006 : 0));
    dir = norm(sub(next, p));
    p = next;
    pts.push(p);
  }
  // Shape: waves and curls in the hanging part, a bob's ends turned under. Waves follow the height, not the strand's
  // own length, so neighbouring strands wave together instead of crossing.
  const fall = pts.map((_, i) => smooth(0.12, 0.45, i / (P - 1)));
  const top = pts[0][1];
  for (let i = 1; i < P; i++) {
    const t = i / (P - 1);
    const a = i < P - 1 ? norm(sub(pts[i + 1], pts[i - 1])) : norm(sub(pts[i], pts[i - 1]));
    const side = norm(cross(a, [0, 0, 1]));
    const out = norm(cross(side, a));
    const drop = top - pts[i][1];
    if (cut.curl) {
      const ang = phase + drop * 150;
      const rad = (0.011 + t * 0.012) * fall[i];
      pts[i] = add(pts[i], add(mul(side, Math.cos(ang) * rad), mul(out, Math.sin(ang) * rad)));
    } else if (cut.waves) {
      const w = Math.sin((drop / cut.length) * cut.waves * Math.PI * 2 + phase) * cut.amplitude * fall[i] * (0.55 + t * 0.6);
      pts[i] = add(pts[i], add(mul(side, w), mul(out, w * 0.5)));
    }
    if (cut.bob && t > 0.72) {
      const k = (t - 0.72) / 0.28;
      pts[i] = add(pts[i], [-pts[i][0] * 0.12 * k * k, 0.01 * k * k, 0.04 * k * k]);
    }
  }
  // A few flyaways, smooth along their length rather than jagged.
  if (r() < cut.frizz * 120) {
    const dir: V3 = [(r() - 0.5) * 0.02, (r() - 0.5) * 0.01, -r() * 0.012];
    for (let i = Math.floor(P * 0.5); i < P; i++) {
      const k = (i - P * 0.5) / (P * 0.5);
      pts[i] = add(pts[i], mul(dir, k * k));
    }
  }
  return pts;
}

export type ModelSpec = { texture: Texture; seed: string; strands: number; streaks?: number };

export function buildHair(spec: ModelSpec): HairGeometry {
  const cut = cutFor(spec.texture);
  const r = rng(`hair3d-${spec.seed}-${spec.texture}`);
  const strands = cut.fade ? Math.round(spec.strands * 1.4) : spec.strands;
  const roots = scalp(strands, cut.fade);
  // Locks: every strand leans towards the guide of the nearest lock along its length.
  const lockCount = Math.max(60, Math.round(roots.length / (cut.curl ? 26 : 40)));
  const lockRoots = scalp(lockCount, cut.fade);
  const locks = lockRoots.map((root, i) => {
    // Neighbouring locks wave nearly in step, as real hair does; only a little of it is random.
    const phase = root.p[0] * 38 + root.p[2] * 22 + r() * 0.7;
    const length = cut.length * (0.9 + r() * 0.2) * (cut.fade ? (root.n[1] > 0.5 ? 1 : 0.25) : 1);
    return { root, phase, length, tone: (r() - 0.5) * 2, path: grow(root, cut, 0.5, length, phase, r), id: i };
  });
  const P = cut.points;
  const total = roots.length * P;
  const positions = new Float32Array(total * 3);
  const tangents = new Float32Array(total * 3);
  const attrs = new Float32Array(total * 4);
  const index = new Uint32Array(roots.length * (P - 1) * 2);
  // Inner layers first, so the outer hair is drawn over them.
  const order = roots.map((root, i) => ({ root, layer: r(), i })).sort((a, b) => a.layer - b.layer);
  let k = 0;
  order.forEach(({ root, layer }, s) => {
    let best = locks[0];
    let bestD = Infinity;
    for (const lock of locks) {
      const d = len(sub(lock.root.p, root.p));
      if (d < bestD) {
        bestD = d;
        best = lock;
      }
    }
    // A strand is as long as its lock (give or take), so the two stay level and blend without shearing.
    const length = cut.fade ? cut.length * (root.n[1] > 0.5 ? 1 : 0.22) * (0.8 + r() * 0.4) : best.length * (0.95 + r() * 0.06);
    const own = grow(root, cut, layer, length, best.phase + (r() - 0.5) * 0.12, r);
    const pull = cut.fade ? 0 : 0.3 + r() * 0.3;
    // Whole locks are a shade lighter or darker than their neighbours: that is where the depth comes from.
    const tone = best.tone * 0.75 + (r() - 0.5) * 0.5;
    const streak = r() < (spec.streaks ?? 0) ? 1 : 0;
    for (let i = 0; i < P; i++) {
      const t = i / (P - 1);
      const g = best.path[Math.min(i, best.path.length - 1)];
      // The lock's own offset from this strand's root fades, so roots stay spread and the ends gather.
      const pos = lerp(own[i], add(g, mul(sub(own[0], best.path[0]), 1 - t)), pull * smooth(0.1, 0.9, t));
      const o = (s * P + i) * 3;
      positions[o] = pos[0];
      positions[o + 1] = pos[1];
      positions[o + 2] = pos[2];
      const a = (s * P + i) * 4;
      attrs[a] = t;
      attrs[a + 1] = tone;
      attrs[a + 2] = layer;
      attrs[a + 3] = streak;
      if (i < P - 1) {
        index[k++] = s * P + i;
        index[k++] = s * P + i + 1;
      }
    }
    for (let i = 0; i < P; i++) {
      const o = (s * P + i) * 3;
      const j = Math.min(P - 1, i + 1) === i ? i - 1 : i + 1;
      const o2 = (s * P + j) * 3;
      const sign = j > i ? 1 : -1;
      const tx = (positions[o2] - positions[o]) * sign;
      const ty = (positions[o2 + 1] - positions[o + 1]) * sign;
      const tz = (positions[o2 + 2] - positions[o + 2]) * sign;
      const l = Math.hypot(tx, ty, tz) || 1;
      tangents[o] = tx / l;
      tangents[o + 1] = ty / l;
      tangents[o + 2] = tz / l;
    }
  });
  return { positions, tangents, attrs, index, points: total };
}

/** Where the camera stands for each cut: behind and a little to the side, the way a hair campaign is shot. */
export function cameraFor(texture: Texture): { eye: V3; target: V3; fov: number } {
  const cut = cutFor(texture);
  if (cut.fade) return { eye: [0.3, 0.12, -0.36], target: [0, 0.02, 0], fov: 34 };
  if (cut.bun) return { eye: [0.26, 0.06, -0.44], target: [0, -0.01, -0.03], fov: 32 };
  if (cut.bob) return { eye: [0.3, 0.02, -0.5], target: [0, -0.05, 0], fov: 32 };
  return { eye: [0.34, 0.05, -0.8], target: [0, -0.16, 0], fov: 32 };
}
