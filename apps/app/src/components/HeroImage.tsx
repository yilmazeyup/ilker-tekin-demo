import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** A still of the falling hair behind the visit card; the opening already plays the clip, so home stays still. */
export function HeroImage({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#070D2C' }, style]}>
      <Image source={require('../../assets/hero-hair.jpg')} contentFit="cover" contentPosition={{ left: '62%', top: '30%' }} style={{ flex: 1 }} />
    </View>
  );
}
