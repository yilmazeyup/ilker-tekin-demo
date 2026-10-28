import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** Thirty stock portraits with hair of every colour and texture (free Unsplash photos; see assets/hero/CREDITS.md). */
const PHOTOS = [
  require('../../assets/hero/01.jpg'),
  require('../../assets/hero/02.jpg'),
  require('../../assets/hero/03.jpg'),
  require('../../assets/hero/04.jpg'),
  require('../../assets/hero/05.jpg'),
  require('../../assets/hero/06.jpg'),
  require('../../assets/hero/07.jpg'),
  require('../../assets/hero/08.jpg'),
  require('../../assets/hero/09.jpg'),
  require('../../assets/hero/10.jpg'),
  require('../../assets/hero/11.jpg'),
  require('../../assets/hero/12.jpg'),
  require('../../assets/hero/13.jpg'),
  require('../../assets/hero/14.jpg'),
  require('../../assets/hero/15.jpg'),
  require('../../assets/hero/16.jpg'),
  require('../../assets/hero/17.jpg'),
  require('../../assets/hero/18.jpg'),
  require('../../assets/hero/19.jpg'),
  require('../../assets/hero/20.jpg'),
  require('../../assets/hero/21.jpg'),
  require('../../assets/hero/22.jpg'),
  require('../../assets/hero/23.jpg'),
  require('../../assets/hero/24.jpg'),
  require('../../assets/hero/25.jpg'),
  require('../../assets/hero/26.jpg'),
  require('../../assets/hero/27.jpg'),
  require('../../assets/hero/28.jpg'),
  require('../../assets/hero/29.jpg'),
  require('../../assets/hero/30.jpg'),
];

/** Picked once when the app starts, so each opening shows someone else. */
const PICK = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];

/** A portrait behind the visit card; the opening already plays the hair clip, so home stays still. */
export function HeroImage({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#070D2C' }, style]}>
      <Image source={PICK} contentFit="cover" contentPosition={{ left: '50%', top: '25%' }} style={{ flex: 1 }} />
    </View>
  );
}
