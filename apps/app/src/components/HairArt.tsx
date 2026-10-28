import { rng, type Texture } from '@ilker/shared';
import { useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type HairArtProps = {
  colours: readonly [string, string, string];
  texture: Texture;
  seed: string;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  density?: number;
  streaks?: number;
  background?: string;
  shine?: number;
};

/** Natively a lighter drawing: a few dozen strands in SVG, in the look's colours. The web version draws hundreds. */
export function HairArt({ colours, texture, seed, style, background }: HairArtProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const paths = useMemo(() => {
    if (!size.w) return [];
    const r = rng(seed);
    return Array.from({ length: 40 }, () => {
      const x = r() * size.w;
      const amp = texture === 'waves' || texture === 'curls' ? 8 + r() * 12 : 2 + r() * 3;
      const len = texture === 'bob' ? 0.6 : texture === 'fade' ? 0.25 : 1.05;
      const ph = r() * 6.28;
      let d = `M${x.toFixed(1)} -4`;
      for (let i = 1; i <= 12; i++) {
        const t = i / 12;
        d += ` L${(x + Math.sin(t * 7 + ph) * amp * t).toFixed(1)} ${(t * len * size.h).toFixed(1)}`;
      }
      return { d, w: 0.8 + r() * 1.6, o: 0.5 + r() * 0.5 };
    });
  }, [size, seed, texture]);
  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colours[0]} />
              <Stop offset="0.5" stopColor={colours[1]} />
              <Stop offset="1" stopColor={colours[2]} />
            </LinearGradient>
          </Defs>
          {background ? <Rect width={size.w} height={size.h} fill={background} /> : null}
          {paths.map((p, i) => (
            <Path key={i} d={p.d} stroke="url(#hair)" strokeWidth={p.w} strokeOpacity={p.o} fill="none" strokeLinecap="round" />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
