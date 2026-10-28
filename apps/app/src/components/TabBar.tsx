import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, fx, isWeb, MAX_WIDTH } from '../theme';
import { Icon, type IconName } from './Icon';
import { Press, Txt } from './ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  looks: { label: 'Looks', icon: 'sparkle' },
  shop: { label: 'Shop', icon: 'bag' },
  ik: { label: 'Ik', icon: 'user' },
};

/**
 * A floating capsule of liquid glass with "Book now" raised in the middle, in English like on the salon's own site.
 */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TABS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);
  const item = (route: (typeof routes)[number]) => {
    const tab = TABS[route.name];
    const index = state.routes.indexOf(route);
    const focused = state.index === index;
    return (
      <Press
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        scaleTo={0.88}
        onPress={() => {
          if (!focused) navigateToTab(route.key);
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: 64 }}
      >
        <Icon name={tab.icon} size={22} color={focused ? C.text : C.muted} stroke={focused ? 2 : 1.7} />
        <Txt v="label" size={9} color={focused ? C.text : C.muted} {...(focused ? fx('ink-chroma') : {})}>
          {tab.label}
        </Txt>
      </Press>
    );
  };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 12) + 4, alignItems: 'center' }}>
      <View
        {...fx('glass-strong')}
        style={{
          width: '92%',
          maxWidth: MAX_WIDTH - 40,
          height: 68,
          borderRadius: 34,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          borderWidth: 1,
          borderColor: 'rgba(16,28,72,0.14)',
          backgroundColor: isWeb ? 'rgba(255,255,255,0.72)' : '#FFFFFF',
        }}
      >
        {left.map(item)}
        <Press
          accessibilityLabel="Book now"
          accessibilityRole="tab"
          accessibilityState={{ selected: state.routes[state.index]?.name === 'boeken' }}
          scaleTo={0.92}
          onPress={() => {
            const book = state.routes.find((r) => r.name === 'boeken');
            if (book) navigateToTab(book.key);
          }}
          fxNames="dye-chroma sheen"
          style={{
            height: 52,
            paddingHorizontal: 16,
            marginHorizontal: 4,
            borderRadius: 26,
            backgroundColor: C.blue,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            transform: [{ translateY: -2 }],
          }}
        >
          <Icon name="scissors" size={18} color="#FFFFFF" stroke={2} />
          <Txt v="h3" size={15} color="#FFFFFF" weight="700">
            Book now
          </Txt>
        </Press>
        {right.map(item)}
      </View>
    </View>
  );
}
