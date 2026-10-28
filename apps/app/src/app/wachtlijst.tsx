import { clock as hhmm, dayLong, SERVICES, serviceById, STYLISTS, stylistById, type ServiceId, type StylistId } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, DemoNote, Glass, LiveDot, Row, Tag, Txt } from '../components/ui';
import { useDemo, type WaitEntry } from '../state/demo';
import { C, PAD } from '../theme';

const PARTS: WaitEntry['part'][] = ['ochtend', 'middag', 'hele dag'];

/** Feature 8: a waitlist for an earlier slot. In the demo a place opens up a few seconds after you join. */
export default function Waitlist() {
  const { waitlist, joinWaitlist, acceptOffer } = useDemo();
  const toast = useToast();
  const [service, setService] = useState<ServiceId>('uitgroei');
  const [stylist, setStylist] = useState<StylistId | 'any'>('any');
  const [part, setPart] = useState<WaitEntry['part']>('hele dag');
  const popular = SERVICES.filter((s) => s.popular || s.id === 'toner' || s.id === 'olaplex');

  return (
    <Screen back title="Wachtlijst" kicker="Eerder terecht">
      <Txt v="body" color={C.soft}>
        Zegt iemand af, dan krijg jij als eerste de plek. Je hebt 15 minuten om hem te pakken.
      </Txt>
      {waitlist.map((w) => (
        <Glass key={w.id} tint={w.status === 'aanbod' ? 'kers' : undefined} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={8}>
              {w.status === 'wacht' ? <LiveDot /> : w.status === 'aanbod' ? <LiveDot alert /> : <Icon name="check" size={16} color={C.ok} />}
              <Txt v="label" color={C.soft}>
                {w.status === 'wacht' ? 'We houden het in de gaten' : w.status === 'aanbod' ? 'Plek vrijgekomen' : 'Geboekt'}
              </Txt>
            </Row>
            <Tag label={`${w.part}`} />
          </Row>
          <Txt v="h2">{serviceById(w.service).short}</Txt>
          <Txt v="small" color={C.muted}>
            {w.stylist === 'any' ? 'Bij iedereen' : `Bij ${stylistById(w.stylist).name}`}
          </Txt>
          {w.status === 'aanbod' && w.offer ? (
            <View style={{ gap: 10 }}>
              <Txt v="title" size={26}>
                {dayLong(w.offer.start)} · {hhmm(w.offer.start)}
              </Txt>
              <Txt v="body" color={C.soft}>
                Bij {stylistById(w.offer.stylist).name}. Iemand heeft afgezegd.
              </Txt>
              <Button
                title="Pak deze plek"
                icon="check"
                chroma="kers"
                full
                onPress={() => {
                  const id = acceptOffer(w.id);
                  if (id) router.push({ pathname: '/bevestiging/[id]', params: { id } });
                }}
              />
            </View>
          ) : null}
        </Glass>
      ))}
      <Glass style={{ gap: 14 }}>
        <Txt v="h3">Zet me op de lijst</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
          {popular.map((s) => (
            <Chip key={s.id} label={s.short} on={service === s.id} chroma="violet" onPress={() => setService(s.id)} />
          ))}
        </ScrollView>
        <Row gap={8} wrap>
          <Chip label="Iedereen" on={stylist === 'any'} onPress={() => setStylist('any')} />
          {STYLISTS.map((s) => (
            <Chip key={s.id} label={s.name.split(' ')[0]} on={stylist === s.id} chroma={s.chroma} onPress={() => setStylist(s.id)} />
          ))}
        </Row>
        <Row gap={8}>
          {PARTS.map((p) => (
            <Chip key={p} label={p} on={part === p} onPress={() => setPart(p)} />
          ))}
        </Row>
        <Button
          title="Op de wachtlijst"
          icon="list"
          chroma="violet"
          full
          onPress={() => {
            joinWaitlist({ service, stylist, part });
            toast('Je staat op de wachtlijst', { text: 'We laten het meteen weten als er iets vrijkomt.', icon: 'list' });
          }}
        />
      </Glass>
      <View style={{ paddingHorizontal: PAD * 0 }}>

      </View>
    </Screen>
  );
}
