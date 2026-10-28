import { Asset } from 'expo-asset';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Look } from '@ilker/shared';

import { analyse, measure, recolour, recut, SAMPLE_FACE, type Analysis, type Cut, type Technique } from '../tryon/engine';
import { C, CHROMA, PAD, R } from '../theme';
import { Icon } from './Icon';
import { PhotoPicker } from './PhotoPicker';
import { Chip, LiveDot, Press, Row, Tag, Txt } from './ui';

export type TryOnProps = { looks: Look[]; initialLook?: string; onSave: (lookId: string) => void; onBook: (look: Look) => void };

const TECHNIQUES: { id: Technique; label: string }[] = [
  { id: 'heel', label: 'Heel' },
  { id: 'balayage', label: 'Balayage' },
  { id: 'babylights', label: 'Babylights' },
  { id: 'ombre', label: 'Ombre' },
];
const CUTS: { id: Cut; label: string; line: string }[] = [
  { id: 'origineel', label: 'Zoals nu', line: 'Je eigen lengte' },
  { id: 'bob', label: 'Bob', line: 'Tot je kaaklijn' },
  { id: 'lob', label: 'Lob', line: 'Tot je schouders' },
  { id: 'lang', label: 'Lang', line: 'Met extensions' },
  { id: 'pony', label: 'Gordijnpony', line: 'Zacht rond je gezicht' },
];
const SAMPLE = require('../../assets/tryon-sample.jpg');
const MAX_H = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Feature 2 and the cut preview: colour and cut tried on a photo, with the AI running in the browser. */
export function TryOn({ looks, initialLook, onSave, onBook }: TryOnProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [base, setBase] = useState<HTMLCanvasElement | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'manual'>('loading');
  const [mode, setMode] = useState<'kleur' | 'kapsel'>('kleur');
  const [lookId, setLookId] = useState(initialLook ?? looks[0].id);
  const [technique, setTechnique] = useState<Technique>('heel');
  const [strength, setStrength] = useState(0.85);
  const [cut, setCut] = useState<Cut>('origineel');
  const [split, setSplit] = useState(0.5);
  const [painting, setPainting] = useState<Float32Array | null>(null);
  const result = useRef<HTMLCanvasElement | null>(null);
  const before = useRef<HTMLCanvasElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const look = looks.find((l) => l.id === lookId) ?? looks[0];

  // Load the photo into a working canvas and let the AI find hair and face.
  useEffect(() => {
    let live = true;
    (async () => {
      const src = photo ?? Asset.fromModule(SAMPLE).uri;
      const img = await loadImage(src);
      const k = Math.min(1, MAX_H / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (!live) return;
      setBase(canvas);
      setAnalysis(null);
      setPainting(null);
      setStatus('loading');
      try {
        // One retry: on a phone the connection can drop for a moment while the models come in.
        const a = await analyse(canvas).catch(() => new Promise((r) => setTimeout(r, 1500)).then(() => analyse(canvas)));
        if (live) {
          setAnalysis(a);
          setStatus('ready');
        }
      } catch {
        if (live) {
          setStatus('manual');
          setPainting(new Float32Array(canvas.width * canvas.height));
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [photo]);

  const face = useMemo(() => {
    if (analysis?.face && base) return measure(analysis.face, base.width, base.height);
    return !photo && analysis && base && base.width === 540 ? SAMPLE_FACE : null;
  }, [analysis, base, photo]);

  // Draw: the cut first (with the person's own hair), then the colour over the new hair.
  useEffect(() => {
    if (!base || !result.current || !before.current) return;
    const w = base.width;
    const h = base.height;
    for (const c of [result.current, before.current]) {
      c.width = w;
      c.height = h;
    }
    const bctx = before.current.getContext('2d')!;
    bctx.drawImage(base, 0, 0);
    const src = base.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h);
    const mask = analysis?.mask ?? painting;
    if (!mask) {
      result.current.getContext('2d')!.drawImage(base, 0, 0);
      return;
    }
    const shaped = face && cut !== 'origineel' ? recut(src, mask, face, cut) : { image: src, mask };
    if (lookId === 'eigen') {
      result.current.getContext('2d')!.putImageData(shaped.image, 0, 0);
      return;
    }
    const out = new ImageData(w, h);
    recolour(shaped.image, shaped.mask, look.colours, technique, strength, out);
    result.current.getContext('2d')!.putImageData(out, 0, 0);
  }, [base, analysis, painting, face, cut, lookId, look, technique, strength]);

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = box.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (status === 'manual' && painting && base && (e.buttons || e.type === 'pointerdown') && e.shiftKey === false && e.altKey === false) {
      // Hand mode: paint the hair with a soft brush.
      const px = x * base.width;
      const py = ((e.clientY - rect.top) / rect.height) * base.height;
      const r = base.width * 0.05;
      const next = painting.slice();
      for (let y = Math.max(0, Math.floor(py - r)); y < Math.min(base.height, py + r); y++)
        for (let xx = Math.max(0, Math.floor(px - r)); xx < Math.min(base.width, px + r); xx++) {
          const d = Math.hypot(xx - px, y - py) / r;
          if (d < 1) next[y * base.width + xx] = Math.max(next[y * base.width + xx], 1 - d * d);
        }
      setPainting(next);
      return;
    }
    if (e.buttons || e.type === 'pointerdown') setSplit(Math.max(0, Math.min(1, x)));
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ borderRadius: R.xl, overflow: 'hidden', backgroundColor: '#070D2C' }}>
        <div
          ref={box}
          onPointerDown={onPointer}
          onPointerMove={onPointer}
          style={{ position: 'relative', width: '100%', aspectRatio: base ? `${base.width} / ${base.height}` : '3 / 4', touchAction: 'none', cursor: status === 'manual' ? 'crosshair' : 'ew-resize', userSelect: 'none' }}
        >
          <canvas ref={before} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <canvas ref={result} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: status === 'manual' ? 'none' : `inset(0 0 0 ${split * 100}%)` }} />
          {status !== 'manual' ? (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${split * 100}%`, width: 2, marginLeft: -1, background: 'rgba(246,238,230,0.9)', boxShadow: '0 0 12px rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', top: '50%', left: -17, width: 36, height: 36, marginTop: -18, borderRadius: 12, background: '#F6EEE6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#140C10', fontFamily: '"DM Mono", monospace', fontSize: 13 }}>
                ⇆
              </div>
            </div>
          ) : null}
        </div>
        <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }} pointerEvents="none">
          <Tag label={status === 'manual' ? 'Schilder je haar' : 'Voor'} color={C.white} bg="rgba(6,11,34,0.6)" />
          <Tag label={photo ? 'Jouw foto' : 'AI-voorbeeld'} color={C.white} bg="rgba(6,11,34,0.6)" />
          {status !== 'manual' ? <Tag label="Na" color="#140C10" bg={C.cream} /> : null}
        </View>
      </View>

      <Row gap={8}>
        {status === 'loading' ? <LiveDot color={C.warn} /> : status === 'ready' ? <LiveDot /> : <Icon name="wand" size={15} color={C.warn} />}
        <Txt v="small" color={C.soft} style={{ flex: 1 }}>
          {status === 'loading'
            ? 'De AI zoekt je haar en je gezicht…'
            : status === 'ready'
              ? face
                ? 'Haar gevonden. Sleep over de foto om voor en na te vergelijken.'
                : 'Haar gevonden. Voor een nieuwe lengte: een foto met je gezicht recht in beeld.'
              : 'De AI kon niet laden. Schilder met je vinger over je haar.'}
        </Txt>
      </Row>

      <Row gap={8}>
        <Chip label="Kleur" icon="wand" on={mode === 'kleur'} onPress={() => setMode('kleur')} />
        <Chip label="Kapsel · AI" icon="scissors" on={mode === 'kapsel'} onPress={() => setMode('kapsel')} />
      </Row>

      {mode === 'kleur' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
            <Press onPress={() => setLookId('eigen')} accessibilityLabel="Eigen kleur" accessibilityState={{ selected: lookId === 'eigen' }} style={{ width: 74, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 62, height: 62, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: lookId === 'eigen' ? C.blue : 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={18} color={C.soft} />
              </View>
              <Txt v="small" size={11} align="center" color={lookId === 'eigen' ? C.text : C.muted}>
                Eigen kleur
              </Txt>
            </Press>
            {looks.map((l) => {
              const on = l.id === lookId;
              return (
                <Press key={l.id} onPress={() => setLookId(l.id)} accessibilityLabel={l.name} accessibilityState={{ selected: on }} style={{ width: 74, alignItems: 'center', gap: 6 }}>
                  <View
                    style={[
                      { width: 62, height: 62, borderRadius: 18, borderWidth: 2, borderColor: on ? C.blue : 'transparent' },
                      { backgroundImage: `linear-gradient(160deg, ${l.colours[2]} 0%, ${l.colours[1]} 55%, ${l.colours[0]} 100%)` } as object,
                    ]}
                  />
                  <Txt v="small" size={11} align="center" numberOfLines={2} color={on ? C.text : C.muted}>
                    {l.name}
                  </Txt>
                </Press>
              );
            })}
          </ScrollView>
          <Row gap={8} wrap>
            {TECHNIQUES.map((t) => (
              <Chip key={t.id} label={t.label} on={technique === t.id} chroma={look.chroma} onPress={() => setTechnique(t.id)} />
            ))}
          </Row>
          <Row gap={8}>
            {[0.5, 0.7, 0.85, 1].map((s) => (
              <Chip key={s} label={`${Math.round(s * 100)}%`} on={Math.abs(strength - s) < 0.01} onPress={() => setStrength(s)} />
            ))}
          </Row>
        </>
      ) : (
        <View style={{ gap: 10 }}>
          <Row gap={8} wrap>
            {CUTS.map((c) => (
              <Chip key={c.id} label={c.label} on={cut === c.id} chroma="violet" onPress={() => setCut(c.id)} />
            ))}
          </Row>
          <Txt v="small" color={C.muted}>
            {CUTS.find((c) => c.id === cut)!.line}. Gemaakt van je eigen haar, door de AI op je telefoon. Een voorproefje, geen belofte: je stylist kijkt mee.
          </Txt>
        </View>
      )}

      <View style={{ gap: 10 }}>
        <PhotoPicker label="Probeer het op je eigen foto" value={photo} onChange={setPhoto} height={photo ? 0 : 110} capture="user" max={1080} />
        {photo ? (
          <Press onPress={() => setPhoto(null)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', padding: 6 }}>
            <Icon name="refresh" size={15} color={C.soft} />
            <Txt v="small" color={C.soft}>
              Terug naar het voorbeeld
            </Txt>
          </Press>
        ) : null}
      </View>

      <Row gap={10}>
        <Press
          onPress={() => onSave(lookId === 'eigen' ? '' : look.id)}
          fxNames="glass"
          style={{ flex: 1, height: 52, borderRadius: R.pill, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,28,72,0.16)' }}
        >
          <Icon name="heart" size={18} />
          <Txt v="h3">Bewaar voor je stylist</Txt>
        </Press>
        <Press
          onPress={() => onBook(look)}
          fxNames={`dye-${look.chroma} sheen`}
          style={{ flex: 1, height: 52, borderRadius: R.pill, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA[look.chroma].stops[1] }}
        >
          <Icon name="scissors" size={18} color="#140C10" />
          <Txt v="h3" color="#140C10">
            Boek dit
          </Txt>
        </Press>
      </Row>
      <Txt v="small" color={C.faint}>
        Privé: je foto verlaat je telefoon niet. De AI (Google MediaPipe) draait in je browser. Het voorbeeld is een AI-beeld.
      </Txt>
    </View>
  );
}
