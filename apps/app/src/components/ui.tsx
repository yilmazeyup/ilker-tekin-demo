import type { ChromaId } from '@ilker/shared';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { localize, rtl } from '../i18n';
import { C, CHROMA, FONT, fx, isWeb, R, web } from '../theme';
import { Icon, type IconName } from './Icon';

export const nativeDriver = Platform.OS !== 'web';

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => {
    reduceMotion = on;
  })
  .catch(() => {});
export const prefersReducedMotion = () => reduceMotion;

export function tap(kind: 'light' | 'medium' | 'success' | 'select' = 'light') {
  if (isWeb) return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (kind === 'select') Haptics.selectionAsync().catch(() => {});
  else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// ---------------------------------------------------------------------------------------------------------- text

export type Variant = 'hero' | 'display' | 'title' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'num' | 'timer' | 'quote';

const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: FONT.display, fontStyle: 'italic', fontWeight: '500', fontSize: 54, lineHeight: 54, letterSpacing: -1.6 },
  display: { fontFamily: FONT.display, fontStyle: 'italic', fontWeight: '500', fontSize: 40, lineHeight: 42, letterSpacing: -1 },
  title: { fontFamily: FONT.display, fontStyle: 'italic', fontWeight: '500', fontSize: 30, lineHeight: 33, letterSpacing: -0.6 },
  quote: { fontFamily: FONT.display, fontStyle: 'italic', fontWeight: '400', fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  h2: { fontFamily: FONT.sans, fontWeight: '700', fontSize: 21, lineHeight: 25, letterSpacing: -0.5 },
  h3: { fontFamily: FONT.sans, fontWeight: '600', fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  body: { fontFamily: FONT.sans, fontWeight: '400', fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FONT.sans, fontWeight: '400', fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FONT.mono, fontWeight: '500', fontSize: 10.5, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' },
  num: { fontFamily: FONT.mono, fontWeight: '500', fontSize: 14, lineHeight: 18 },
  timer: { fontFamily: FONT.sans, fontWeight: '300', fontSize: 66, lineHeight: 68, letterSpacing: -3 },
};

type TxtProps = TextProps & {
  v?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Fills the letters with a dye gradient on the web. */
  ink?: ChromaId | 'chroma';
  weight?: TextStyle['fontWeight'];
  size?: number;
};

/** Arabic letters join up; spacing them out would break the script. */
const JOINED: TextStyle = { letterSpacing: 0 };

export function Txt({ v = 'body', color = C.text, align, ink, weight, size, style, children, ...rest }: TxtProps) {
  const base = VARIANTS[v];
  const sized: TextStyle | null = size ? { fontSize: size, lineHeight: Math.round(size * ((base.lineHeight as number) / (base.fontSize as number))) } : null;
  const tabular = v === 'num' || v === 'timer' ? 'tabular' : '';
  return (
    <Text
      {...rest}
      {...fx([ink ? `ink-${ink}` : '', tabular, v === 'hero' || v === 'display' || v === 'title' ? 'balance' : ''].filter(Boolean).join(' '))}
      style={[base, sized, { color: ink && !isWeb ? CHROMA[ink === 'chroma' ? 'roze' : ink].stops[1] : color }, align ? { textAlign: align } : null, weight ? { fontWeight: weight } : null, style, rtl() ? JOINED : null]}
    >
      {localize(children)}
    </Text>
  );
}

// ---------------------------------------------------------------------------------------------------------- press

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scaleTo?: number;
  haptic?: boolean;
  fxNames?: string;
};

/** Anything tappable: it gives under the finger and springs back. */
export function Press({ style, children, scaleTo = 0.965, haptic = true, onPressIn, onPressOut, onPress, fxNames = '', disabled, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: nativeDriver, stiffness: value === 1 ? 300 : 520, damping: value === 1 ? 11 : 30, mass: 0.8 }).start();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      {...fx(`pointer nosel ${fxNames}`)}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduceMotion) to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }, disabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------------------------------------- glass

type GlassProps = PropsWithChildren<{ style?: StyleProp<ViewStyle>; radius?: number; pad?: number; strong?: boolean; tint?: ChromaId; light?: boolean }>;

