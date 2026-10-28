import type { ChromaId } from './menu';

/**
 * "Chroma": the salon's own black, with hair-dye colours on it. Each chroma is a dye in three tones, from root to
 * ends, plus the glow it gives on black and the ink that reads on top of it.
 */
export type Chroma = { id: ChromaId; name: string; stops: [string, string, string]; glow: string; on: string };

export const CHROMA: Record<ChromaId, Chroma> = {
  koper: { id: 'koper', name: 'Koper', stops: ['#FFB27A', '#FF6A2C', '#B83A12'], glow: '#FF7A3D', on: '#1A0B05' },
  honing: { id: 'honing', name: 'Honing', stops: ['#FFE6A6', '#FFC24B', '#C98316'], glow: '#FFC24B', on: '#1E1405' },
  roze: { id: 'roze', name: 'Rosé', stops: ['#FFC2D6', '#FF5C93', '#B3165A'], glow: '#FF5C93', on: '#22060F' },
  violet: { id: 'violet', name: 'Violet', stops: ['#D9CCFF', '#8F6BFF', '#4A23C9'], glow: '#8F6BFF', on: '#0D0624' },
  ijs: { id: 'ijs', name: 'IJsblond', stops: ['#F1F6FF', '#A9C6FF', '#5A7FE6'], glow: '#A9C6FF', on: '#081227' },
  kers: { id: 'kers', name: 'Kers', stops: ['#FF9AA0', '#F2243C', '#8A0A1E'], glow: '#F2243C', on: '#1F0307' },
  mocha: { id: 'mocha', name: 'Mocha', stops: ['#E2C3A3', '#9B6A45', '#4A2E1C'], glow: '#C7926A', on: '#160C06' },
};

export const CHROMA_ORDER: ChromaId[] = ['koper', 'roze', 'violet', 'ijs', 'honing', 'kers', 'mocha'];

/** The page and its layers: white and airy, navy text, blue only as the accent. */
export const INK = {
  night: '#FFFFFF',
  deep: '#F6F8FD',
  plum: '#EEF2FB',
  raised: '#E4EAF8',
  line: 'rgba(16,28,72,0.08)',
  lineStrong: 'rgba(16,28,72,0.16)',
  text: '#0E1630',
  soft: '#3E4766',
  muted: '#6D7593',
  faint: '#A0A6BF',
  cream: '#F6EEE6',
  blue: '#2741D6',
  blueSoft: '#EBEFFF',
  white: '#FFFFFF',
  /** The salon's own red, from its site. */
  red: '#E0182D',
  ok: '#139E6A',
  warn: '#C98316',
};

/** A CSS gradient through a chroma's three tones. */
export const chromaGradient = (id: ChromaId, angle = 135) => {
  const [a, b, c] = CHROMA[id].stops;
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 52%, ${c} 100%)`;
};

/** Mixes two hex colours; `t` 0 is `a`, 1 is `b`. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** A hex colour with an alpha, as rgba(). */
export function alpha(hex: string, a: number): string {
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${a})`;
}
