import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { LiveIsland } from '../../components/LiveIsland';
import { TabBar } from '../../components/TabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, fx, isWeb } from '../../theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.night }, animation: 'fade' }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="looks" />
        <Tabs.Screen name="boeken" />
        <Tabs.Screen name="shop" />
        <Tabs.Screen name="ik" />
      </Tabs>
      <View
        pointerEvents="none"
        {...fx('glass-edge')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 62, backgroundColor: isWeb ? 'transparent' : 'rgba(255,255,255,0.94)' }}
      />
      <LiveIsland />
    </View>
  );
}
