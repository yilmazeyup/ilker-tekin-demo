import type { ChromaId, Product } from '@ilker/shared';
import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { CHROMA } from '../theme';

/** A progress ring: the processing timer, the busy meter, the club level. */
export function Ring({
  value,
  size = 120,
  stroke = 10,
  chroma = 'koper',
  track = 'rgba(16,28,72,0.09)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  chroma?: ChromaId;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const [a, b, cc] = CHROMA[chroma].stops;
  const id = `ring-${chroma}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="0.5" stopColor={b} />
            <Stop offset="1" stopColor={cc} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - v)}
        />
      </Svg>
      {children}
    </View>
  );
}

const N = 25;

/** A check-in code: real finder squares, filler from the seed. Decorative in the demo, nothing to scan. */
export function QrCode({ seed = 7, size = 168, color = '#140C10' }: { seed?: number; size?: number; color?: string }) {
  const cells = useMemo(() => {
    const out: boolean[] = [];
    const finder = (r: number, c: number) => {
      for (const [r0, c0] of [
        [0, 0],
        [0, N - 7],
        [N - 7, 0],
      ]) {
        if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
          const rr = r - r0;
          const cc = c - c0;
          return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) ? 1 : 0;
        }
      }
      return -1;
    };
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const f = finder(r, c);
        if (f !== -1) out.push(f === 1);
        else if ((r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)) out.push(false);
        else if (r === 6 || c === 6) out.push((r + c) % 2 === 0);
        else out.push((r * 7 + c * 13 + r * c * seed) % 5 < 2);
      }
    }
    return out;
  }, [seed]);
  const cell = size / N;
  return (
    <Svg width={size} height={size}>
      {cells.map((on, i) =>
        on ? <Rect key={i} x={(i % N) * cell} y={Math.floor(i / N) * cell} width={cell + 0.3} height={cell + 0.3} rx={cell * 0.18} fill={color} /> : null,
      )}
    </Svg>
  );
}

/** A product drawn as a bottle with its liquid showing through, and the brand line on the label. No logos. */
export function Bottle({ product, height = 150 }: { product: Product; height?: number }) {
  const w = height * 0.5;
  const tube = product.id.startsWith('loreal-pli') || product.id.startsWith('loreal-volume');
  const brush = product.id === 'loop-brush';
  const id = `liq-${product.id}`;
  if (brush) {
    return (
      <Svg width={w * 1.4} height={height} viewBox="0 0 70 150">
        <Rect x="27" y="62" width="16" height="84" rx="8" fill={product.bottle} />
        <Rect x="14" y="6" width="42" height="62" rx="16" fill={product.liquid} opacity={0.9} />
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => <Circle key={`${r}-${c}`} cx={22 + c * 9} cy={14 + r * 9} r={2.2} fill="#140C10" opacity={0.75} />),
        )}
      </Svg>
    );
  }
  return (
    <Svg width={w} height={height} viewBox="0 0 50 150">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={product.liquid} stopOpacity="0.95" />
          <Stop offset="1" stopColor={product.liquid} stopOpacity="0.55" />
        </LinearGradient>
      </Defs>
      {tube ? (
        <>
          <Rect x="17" y="2" width="16" height="16" rx="3" fill="#2A2A2A" />
          <Rect x="7" y="16" width="36" height="132" rx="9" fill={product.bottle} />
          <Rect x="7" y="70" width="36" height="78" rx="9" fill={`url(#${id})`} />
        </>
      ) : (
        <>
          <Rect x="18" y="2" width="14" height="20" rx="3" fill={product.brand === 'Olaplex' ? '#1A1A1A' : '#2E2E2E'} />
          <Path d="M10 30 Q10 20 20 20 H30 Q40 20 40 30 V140 Q40 148 32 148 H18 Q10 148 10 140 Z" fill={product.bottle} />
          <Path d="M10 78 H40 V140 Q40 148 32 148 H18 Q10 148 10 140 Z" fill={`url(#${id})`} />
        </>
      )}
      <Rect x="13" y="40" width="24" height="30" rx="3" fill="rgba(255,255,255,0.86)" />
      <SvgText x="25" y="54" fontSize={product.brand === 'Olaplex' ? 7.5 : 5.4} fontWeight="700" fill="#140C10" textAnchor="middle">
        {product.brand === 'Olaplex' ? product.line : product.name.split(' ')[0].replace('Blondifier', 'Blond')}
      </SvgText>
      <SvgText x="25" y="64" fontSize="4.6" fill="#140C10" textAnchor="middle">
        {product.size}
      </SvgText>
      <Rect x="12" y="24" width="3" height="110" rx="1.5" fill="rgba(16,28,72,0.35)" />
    </Svg>
  );
}

/** Confetti strips in the dye colours, for a booking or a reward. */
export function Confetti({ seed = 1, width = 360, height = 220 }: { seed?: number; width?: number; height?: number }) {
  const pieces = useMemo(() => {
    const colours = ['#FF6A2C', '#FF5C93', '#8F6BFF', '#A9C6FF', '#FFC24B', '#F2243C'];
    let a = seed * 9301 + 49297;
    const rand = () => {
      a = (a * 9301 + 49297) % 233280;
      return a / 233280;
    };
    return Array.from({ length: 46 }, (_, i) => ({ x: rand() * width, y: rand() * height, r: rand() * 180, c: colours[i % colours.length], w: 4 + rand() * 6, h: 10 + rand() * 12 }));
  }, [seed, width, height]);
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      {pieces.map((p, i) => (
        <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={1.5} fill={p.c} transform={`rotate(${p.r.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`} opacity={0.9} />
      ))}
    </Svg>
  );
}
