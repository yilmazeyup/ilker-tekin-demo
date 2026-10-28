import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** Natively a still of the falling hair; the web plays the loop. */
export function HeroVideo({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#070D2C' }, style]}>
      <Image source={require('../../assets/hero-hair.jpg')} contentFit="cover" style={{ flex: 1 }} />
    </View>
  );
}
