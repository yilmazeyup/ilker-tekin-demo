import { CARE, CHROMA, type CareId } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, Glass, Press, Row, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { C, PAD, R } from '../theme';

const ORDER: CareId[] = ['kleur', 'blond', 'keratine', 'knippen', 'olaplex', 'permanent', 'extensions', 'styling'];
const NAMES: Record<CareId, string> = {
  kleur: 'Kleur',
  blond: 'Blond & highlights',
  keratine: 'Keratine',
  knippen: 'Knippen',
  olaplex: 'Olaplex',
  permanent: 'Permanent',
  extensions: 'Extensions',
  styling: 'Styling',
};

const when = (hours: number) => (hours < 24 ? `Na ${hours} uur` : hours < 24 * 14 ? `Na ${Math.round(hours / 24)} dagen` : `Na ${Math.round(hours / 24 / 7)} weken`);

/** Feature 13: aftercare per treatment, what to do and not to do, with reminders that follow the visit. */
export default function Aftercare() {
  const params = useLocalSearchParams<{ care?: string }>();
  const [care, setCare] = useState<CareId>((params.care as CareId) ?? 'kleur');
  const { reminders, toggleReminder } = useDemo();
  const toast = useToast();
  const c = CARE[care];
  const on = reminders.includes(care);
  return (
    <Screen back title="Nazorg" kicker="Per behandeling">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
        {ORDER.map((id) => (
          <Chip key={id} label={NAMES[id]} on={care === id} chroma="ijs" onPress={() => setCare(id)} />
        ))}
      </ScrollView>
      <Glass tint="ijs" style={{ gap: 10 }} pad={20}>
        <Txt v="title">{c.title}</Txt>
        <Txt v="body" color={C.soft}>
          {c.intro}
        </Txt>
      </Glass>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <Glass style={{ flex: 1, gap: 10 }}>
          <Txt v="label" color={C.ok}>
            Wel
          </Txt>
          {c.dos.map((d) => (
            <Row key={d} gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon name="check" size={15} color={C.ok} />
              <Txt v="small" style={{ flex: 1 }}>
                {d}
              </Txt>
            </Row>
          ))}
        </Glass>
        <Glass style={{ flex: 1, gap: 10 }}>
          <Txt v="label" color="#FF8A93">
            Niet
          </Txt>
          {c.donts.map((d) => (
            <Row key={d} gap={8} style={{ alignItems: 'flex-start' }}>
              <Icon name="close" size={15} color="#FF8A93" />
              <Txt v="small" style={{ flex: 1 }}>
                {d}
              </Txt>
            </Row>
          ))}
        </Glass>
      </Row>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Herinneringen na je afspraak
        </Txt>
        {c.reminders.map((r) => (
          <Row key={r.title} gap={14} style={{ padding: 14, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.05)', alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA.ijs.stops[2] }}>
              <Icon name="bell" size={18} color={C.white} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="label" color={C.muted} size={9}>
                {when(r.afterHours)}
              </Txt>
              <Txt v="h3">{r.title}</Txt>
              <Txt v="small" color={C.soft}>
                {r.text}
              </Txt>
            </View>
          </Row>
        ))}
      </View>
      <Press
        onPress={() => {
          toggleReminder(care);
          if (!on) toast('Herinneringen staan aan', { text: `${c.reminders.length} seintjes na je ${NAMES[care].toLowerCase()}-afspraak.`, icon: 'bell' });
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        fxNames="glass"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}
      >
        <View style={{ flex: 1 }}>
          <Txt v="h3">Herinneringen voor {NAMES[care].toLowerCase()}</Txt>
          <Txt v="small" color={C.muted}>
            Als melding op je telefoon
          </Txt>
        </View>
        <View style={{ width: 52, height: 30, borderRadius: 15, padding: 3, backgroundColor: on ? C.ok : 'rgba(16,28,72,0.15)', alignItems: on ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
        </View>
      </Press>
      <Button title="Producten voor thuis" icon="bag" kind="glass" full onPress={() => router.push('/shop')} />
    </Screen>
  );
}
