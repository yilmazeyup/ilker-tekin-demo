import type { Texture } from '@ilker/shared';
import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { cachedHairImage, geometryFor, hairImage, lookOf, strandsFor, type HairSpec3D } from '../hair3d/cache';
import { cameraFor } from '../hair3d/model';
import { HairRenderer } from '../hair3d/renderer';

export type HairArtProps = {
  colours: readonly [string, string, string];
  texture: Texture;
  seed: string;
  style?: StyleProp<ViewStyle>;
  /** Live: the hair sways and the light moves. Off for lists of cards, which get a still render. */
  animate?: boolean;
  density?: number;
  streaks?: number;
  /** Kept for the native drawing; the 3D studio has its own backdrop. */
  background?: string;
  shine?: number;
};

const dpr = () => Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);

/** A look rendered as a head of hair in 3D, in a midnight-blue studio. */
export function HairArt({ colours, texture, seed, style, animate, density, streaks }: HairArtProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const spec: HairSpec3D = { colours, texture, seed, streaks, density };
  return (
    <View
      style={[{ overflow: 'hidden', backgroundColor: '#E8EDFA' }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0 && (!size || Math.abs(size.w - width) > 2 || Math.abs(size.h - height) > 2)) setSize({ w: width, h: height });
      }}
    >
      {size ? animate ? <Live spec={spec} w={size.w} h={size.h} /> : <Still spec={spec} w={size.w} h={size.h} /> : null}
    </View>
  );
}

function Still({ spec, w, h }: { spec: HairSpec3D; w: number; h: number }) {
  const pw = Math.round(w * dpr());
  const ph = Math.round(h * dpr());
  const [url, setUrl] = useState<string | null>(() => cachedHairImage(spec, pw, ph));
  const key = `${spec.seed}|${spec.texture}|${spec.colours.join(',')}|${pw}x${ph}`;
  useEffect(() => {
    let live = true;
    const hit = cachedHairImage(spec, pw, ph);
    if (hit) {
      setUrl(hit);
      return;
    }
    setUrl(null);
    hairImage(spec, pw, ph).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #F7F8FF 0%, #DCE3F7 100%)',
        }}
      />
      {url ? (
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'hairIn .6s ease both' }}
        />
      ) : null}
    </>
  );
}

function Live({ spec, w, h }: { spec: HairSpec3D; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const key = `${spec.seed}|${spec.texture}|${spec.colours.join(',')}`;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: HairRenderer;
    try {
      renderer = new HairRenderer(canvas);
    } catch {
      return;
    }
    const pw = Math.round(w * dpr());
    const ph = Math.round(h * dpr());
    renderer.setHair(geometryFor(spec, strandsFor(pw, ph, (spec.density ?? 1) * 0.9)), lookOf(spec));
    const view = cameraFor(spec.texture);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    const start = performance.now();
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || now - last < 30) return;
      last = now;
      const t = (now - start) / 1000;
      renderer.render(view, { width: pw, height: ph, time: t, wind: reduced ? 0 : 1, light: reduced ? 0 : Math.sin(t * 0.35) });
    };
    renderer.render(view, { width: pw, height: ph, time: 0, wind: 0, light: 0 });
    if (!reduced) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h]);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}
