import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, fx, MAX_WIDTH, PAD } from '../theme';
import { IconButton, Txt } from './ui';

/** The dark page with its slow colour ribbons and a touch of grain, behind every screen. */
export function Backdrop({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View pointerEvents="none" {...fx('aurora grain')} style={[StyleSheet.absoluteFill, { backgroundColor: C.night }, style]} />;
}

type ScreenProps = PropsWithChildren<{
  title?: string;
  kicker?: string;
  /** Shows a back button; on a fresh deep link with no history it goes home. */
  back?: boolean;
  right?: ReactNode;
  /** Inside the tabs: room at the bottom for the tab bar. */
  tabs?: boolean;
  /** Full-bleed content above the padded column. */
  hero?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}>;

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function Screen({ title, kicker, back, right, tabs, hero, scroll = true, contentStyle, footer, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const header =
    title || back || right ? (
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: PAD, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          {back ? <IconButton name="back" label="Terug" onPress={goBack} /> : <View />}
          {right ?? <View />}
        </View>
        {title ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            {kicker ? (
              <Txt v="label" color={C.muted}>
                {kicker}
              </Txt>
            ) : null}
            <Txt v="display">{title}</Txt>
          </View>
        ) : null}
      </View>
    ) : null;

  const body = (
    <View style={[{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }]}>
      {header}
      {hero}
      <View style={[{ paddingHorizontal: PAD, paddingTop: 18, gap: 18 }, contentStyle]}>{children}</View>
      <View style={{ height: (tabs ? 128 : 48) + insets.bottom + (footer ? 84 : 0) }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Backdrop />
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
      {footer ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 14, paddingTop: 14, paddingHorizontal: PAD, alignItems: 'center' }}
        >
          <View {...fx('glass-strong')} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.72)', borderTopWidth: 1, borderColor: 'rgba(16,28,72,0.08)' }} />
          <View style={{ width: '100%', maxWidth: MAX_WIDTH - PAD * 2 }}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}
