import { CHROMA, FEATURES } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '../components/Screen';
import { Press, Row, Txt } from '../components/ui';
import { C, fx, R } from '../theme';

/** The twenty things the app adds to the salon's site, each one tappable. */
export default function New() {
  return (
    <Screen back title="Twintig keer nieuw" kicker="Wat de site nog niet kan">
      <Txt v="body" color={C.soft}>
        Alles wat ilkertekinhairstylist.nl al doet zit erin: het menu met prijzen, Book now, openingstijden en contact. Dit komt erbij.
      </Txt>
      <View style={{ gap: 10 }}>
        {FEATURES.map((f) => (
          <Press
            key={f.id}
            onPress={() => router.push(f.path as never)}
            fxNames="glass lift"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(16,28,72,0.1)' }}
          >
            <View {...fx(`dye-${f.chroma}`)} style={{ width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA[f.chroma].stops[1] }}>
              <Txt v="title" size={26} color="#140C10">
                {String(f.no).padStart(2, '0')}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="h3" size={17}>
                {f.title}
              </Txt>
              <Txt v="small" color={C.muted}>
                {f.line}
              </Txt>
            </View>
          </Press>
        ))}
      </View>
      <Row style={{ justifyContent: 'center' }}>
        <Txt v="small" color={C.faint}>
          Demo · fictieve klanten en team
        </Txt>
      </Row>
    </Screen>
  );
}
