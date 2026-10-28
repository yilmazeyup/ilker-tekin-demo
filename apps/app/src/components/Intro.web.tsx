import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';

import { fontsReady } from '../web/css';

/**
 * The opening on the web: the Canva AI clip of a woman tossing her copper-to-honey balayage, graded into the app's
 * midnight blue (a vertical cut on phones, the full frame on wide screens). As the hair settles the salon's name
 * rises letter by letter; then the picture opens up into the app. A tap skips it.
 */
const CLIPS = {
  portrait: { video: require('../../assets/intro/intro-portrait.mp4'), poster: require('../../assets/intro/poster-portrait.jpg') },
  landscape: { video: require('../../assets/intro/intro-landscape.mp4'), poster: require('../../assets/intro/poster-landscape.jpg') },
};

const uri = (module: number) => Asset.fromModule(module).uri;

const NAME = ['İlker', 'Tekin'];

export function Intro({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<'wait' | 'play' | 'words' | 'exit'>('wait');
  const [portrait] = useState(() => window.innerWidth / Math.max(1, window.innerHeight) < 1.05);
  const clip = portrait ? CLIPS.portrait : CLIPS.landscape;
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    let cancelled = false;
    fontsReady(1200).then(() => {
      if (cancelled) return;
      if (reduced) {
        setPhase('words');
        timers.push(window.setTimeout(finish, 1400));
        return;
      }
      // Muted and inline, so phones allow it to start on its own; if they don't, the poster carries the moment.
      video.current?.play().catch(() => {});
      setPhase('play');
      timers.push(window.setTimeout(() => setPhase('words'), 2500));
      timers.push(window.setTimeout(() => setPhase('exit'), 5000));
      timers.push(window.setTimeout(finish, 5800));
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const words = phase === 'words' || phase === 'exit';
  const exit = phase === 'exit';
  let letter = 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="İlker Tekin Hairstylist & Academy. Tik om verder te gaan"
      onClick={finish}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && finish()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#060B22',
        opacity: exit ? 0 : 1,
        transition: 'opacity .8s cubic-bezier(.7,0,.2,1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: exit ? 'scale(1.1)' : phase === 'wait' ? 'scale(1.04)' : 'scale(1)',
          filter: exit ? 'blur(10px)' : 'blur(0px)',
          opacity: phase === 'wait' ? 0 : 1,
          transition: 'transform 6s cubic-bezier(.2,.7,.2,1), opacity .7s ease, filter .8s ease',
        }}
      >
        <video
          ref={video}
          src={uri(clip.video)}
          poster={uri(clip.poster)}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: portrait ? '50% 30%' : '45% 40%' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(6,11,34,0.55) 0%, rgba(6,11,34,0) 22%, rgba(6,11,34,0) 52%, rgba(6,11,34,0.82) 82%, rgba(6,11,34,0.96) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(9%, 54px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          pointerEvents: 'none',
          transform: exit ? 'translateY(-18px)' : 'none',
          transition: 'transform .8s cubic-bezier(.7,0,.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.26em',
            alignItems: 'baseline',
            fontFamily: '"Bodoni Moda", Didot, serif',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(54px, 14.5vw, 128px)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
            color: '#F8EDE1',
            textShadow: '0 6px 40px rgba(6,11,34,0.6)',
          }}
        >
          {NAME.map((word) => (
            <span key={word} style={{ display: 'inline-flex' }}>
              {word.split('').map((ch) => {
                const i = letter++;
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      opacity: words ? 1 : 0,
                      filter: words ? 'blur(0px)' : 'blur(12px)',
                      transform: words ? 'translateY(0)' : 'translateY(0.35em)',
                      transition: `opacity .9s ease ${i * 60}ms, filter 1s ease ${i * 60}ms, transform 1.1s cubic-bezier(.2,.9,.25,1) ${i * 60}ms`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: words ? 1 : 0,
            transform: words ? 'none' : 'translateY(8px)',
            transition: 'opacity .9s ease .6s, transform .9s ease .6s',
          }}
        >
          <span style={{ width: words ? 34 : 0, height: 1, background: 'linear-gradient(90deg, transparent, #FFB27A)', transition: 'width 1s ease .7s' }} />
          <span style={{ fontFamily: '"DM Mono", ui-monospace, monospace', fontSize: 11, letterSpacing: '0.42em', textTransform: 'uppercase', color: '#F6EEE6', paddingLeft: '0.42em' }}>
            Hairstylist &amp; Academy
          </span>
          <span style={{ width: words ? 34 : 0, height: 1, background: 'linear-gradient(270deg, transparent, #FFB27A)', transition: 'width 1s ease .7s' }} />
        </div>
        <div
          style={{
            fontFamily: '"DM Mono", ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'rgba(246,238,230,0.6)',
            opacity: words ? 1 : 0,
            transition: 'opacity .9s ease .9s',
            paddingLeft: '0.5em',
          }}
        >
          Eindhoven
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 'max(14px, env(safe-area-inset-top))',
          right: 14,
          padding: '5px 9px',
          borderRadius: 7,
          background: 'rgba(6,11,34,0.55)',
          border: '1px solid rgba(16,28,72,0.14)',
          color: 'rgba(246,238,230,0.85)',
          fontFamily: '"DM Mono", ui-monospace, monospace',
          fontSize: 9.5,
          letterSpacing: '0.16em',
          opacity: phase === 'wait' ? 0 : 1,
          transition: 'opacity .6s ease .4s',
        }}
      >
        AI-VIDEO
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          textAlign: 'center',
          fontFamily: '"DM Mono", ui-monospace, monospace',
          fontSize: 9.5,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(246,238,230,0.4)',
          opacity: phase === 'play' || phase === 'words' ? 1 : 0,
          transition: 'opacity .6s ease 1s',
        }}
      >
        Tik om verder te gaan
      </div>
    </div>
  );
}
