import { CHROMA, INK, type ChromaId } from '@ilker/shared';
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * "Chroma": the salon's black, hair-dye colours on top, liquid glass in between. Fonts load from Google Fonts on the
 * web (Bodoni Moda for the fashion headlines, Inter Tight for text, DM Mono for numbers and labels); natively the
 * system fonts stand in.
 */
export const C = INK;
export { CHROMA };

export const isWeb = Platform.OS === 'web';

export const FONT = {
  display: isWeb ? '"Bodoni Moda", "Didot", "Bodoni 72", "Noto Naskh Arabic", Georgia, serif' : Platform.select({ ios: 'Didot', default: 'serif' }),
  sans: isWeb ? '"Inter Tight", "Helvetica Neue", "IBM Plex Sans Arabic", Arial, sans-serif' : undefined,
  mono: isWeb ? '"DM Mono", ui-monospace, Menlo, "IBM Plex Sans Arabic", monospace' : Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const R = { xs: 8, sm: 12, md: 18, lg: 26, xl: 34, pill: 999 };
export const GAP = 16;
export const PAD = 20;

/** Web-only CSS that React Native's types do not know (backdrop filters, gradients, blend modes). */
export const web = (style: Record<string, string | number>): ViewStyle & TextStyle => (isWeb ? (style as ViewStyle & TextStyle) : {});

/**
 * Hooks an element up to the global web stylesheet (src/web/css.ts) through a data attribute: `{...fx('glass')}`.
 * Ignored natively.
 */
export const fx = (names: string): Record<string, unknown> => (isWeb ? { dataSet: { fx: names } } : {});

export const chroma = (id: ChromaId) => CHROMA[id];

/** A chroma's gradient as a web background; natively its middle tone. */
export function dye(id: ChromaId, angle = 135, alpha = 1): ViewStyle {
  const [a, b, c] = CHROMA[id].stops;
  if (!isWeb) return { backgroundColor: b };
  const rgba = (hex: string) => {
    const p = parseInt(hex.slice(1), 16);
    return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${alpha})`;
  };
  return { backgroundImage: `linear-gradient(${angle}deg, ${rgba(a)} 0%, ${rgba(b)} 55%, ${rgba(c)} 100%)` } as ViewStyle;
}

/** Three colours as a web gradient (hair from root to ends); natively the middle colour. */
export function strands(colours: readonly [string, string, string], angle = 180): ViewStyle {
  if (!isWeb) return { backgroundColor: colours[1] };
  return { backgroundImage: `linear-gradient(${angle}deg, ${colours[0]} 0%, ${colours[1]} 55%, ${colours[2]} 100%)` } as ViewStyle;
}

export const shadow = (depth = 1): ViewStyle =>
  isWeb
    ? ({ boxShadow: `0 ${8 * depth}px ${28 * depth}px rgba(0,0,0,${0.28 + depth * 0.06})` } as ViewStyle)
    : { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18 * depth, shadowOffset: { width: 0, height: 8 * depth }, elevation: 6 * depth };

/** The width the app is laid out for: a phone, also on a wide screen. */
export const MAX_WIDTH = 520;
