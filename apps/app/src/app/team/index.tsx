import { CHROMA, looksBy, STYLISTS } from '@ilker/shared';
import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { HairArt } from '../../components/HairArt';
import { Screen } from '../../components/Screen';
import { Press, Row, Tag, Txt } from '../../components/ui';
import { C, MAX_WIDTH, PAD, R } from '../../theme';

/** Feature 19: the team and their portfolios. İlker is shown only with what his own site says; the others are fictional. */
export default function Team() {
  const { width } = useWindowDimensions();
  const w = (Math.min(width, MAX_WIDTH) - PAD * 2 - 12) / 2;
  return (
    <Screen back title="Het team" kicker="Portfolio's">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {STYLISTS.map((s) => {
          const look = looksBy(s.id)[0];
          const colours = look ? look.colours : (CHROMA[s.chroma].stops.slice().reverse() as unknown as [string, string, string]);
          return (
            <Press key={s.id} onPress={() => router.push({ pathname: '/team/[id]', params: { id: s.id } })} style={{ width: s.real ? '100%' : w, gap: 8 }}>
              <View style={{ height: s.real ? 260 : w * 1.3, borderRadius: R.lg, overflow: 'hidden' }}>
                <HairArt colours={colours} texture={look?.texture ?? 'waves'} seed={`team-${s.id}`} style={{ flex: 1 }} />
                <View style={{ position: 'absolute', left: 12, top: 12 }}>
                  <Tag label={s.real ? 'De salon draagt zijn naam' : `${s.years} jaar ervaring`} color="#140C10" bg={CHROMA[s.chroma].stops[0]} />
                </View>
              </View>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Txt v={s.real ? 'title' : 'h3'}>{s.name}</Txt>
                  <Txt v="small" color={C.muted}>
                    {s.role}
                  </Txt>
                </View>
              </Row>
            </Press>
          );
        })}
      </View>
      <Txt v="small" color={C.faint}>
        İlker Tekin is de naamgever van de salon. Selin, Noor, Daan en Lina zijn fictieve stylisten voor deze demo; hun portfolio's zijn 3D-renders.
      </Txt>
    </Screen>
  );
}
