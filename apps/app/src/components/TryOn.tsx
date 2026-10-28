import type { Look } from '@ilker/shared';
import { View } from 'react-native';

import { C, R } from '../theme';
import { Txt } from './ui';

export type TryOnProps = { looks: Look[]; initialLook?: string; onSave: (lookId: string) => void; onBook: (look: Look) => void };

/** The fitting room runs its AI in the browser; natively it needs the camera module, so the demo shows it on the web. */
export function TryOn(_: TryOnProps) {
  return (
    <View style={{ padding: 20, borderRadius: R.lg, backgroundColor: 'rgba(16,28,72,0.06)', gap: 8 }}>
      <Txt v="h3">Kleur en kapsel passen</Txt>
      <Txt v="body" color={C.soft}>
        Deze pasruimte draait in de webversie van de demo, met de AI in je browser.
      </Txt>
    </View>
  );
}
