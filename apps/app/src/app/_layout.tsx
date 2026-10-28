import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Intro } from '../components/Intro';
import { ToastProvider } from '../components/Toast';
import { DemoProvider } from '../state/demo';
import { C } from '../theme';
import { installWebStyles } from '../web/css';

installWebStyles();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // The opening plays each time the app starts; on the web ?intro=0 skips it (for screenshots and deep links).
  const [intro, setIntro] = useState(() => !(Platform.OS === 'web' && new URLSearchParams(globalThis.location?.search ?? '').get('intro') === '0'));
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <DemoProvider>
        <ToastProvider>
          <View style={{ flex: 1, backgroundColor: C.night }}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.night }, animation: 'slide_from_right' }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
            {intro ? <Intro onDone={() => setIntro(false)} /> : null}
          </View>
        </ToastProvider>
      </DemoProvider>
    </SafeAreaProvider>
  );
}
