import { useRef } from 'react';
import { View } from 'react-native';

import { C, R } from '../theme';
import { Icon } from './Icon';
import { Press, Txt } from './ui';

type Props = { label: string; value: string | null; onChange: (uri: string | null) => void; height?: number; capture?: 'user' | 'environment'; max?: number };

/** Shrinks a photo to at most `max` pixels on its long side, as a JPEG data URL: small enough to share with the salon. */
export function shrink(file: Blob, max = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Pick or take a photo. It stays in this browser; nothing is uploaded. */
export function PhotoPicker({ label, value, onChange, height = 200, capture, max = 720 }: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture={capture}
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onChange(await shrink(file, max));
          e.target.value = '';
        }}
      />
      {value ? (
        <View style={{ height, borderRadius: R.md, overflow: 'hidden' }}>
          <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 }}>
            <Press onPress={() => input.current?.click()} accessibilityLabel="Andere foto" style={{ height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(6,11,34,0.7)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="camera" size={15} color="#FFFFFF" />
              <Txt v="small" weight="600" color="#FFFFFF">
                Andere
              </Txt>
            </Press>
            <Press onPress={() => onChange(null)} accessibilityLabel="Foto weghalen" style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(6,11,34,0.7)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash" size={15} color="#FFFFFF" />
            </Press>
          </View>
        </View>
      ) : (
        <Press
          onPress={() => input.current?.click()}
          accessibilityLabel={label}
          style={{ height, borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(16,28,72,0.22)', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(16,28,72,0.03)' }}
        >
          <Icon name="camera" size={28} color={C.soft} />
          <Txt v="h3" size={15} color={C.soft}>
            {label}
          </Txt>
          <Txt v="small" color={C.muted}>
            Camera of fotobibliotheek
          </Txt>
        </Press>
      )}
    </View>
  );
}

PhotoPicker.Preview = function Preview({ uri }: { uri: string }) {
  return <img src={uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
};