/** A pane of liquid glass: blurred, lit from the top edge, with the colour behind it shining through. */
export function Glass({ style, radius = R.lg, pad = 18, strong, tint, light, children }: GlassProps) {
  return (
    <View
      {...fx(strong ? 'glass-strong' : light ? 'glass-light' : 'glass')}
      style={[
        {
          borderRadius: radius,
          padding: pad,
          borderWidth: 1,
          borderColor: tint ? `${CHROMA[tint].glow}55` : 'rgba(16,28,72,0.13)',
          backgroundColor: isWeb ? 'rgba(255,255,255,0.4)' : strong ? '#FFFFFF' : '#F7F9FF',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------- buttons

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  after?: IconName;
  kind?: 'dye' | 'glass' | 'cream' | 'ghost' | 'red' | 'ink';
  chroma?: ChromaId | 'chroma';
  size?: 'lg' | 'md' | 'sm';
  full?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
};

export function Button({ title, onPress, icon, after, kind = 'dye', chroma = 'chroma', size = 'md', full, disabled, style, label }: ButtonProps) {
  const h = size === 'lg' ? 60 : size === 'md' ? 50 : 38;
  // Blue and dark buttons carry white text; the pastel dye colours carry ink.
  const color = kind === 'dye' && chroma !== 'chroma' ? '#140C10' : kind === 'dye' || kind === 'red' || kind === 'ink' ? '#FFFFFF' : kind === 'cream' ? C.blue : C.text;
  const bg: ViewStyle =
    kind === 'dye'
      ? { backgroundColor: chroma === 'chroma' ? C.blue : CHROMA[chroma].stops[1] }
      : kind === 'cream'
        ? { backgroundColor: C.blueSoft }
        : kind === 'red'
          ? { backgroundColor: C.red }
          : kind === 'ink'
            ? { backgroundColor: C.text }
            : kind === 'glass'
              ? { backgroundColor: 'rgba(16,28,72,0.06)', borderWidth: 1, borderColor: 'rgba(16,28,72,0.16)' }
              : { backgroundColor: 'transparent' };
  const names = kind === 'dye' ? `dye-${chroma} sheen` : kind === 'glass' ? 'glass' : '';
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label ?? title}
      fxNames={names}
      style={[
        {
          height: h,
          paddingHorizontal: size === 'sm' ? 14 : 22,
          borderRadius: R.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        bg,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={color} /> : null}
      <Txt v="h3" color={color} size={size === 'lg' ? 18 : size === 'md' ? 16 : 14} weight="600">
        {title}
      </Txt>
      {after ? <Icon name={after} size={size === 'sm' ? 15 : 18} color={color} /> : null}
    </Press>
  );
}

/** A round-cornered square icon button on glass, for headers. */
export function IconButton({ name, onPress, label, size = 44, tint }: { name: IconName; onPress?: () => void; label: string; size?: number; tint?: string }) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      fxNames="glass"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16,28,72,0.14)',
        backgroundColor: isWeb ? 'rgba(255,255,255,0.7)' : '#FFFFFF',
      }}
    >
      <Icon name={name} size={size * 0.45} color={tint ?? C.text} />
    </Press>
  );
}

// ---------------------------------------------------------------------------------------------------------- small parts

export function Chip({ label, on, onPress, chroma, icon }: { label: string; on?: boolean; onPress?: () => void; chroma?: ChromaId; icon?: IconName }) {
  const c = chroma ? CHROMA[chroma] : null;
  return (
    <Press
      onPress={onPress}
      scaleTo={0.93}
      accessibilityState={{ selected: !!on }}
      fxNames={on && chroma ? `dye-${chroma}` : on ? '' : 'glass'}
      style={{
        height: 38,
        paddingHorizontal: 15,
        borderRadius: R.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderWidth: 1,
        borderColor: on ? 'transparent' : 'rgba(16,28,72,0.14)',
        backgroundColor: on ? (c ? c.stops[0] : C.blue) : 'rgba(255,255,255,0.6)',
      }}
    >
      {icon ? <Icon name={icon} size={15} color={on ? (c ? '#140C10' : '#FFFFFF') : C.soft} /> : null}
      <Txt v="small" weight="600" color={on ? (c ? '#140C10' : '#FFFFFF') : C.soft}>
        {label}
      </Txt>
    </Press>
  );
}

export function Tag({ label, color = C.soft, bg = 'rgba(16,28,72,0.08)', style }: { label: string; color?: string; bg?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: bg }, style]}>
      <Txt v="label" color={color} size={9.5}>
        {label}
      </Txt>
    </View>
  );
}

/** A small status light: green while open or live, red for alerts. */
export function LiveDot({ color = C.ok, alert }: { color?: string; alert?: boolean }) {
  return <View {...fx(alert ? 'pulse-red' : 'pulse')} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: alert ? '#F2243C' : color }} />;
}

export function SectionHead({ kicker, title, action, onAction }: { kicker?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
      <View style={{ flex: 1, gap: 6 }}>
        {kicker ? <Txt v="label" color={C.muted}>{kicker}</Txt> : null}
        <Txt v="title">{title}</Txt>
      </View>
      {action ? (
        <Press onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}>
          <Txt v="small" weight="600" color={C.soft}>
            {action}
          </Txt>
          <Icon name="arrow" size={15} color={C.soft} />
        </Press>
      ) : null}
    </View>
  );
}

export function Row({ children, gap = 10, style, wrap }: PropsWithChildren<{ gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }>) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height: 1, backgroundColor: 'rgba(16,28,72,0.08)', marginVertical: 14 }, style]} />
);

/** A labelled number, like "Wachttijd 25 min". */
export function Stat({ label, value, sub, color = C.text }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Txt v="label" color={C.muted}>
        {label}
      </Txt>
      <Txt v="h2" color={color} {...fx('tabular')}>
        {value}
      </Txt>
      {sub ? (
        <Txt v="small" color={C.muted}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

/** A thin bar, filled to `value` (0 to 1). */
export function Bar({ value, chroma = 'koper', height = 6, style }: { value: number; chroma?: ChromaId | 'chroma'; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: 'rgba(16,28,72,0.08)', overflow: 'hidden' }, style]}>
      <View
        {...fx(`dye-${chroma}`)}
        style={[{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, borderRadius: height, backgroundColor: chroma === 'chroma' ? '#FF5C93' : CHROMA[chroma].stops[1] }, web({ transition: 'width .6s cubic-bezier(.2,.9,.25,1)' })]}
      />
    </View>
  );
}

/** Note for anything that would really happen in a live app: here it is only a demo. */
export function DemoNote({ text }: { text: string }) {
  return (
    <Row gap={8} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: R.sm, backgroundColor: 'rgba(16,28,72,0.05)', alignItems: 'flex-start' }}>
      <Icon name="info" size={15} color={C.muted} />
      <Txt v="small" color={C.muted} style={{ flex: 1 }}>
        {text}
      </Txt>
    </Row>
  );
}

/** Pops its content in once: it rises a little and settles with a soft overshoot. */
export function PopIn({ delay = 0, children, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.spring(progress, { toValue: 1, delay, stiffness: 170, damping: 16, mass: 0.9, useNativeDriver: nativeDriver });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
