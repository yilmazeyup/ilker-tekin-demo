import { CHROMA, clock as hhmm, countdown, serviceById, shortName, STEP_LABEL, type ServiceId } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, Glass, LiveDot, Row, Tag, Txt } from '../components/ui';
import { Chairs } from '../components/Widgets';
import { useDemo } from '../state/demo';
import { useFloor } from '../state/live';
import { C, fx, R } from '../theme';

const WALK_IN: ServiceId[] = ['heren', 'pony', 'fohnen', 'kinderen', 'dames-knippen'];

/** Feature 1: how busy it is, the wait, the next free chair, and the walk-in queue from your phone. */
export default function SalonNow() {
  const floor = useFloor();
  const { live, joinWalkIn, leaveWalkIn } = useDemo();
  const toast = useToast();
  const [service, setService] = useState<ServiceId>('heren');
  const busy = floor.busyLabel;
  const queuedAt = live.walkIn?.at.getTime() ?? 0;
  const left = live.walkIn ? Math.max(0, live.walkIn.wait * 60000 - (floor.now.getTime() - queuedAt)) : 0;
  const position = live.walkIn ? Math.max(1, floor.waiting.filter((w) => w.appt.walkIn).length + 1) : 0;

  return (
    <Screen back title="Nu in de salon" kicker={floor.demo ? 'Live · demotijd' : 'Live'}>
      <Glass style={{ gap: 18 }} pad={20}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8}>
            <LiveDot alert={busy === 'Vol'} />
            <Txt v="label" color={C.soft}>
              {hhmm(floor.now)} · {floor.staff.length} stylisten aan het werk
            </Txt>
          </Row>
        </Row>
        <Txt v="hero" size={50} ink={busy === 'Rustig' ? 'ijs' : busy === 'Gezellig druk' ? 'honing' : 'kers'}>
          {busy}
        </Txt>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(16,28,72,0.08)', overflow: 'hidden' }}>
          <View {...fx('dye-chroma')} style={{ width: `${Math.round(floor.busy * 100)}%`, height: 10, backgroundColor: C.blue }} />
        </View>
        <Chairs floor={floor} size={38} />
        <Row gap={10}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="label" color={C.muted} size={9}>
              Inloop
            </Txt>
            <Txt v="h2">± {floor.walkInWait} min</Txt>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="label" color={C.muted} size={9}>
              Eerste vrije stoel
            </Txt>
            <Txt v="h2">{floor.nextFree ? hhmm(floor.nextFree.at) : '—'}</Txt>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="label" color={C.muted} size={9}>
              Wachtend
            </Txt>
            <Txt v="h2">{floor.waiting.length + (live.walkIn ? 1 : 0)}</Txt>
          </View>
        </Row>
      </Glass>

      {live.walkIn ? (
        <Glass tint="kers" style={{ gap: 14 }} pad={20}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Tag label={`Nummer ${position} in de rij`} color="#140C10" bg={CHROMA.kers.stops[0]} />
            <Txt v="num" color={C.muted}>
              sinds {hhmm(live.walkIn.at)}
            </Txt>
          </Row>
          <Txt v="title">Je staat in de inloopwachtrij</Txt>
          <Row style={{ alignItems: 'flex-end' }} gap={8}>
            <Txt v="timer" size={58} ink="kers">
              {countdown(left)}
            </Txt>
            <Txt v="small" color={C.muted} style={{ marginBottom: 12 }}>
              tot je aan de beurt bent
            </Txt>
          </Row>
          <Txt v="body" color={C.soft}>
            {serviceById(live.walkIn.service).short}. Loop rustig naar de Poeijersstraat: we sturen een seintje als je stoel klaarstaat.
          </Txt>
          <Row gap={10}>
            <Button title="Route" icon="route" kind="cream" size="sm" onPress={() => router.push('/salon-info')} />
            <Button
              title="Uit de rij"
              icon="close"
              kind="glass"
              size="sm"
              onPress={() => {
                leaveWalkIn();
                toast('Je bent uit de wachtrij', { icon: 'door' });
              }}
            />
          </Row>
        </Glass>
      ) : (
        <Glass style={{ gap: 14 }} pad={20}>
          <Txt v="title">Kom je binnenlopen?</Txt>
          <Txt v="body" color={C.soft}>
            Kies wat je wilt en zet je vanaf je telefoon in de rij. De salon ziet je meteen op het scherm.
          </Txt>
          <Row gap={8} wrap>
            {WALK_IN.map((id) => (
              <Chip key={id} label={serviceById(id).short} on={service === id} onPress={() => setService(id)} chroma="kers" />
            ))}
          </Row>
          <Button
            title={`In de rij · ± ${floor.walkInWait} min`}
            icon="door"
            chroma="kers"
            full
            onPress={() => {
              joinWalkIn(service, floor.walkInWait);
              toast('Je staat in de rij', { text: `± ${floor.walkInWait} min. De salon ziet je nu.`, icon: 'door' });
            }}
          />
        </Glass>
      )}

      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          In de stoelen
        </Txt>
        {floor.chairs
          .filter((c) => c.stylist)
          .map((c) => (
            <View key={c.chair} {...fx('glass')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View {...fx(`dye-${c.stylist!.chroma}`)} style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA[c.stylist!.chroma].stops[1] }}>
                <Txt v="h3" color="#140C10" weight="800">
                  {c.chair + 1}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" size={15}>
                  {c.stylist!.name}
                </Txt>
                <Txt v="small" color={C.muted}>
                  {c.appt ? `${c.appt.member ? 'Jij' : shortName(c.appt.client.name)} · ${c.step ? STEP_LABEL[c.step.kind] : serviceById(c.appt.service).short}` : 'Stoel vrij'}
                </Txt>
              </View>
              <Txt v="num" size={13} color={c.appt ? C.soft : C.ok}>
                {c.appt ? `vrij ${c.freeAt ? hhmm(c.freeAt) : '—'}` : 'nu'}
              </Txt>
            </View>
          ))}
      </View>
      <Row gap={8} style={{ alignItems: 'flex-start' }}>
        <Icon name="info" size={15} color={C.muted} />
        <Txt v="small" color={C.muted} style={{ flex: 1 }}>
          Namen staan nooit voluit in de app. De drukte komt uit de agenda van de salon. Demo: fictieve klanten.
        </Txt>
      </Row>
    </Screen>
  );
}
