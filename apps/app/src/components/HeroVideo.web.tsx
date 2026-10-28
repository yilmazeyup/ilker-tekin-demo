import { Asset } from 'expo-asset';
import { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

const VIDEO = require('../../assets/hero-hair.mp4');
const POSTER = require('../../assets/hero-hair.jpg');

/** Hair falling in slow motion, from the intro clip: a quiet loop behind the visit card. Pauses off screen. */
export function HeroVideo({ style }: { style?: StyleProp<ViewStyle> }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(video);
    return () => io.disconnect();
  }, []);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#070D2C' }, style]}>
      <video
        ref={ref}
        src={Asset.fromModule(VIDEO).uri}
        poster={Asset.fromModule(POSTER).uri}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 30%' }}
      />
    </View>
  );
}
