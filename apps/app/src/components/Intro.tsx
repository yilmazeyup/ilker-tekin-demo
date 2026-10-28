import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { C, FONT } from '../theme';
import { nativeDriver, prefersReducedMotion, Txt } from './ui';

/** The opening natively: a still from the intro clip, the name rising over it, then it lifts away. */
export function Intro({ onDone }: { onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = setTimeout(finish, 900);
      return () => clearTimeout(id);
    }
    const seq = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }),
      Animated.delay(1100),
      Animated.timing(out, { toValue: 1, duration: 600, easing: Easing.bezier(0.7, 0, 0.2, 1), useNativeDriver: nativeDriver }),
    ]);
    seq.start(({ finished }) => finished && finish());
    return () => seq.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100, opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
      <Pressable onPress={finish} style={[StyleSheet.absoluteFill, { backgroundColor: C.night }]}>
        <Image source={require('../../assets/intro/poster-portrait.jpg')} contentFit="cover" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,11,34,0.35)' }]} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: '10%', alignItems: 'center', gap: 10 }}>
          <Animated.Text
            style={{
              fontFamily: FONT.display,
              fontStyle: 'italic',
              fontSize: 60,
              color: '#F8EDE1',
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
            }}
          >
            İlker Tekin
          </Animated.Text>
          <Txt v="label" color={C.cream}>
            Hairstylist & Academy · Eindhoven
          </Txt>
        </View>
        <View style={{ position: 'absolute', top: 54, right: 14, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(6,11,34,0.55)' }}>
          <Txt v="label" size={9} color={C.cream}>
            AI-video
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}
