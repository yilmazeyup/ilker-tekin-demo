/**
 * The fitting room's engine, in the browser only. Google MediaPipe (loaded from its CDN when the studio opens) finds
 * the hair and the face in the photo, on the device: nothing is uploaded. With that:
 *  - colour: the hair is re-dyed through a gradient map built from the look's three tones, so the photo keeps its
 *    own light and texture; balayage, babylights and ombre place the colour like the techniques do;
 *  - cut: a bob or a lob takes the hair away below a line measured from the face and fills in what was behind it;
 *    long uses the person's own lengths, stretched; curtain bangs are woven from hair taken off the crown.
 * Without the models the studio falls back to painting the hair by hand.
 */

const VERSION = '0.10.21';
const BUNDLE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/vision_bundle.mjs`;
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const HAIR_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

type MPMask = { width: number; height: number; getAsFloat32Array(): Float32Array; close(): void };
type Segmenter = { segment(image: CanvasImageSource): { confidenceMasks?: MPMask[]; close(): void } };
type FaceMarker = { detect(image: CanvasImageSource): { faceLandmarks: { x: number; y: number }[][] } };
type Vision = {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  ImageSegmenter: { createFromOptions(fileset: unknown, options: object): Promise<Segmenter> };
  FaceLandmarker: { createFromOptions(fileset: unknown, options: object): Promise<FaceMarker> };
};

let hairModel: Promise<Segmenter> | null = null;
let faceModel: Promise<FaceMarker> | null = null;
let visionLib: Promise<{ vision: Vision; fileset: unknown }> | null = null;

/** MediaPipe reports its own start-up (TensorFlow Lite, GL context) on the console as errors; those are kept quiet. */
function quietMediaPipe() {
  const noise = /^(INFO:|I\d{4}|W\d{4})|TensorFlow Lite|gl_context|Graph successfully|XNNPACK/;
  for (const level of ['error', 'warn', 'info', 'log'] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && noise.test(args[0])) return;
      original(...args);
    };
  }
}

function lib() {
  if (!visionLib) {
    quietMediaPipe();
    visionLib = (async () => {
      // A plain dynamic import of a URL, kept away from the bundler.
      const vision = (await new Function('u', 'return import(u)')(BUNDLE)) as Vision;
      return { vision, fileset: await vision.FilesetResolver.forVisionTasks(WASM) };
    })();
    visionLib.catch(() => {
      visionLib = null;
    });
  }
  return visionLib;
}

/** The hair model: needed for colour. Tries the GPU first, then the CPU; a failed load can be tried again. */
export function loadHair(): Promise<Segmenter> {
  if (!hairModel) {
    hairModel = lib().then(({ vision, fileset }) => {
      const make = (delegate: 'GPU' | 'CPU') =>
        vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAIR_MODEL, delegate },
          runningMode: 'IMAGE',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
      return make('GPU').catch(() => make('CPU'));
    });
    hairModel.catch(() => {
      hairModel = null;
    });
  }
  return hairModel;
}

/** The face model: only needed for a new length or a fringe. */
export function loadFace(): Promise<FaceMarker> {
  if (!faceModel) {
    faceModel = lib().then(({ vision, fileset }) => {
      const make = (delegate: 'GPU' | 'CPU') =>
        vision.FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: FACE_MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1 });
      return make('GPU').catch(() => make('CPU'));
    });
    faceModel.catch(() => {
      faceModel = null;
    });
  }
  return faceModel;
}

/** Both models, started together. */
export function loadModels() {
  return Promise.all([loadHair(), loadFace().catch(() => null)]);
}

export type Analysis = { w: number; h: number; mask: Float32Array; face: { x: number; y: number }[] | null };

/** Finds the hair (a soft mask, 0 to 1 per pixel) and the face landmarks in a canvas. */
export async function analyse(canvas: HTMLCanvasElement): Promise<Analysis> {
  const [hair, face] = await loadModels();
  const w = canvas.width;
  const h = canvas.height;
  const result = hair.segment(canvas);
  const masks = result.confidenceMasks ?? [];
  const m = masks[masks.length - 1];
  let mask = new Float32Array(w * h);
  if (m) {
    const data = m.getAsFloat32Array();
    if (m.width === w && m.height === h) mask = data.slice();
    else {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) mask[y * w + x] = data[Math.floor((y * m.height) / h) * m.width + Math.floor((x * m.width) / w)];
    }
  }
  result.close();
  let landmarks: { x: number; y: number }[] | null = null;
  try {
    landmarks = face?.detect(canvas).faceLandmarks[0] ?? null;
  } catch {
    landmarks = null;
  }
  return { w, h, mask, face: landmarks };
}

// ------------------------------------------------------------------------------------------------------- colour

export type Technique = 'heel' | 'balayage' | 'babylights' | 'ombre';

const hex = (c: string) => {
  const p = parseInt(c.slice(1), 16);
  return [(p >> 16) & 255, (p >> 8) & 255, p & 255];
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Luminance to dye colour: deep shadow, root, mid, ends, and a light highlight. */
function gradientMap(colours: readonly [string, string, string]): Uint8ClampedArray {
  const [r, m, e] = colours.map(hex);
  const stops: [number, number[]][] = [
    [0, r.map((v) => v * 0.28)],
    [0.22, r],
    [0.52, m],
    [0.82, e],
    [1, e.map((v) => v + (255 - v) * 0.45)],
  ];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const l = i / 255;
    let k = 0;
    while (k < stops.length - 2 && l > stops[k + 1][0]) k++;
    const [l0, c0] = stops[k];
    const [l1, c1] = stops[k + 1];
    const t = (l - l0) / (l1 - l0);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = c0[c] + (c1[c] - c0[c]) * t;
  }
  return lut;
}

function hairBounds(mask: Float32Array, w: number, h: number) {
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x += 2) {
      if (mask[y * w + x] > 0.5) {
        if (y < top) top = y;
        bottom = y;
        break;
      }
    }
  }
  return { top, bottom: Math.max(top + 1, bottom) };
}

/** A quick box blur of a single-channel image (separable), for the broad light of the hair. */
function blur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const n = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / n;
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / n;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/**
 * Re-dyes the hair in `src` into `out`. The broad light of the hair picks the dye's tone; the fine detail (every strand,
 * every shine) is put back on top, so the new colour is as sharp as the photo.
 */
export function recolour(src: ImageData, mask: Float32Array, colours: readonly [string, string, string], technique: Technique, strength: number, out: ImageData) {
  const { width: w, height: h } = src;
  const lut = gradientMap(colours);
  const { top, bottom } = hairBounds(mask, w, h);
  const span = bottom - top;
  const s = src.data;
  const o = out.data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (0.299 * s[i * 4] + 0.587 * s[i * 4 + 1] + 0.114 * s[i * 4 + 2]) / 255;
  const broad = blur(lum, w, h, Math.max(2, Math.round(w / 180)));
  for (let y = 0; y < h; y++) {
    const v = (y - top) / span;
    let rowWeight = 1;
    if (technique === 'balayage') rowWeight = 0.18 + 0.82 * smooth(0.12, 0.55, v);
    else if (technique === 'ombre') rowWeight = smooth(0.38, 0.72, v);
    else if (technique === 'babylights') rowWeight = 0.3 + 0.7 * smooth(0.02, 0.2, v);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = i * 4;
      const m = mask[i];
      o[p + 3] = 255;
      if (m < 0.04) {
        o[p] = s[p];
        o[p + 1] = s[p + 1];
        o[p + 2] = s[p + 2];
        continue;
      }
      let weight = rowWeight;
      if (technique === 'babylights') {
        const streak = (x * 0.13 + Math.sin(y * 0.021 + x * 0.004) * 1.8) % 1;
        weight *= streak < 0.38 ? 1 : 0.22;
      } else if (technique === 'balayage') {
        weight *= 0.78 + 0.22 * Math.sin(x * 0.045 + y * 0.012);
      }
      const lb = broad[i];
      const lc = Math.max(0, Math.min(255, Math.round(((lb - 0.5) * 1.1 + 0.5) * 255)));
      const tr = lut[lc * 3];
      const tg = lut[lc * 3 + 1];
      const tb = lut[lc * 3 + 2];
      // Put the strands back: the difference between this pixel and its surroundings, a little stronger.
      const detail = (lum[i] - lb) * 255 * 1.35;
      const a = Math.min(1, m * 1.15) * strength * weight;
      o[p] = s[p] + (Math.max(0, Math.min(255, tr + detail)) - s[p]) * a;
      o[p + 1] = s[p + 1] + (Math.max(0, Math.min(255, tg + detail)) - s[p + 1]) * a;
      o[p + 2] = s[p + 2] + (Math.max(0, Math.min(255, tb + detail)) - s[p + 2]) * a;
    }
  }
}

// ------------------------------------------------------------------------------------------------------- cut

export type Cut = 'origineel' | 'bob' | 'lob' | 'lang' | 'pony';

/** Push-pull fill: holes are filled from a pyramid of the known pixels around them, smoothly. */
function fill(img: Float32Array, known: Uint8Array, w: number, h: number) {
  const levels: { c: Float32Array; k: Float32Array; w: number; h: number }[] = [];
  let c = new Float32Array(w * h * 3);
  let k = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (known[i]) {
      k[i] = 1;
      c[i * 3] = img[i * 3];
      c[i * 3 + 1] = img[i * 3 + 1];
      c[i * 3 + 2] = img[i * 3 + 2];
    }
  }
  let lw = w;
  let lh = h;
  levels.push({ c, k, w: lw, h: lh });
  while (lw > 4 && lh > 4) {
    const nw = Math.ceil(lw / 2);
    const nh = Math.ceil(lh / 2);
    const nc = new Float32Array(nw * nh * 3);
    const nk = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++)
      for (let x = 0; x < nw; x++) {
        let sum = 0;
        const acc = [0, 0, 0];
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const sx = Math.min(lw - 1, x * 2 + dx);
            const sy = Math.min(lh - 1, y * 2 + dy);
            const j = sy * lw + sx;
            const wk = k[j];
            sum += wk;
            acc[0] += c[j * 3] * wk;
            acc[1] += c[j * 3 + 1] * wk;
            acc[2] += c[j * 3 + 2] * wk;
          }
        const j = y * nw + x;
        if (sum > 0) {
          nc[j * 3] = acc[0] / sum;
          nc[j * 3 + 1] = acc[1] / sum;
          nc[j * 3 + 2] = acc[2] / sum;
          nk[j] = Math.min(1, sum);
        }
      }
    c = nc;
    k = nk;
    lw = nw;
    lh = nh;
    levels.push({ c, k, w: lw, h: lh });
  }
  for (let l = levels.length - 2; l >= 0; l--) {
    const fine = levels[l];
    const coarse = levels[l + 1];
    for (let y = 0; y < fine.h; y++)
      for (let x = 0; x < fine.w; x++) {
        const j = y * fine.w + x;
        if (fine.k[j] >= 1) continue;
        // Bilinear from the coarser level, so the fill has no blocks.
        const fx = Math.max(0, Math.min(coarse.w - 1.001, (x + 0.5) / 2 - 0.5));
        const fy = Math.max(0, Math.min(coarse.h - 1.001, (y + 0.5) / 2 - 0.5));
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const ax = fx - x0;
        const ay = fy - y0;
        const t = fine.k[j];
        for (let ch = 0; ch < 3; ch++) {
          const at = (xx: number, yy: number) => coarse.c[(Math.min(coarse.h - 1, yy) * coarse.w + Math.min(coarse.w - 1, xx)) * 3 + ch];
          const v = (at(x0, y0) * (1 - ax) + at(x0 + 1, y0) * ax) * (1 - ay) + (at(x0, y0 + 1) * (1 - ax) + at(x0 + 1, y0 + 1) * ax) * ay;
          fine.c[j * 3 + ch] = fine.c[j * 3 + ch] * t + v * (1 - t);
        }
        fine.k[j] = 1;
      }
  }
  // A soft blur inside the filled area only, with a little grain so it matches the photo.
  const out = levels[0].c;
  const tmp = new Float32Array(out.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (known[i]) {
          tmp[i * 3] = out[i * 3];
          tmp[i * 3 + 1] = out[i * 3 + 1];
          tmp[i * 3 + 2] = out[i * 3 + 2];
          continue;
        }
        let n = 0;
        const acc = [0, 0, 0];
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) {
            const xx = Math.max(0, Math.min(w - 1, x + dx));
            const yy = Math.max(0, Math.min(h - 1, y + dy));
            const q = (yy * w + xx) * 3;
            acc[0] += out[q];
            acc[1] += out[q + 1];
            acc[2] += out[q + 2];
            n++;
          }
        tmp[i * 3] = acc[0] / n;
        tmp[i * 3 + 1] = acc[1] / n;
        tmp[i * 3 + 2] = acc[2] / n;
      }
    out.set(tmp);
  }
  for (let i = 0; i < w * h; i++) {
    if (known[i]) continue;
    const g = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const noise = (g - 0.5) * 6;
    out[i * 3] += noise;
    out[i * 3 + 1] += noise;
    out[i * 3 + 2] += noise;
  }
  return out;
}

export type Face = { chin: number; top: number; height: number; centerX: number; left: number; right: number; brow: number };

/** The example photo's face, measured by hand: it is turned too far for the face model, which wants a front view. */
export const SAMPLE_FACE: Face = { top: 158, chin: 424, height: 266, centerX: 246, left: 184, right: 318, brow: 247 };

/** The face measured from MediaPipe's 478 landmarks, in pixels. */
export function measure(face: { x: number; y: number }[], w: number, h: number): Face {
  const p = (i: number) => ({ x: face[i].x * w, y: face[i].y * h });
  const chin = p(152).y;
  const top = p(10).y;
  return { chin, top, height: chin - top, centerX: (p(10).x + p(152).x) / 2, left: p(234).x, right: p(454).x, brow: (p(105).y + p(334).y) / 2 };
}

/** A new length or a fringe, made from the person's own hair. Returns the new picture and the hair mask to colour. */
export function recut(src: ImageData, mask: Float32Array, face: Face, cut: Cut): { image: ImageData; mask: Float32Array } {
  const { width: w, height: h } = src;
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const newMask = mask.slice();
  if (cut === 'origineel') return { image: out, mask: newMask };

  if (cut === 'bob' || cut === 'lob') {
    const line = face.chin + face.height * (cut === 'bob' ? -0.02 : 0.45);
    const feather = Math.max(4, face.height * 0.05);
    const hole = new Uint8Array(w * h);
    const keep = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        // A bob is a touch longer towards the face.
        const toFace = Math.max(0, 1 - Math.abs(x - face.centerX) / (face.height * 1.4));
        const cutAt = line + toFace * face.height * 0.06;
        const k = smooth(cutAt - feather, cutAt + feather, y);
        if (mask[i] > 0.3 && k > 0.02) {
          keep[i] = k;
          if (k > 0.5) hole[i] = 1;
        }
      }
    const img = new Float32Array(w * h * 3);
    const known = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      img[i * 3] = src.data[i * 4];
      img[i * 3 + 1] = src.data[i * 4 + 1];
      img[i * 3 + 2] = src.data[i * 4 + 2];
      // What was behind the cut-away hair comes from what is around it, not from the hair itself.
      known[i] = hole[i] || mask[i] > 0.15 ? 0 : 1;
    }
    const filled = fill(img, known, w, h);
    for (let i = 0; i < w * h; i++) {
      const k = keep[i] * Math.min(1, mask[i] * 1.3);
      if (k <= 0) continue;
      out.data[i * 4] = src.data[i * 4] * (1 - k) + filled[i * 3] * k;
      out.data[i * 4 + 1] = src.data[i * 4 + 1] * (1 - k) + filled[i * 3 + 1] * k;
      out.data[i * 4 + 2] = src.data[i * 4 + 2] * (1 - k) + filled[i * 3 + 2] * k;
      newMask[i] = mask[i] * (1 - keep[i]);
    }
    // The new ends: a little darker and denser right at the line, as freshly cut hair is.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (newMask[i] < 0.3) continue;
        const toFace = Math.max(0, 1 - Math.abs(x - face.centerX) / (face.height * 1.4));
        const d = line + toFace * face.height * 0.06 - y;
        if (d > 0 && d < feather * 3) {
          const k = (1 - d / (feather * 3)) * 0.25;
          out.data[i * 4] *= 1 - k;
          out.data[i * 4 + 1] *= 1 - k;
          out.data[i * 4 + 2] *= 1 - k;
        }
      }
    return { image: out, mask: newMask };
  }

  if (cut === 'lang') {
    // Extensions: the lengths below the shoulders are drawn out by half again, over what is behind them.
    const pivot = face.chin + face.height * 0.35;
    const stretch = 1.55;
    for (let y = Math.floor(pivot); y < h; y++) {
      const sy = Math.floor(pivot + (y - pivot) / stretch);
      for (let x = 0; x < w; x++) {
        const si = sy * w + x;
        const m = mask[si];
        if (m < 0.08) continue;
        const i = y * w + x;
        const a = Math.min(1, m * 1.2);
        out.data[i * 4] = out.data[i * 4] * (1 - a) + src.data[si * 4] * a;
        out.data[i * 4 + 1] = out.data[i * 4 + 1] * (1 - a) + src.data[si * 4 + 1] * a;
        out.data[i * 4 + 2] = out.data[i * 4 + 2] * (1 - a) + src.data[si * 4 + 2] * a;
        newMask[i] = Math.max(newMask[i], m);
      }
    }
    return { image: out, mask: newMask };
  }

  // Curtain bangs: hair from the crown, laid over the forehead in two sweeps from a middle parting.
  const halfW = (face.right - face.left) * 0.5;
  const top = face.top - face.height * 0.04;
  const bottom = face.brow + face.height * 0.04;
  const source = Math.max(0, face.top - face.height * 0.32);
  for (let y = Math.max(0, Math.floor(top)); y < Math.min(h, Math.ceil(bottom + face.height * 0.18)); y++) {
    for (let x = Math.max(0, Math.floor(face.centerX - halfW)); x < Math.min(w, Math.ceil(face.centerX + halfW)); x++) {
      const dx = (x - face.centerX) / halfW;
      // Shortest at the parting, sweeping longer towards the cheekbones.
      const length = bottom + Math.abs(dx) * face.height * 0.16 - Math.max(0, 0.12 - Math.abs(dx)) * face.height * 0.35;
      const k = smooth(length + 6, length - 6, y) * smooth(1, 0.82, Math.abs(dx)) * smooth(top - 4, top + 8, y);
      if (k <= 0.01) continue;
      // Sample the crown with the strands leaning outwards, away from the parting.
      const sx = Math.round(x - dx * (y - top) * 0.35);
      const sy = Math.round(source + ((y - top) / Math.max(1, bottom - top)) * face.height * 0.22);
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
      const si = sy * w + sx;
      const i = y * w + x;
      const shade = 0.82 + 0.18 * (1 - (y - top) / Math.max(1, length - top));
      out.data[i * 4] = out.data[i * 4] * (1 - k) + src.data[si * 4] * shade * k;
      out.data[i * 4 + 1] = out.data[i * 4 + 1] * (1 - k) + src.data[si * 4 + 1] * shade * k;
      out.data[i * 4 + 2] = out.data[i * 4 + 2] * (1 - k) + src.data[si * 4 + 2] * shade * k;
      newMask[i] = Math.max(newMask[i], k);
    }
  }
  return { image: out, mask: newMask };
}
