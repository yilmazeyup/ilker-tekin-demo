import { Image } from 'expo-image';
import { View } from 'react-native';

import { C, R } from '../theme';
import { Icon } from './Icon';
import { Press, Txt } from './ui';

type Props = { label: string; value: string | null; onChange: (uri: string | null) => void; height?: number; capture?: 'user' | 'environment'; max?: number };

/** Natively the camera needs expo-image-picker; until it is added the demo uses the intro still as a sample photo. */
export function PhotoPicker({ label, value, onChange, height = 200 }: Props) {
  return (
    <Press
      onPress={() => onChange(value ? null : 'sample')}
      accessibilityLabel={label}
      style={{ height, borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(16,28,72,0.22)', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' }}
    >
      {value ? (
        <Image source={require('../../assets/intro/poster-portrait.jpg')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />
      ) : (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Icon name="camera" size={28} color={C.soft} />
          <Txt v="h3" size={15} color={C.soft}>
            {label}
          </Txt>
        </View>
      )}
    </Press>
  );
}

PhotoPicker.Preview = function Preview({ uri }: { uri: string }) {
  return <Image source={uri === 'sample' ? require('../../assets/intro/poster-portrait.jpg') : { uri }} style={{ flex: 1 }} contentFit="cover" />;
};

export const shrink = async (_file: unknown): Promise<string> => 'sample';
