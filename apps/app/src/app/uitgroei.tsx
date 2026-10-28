import { addDays, CHROMA, dateLong, dayShort, decimal, firstSlot, clock as hhmm, minutesFor, serviceById, stylistById } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { regrowth } from '../components/Widgets';
import { useClock } from '../state/clock';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, R } from '../theme';

/** Feature 6: how far your colour has grown out (about 1.25 cm a month) and when to book, with the same colourist. */
export default function Regrowth() {
  const { now } = useClock();
  const v = useVisit();
  const { bookings, reminders, toggleReminder } = useDemo();
  const toast = useToast();
  const r = regrowth(now);
  const doneToday = v.phase === 'done' && v.appt.service === 'uitgroei';
  const cm = doneToday ? 0 : r.cm;
  const nextDue = doneToday ? addDays(now, r.due) : r.dueDate ?? now;
  const slot = firstSlot('uitgroei', minutesFor('uitgroei'), 'selin', nextDue < now ? now : addDays(nextDue, -3), bookings);
  const scale = [0, 0.5, 1, 1.5, 2, 2.5];
  const on = reminders.includes('uitgroei');

  return (
    <Screen back title="Uitgroeiwekker" kicker="Je kleur, bijgehouden">
      <Glass style={{ gap: 18 }} pad={22} tint="honing">
        <Row style={{ alignItems: 'flex-end' }} gap={8}>
          <Txt v="hero" size={84} ink="honing">
            {decimal(cm)}
          </Txt>
          <Txt v="title" color={C.soft} style={{ marginBottom: 14 }}>
            cm
          </Txt>
        </Row>
        <Txt v="body" color={C.soft}>
          {doneToday
            ? 'Vandaag bijgewerkt: je kleur loopt weer gelijk vanaf de wortel.'
            : `Sinds je ${serviceById(r.last?.service ?? 'uitgroei').short.toLowerCase()} op ${r.last ? dateLong(r.last.date) : ''} is je haar ongeveer ${decimal(cm)} cm gegroeid.`}
        </Txt>
        <View style={{ gap: 6 }}>
          <View style={{ height: 70, borderRadius: R.md, overflow: 'hidden', flexDirection: 'row' }}>
            <View {...fx('dye-mocha')} style={{ width: `${Math.min(100, (cm / 2.5) * 100)}%`, backgroundColor: CHROMA.mocha.stops[2] }} />
            <View {...fx('dye-koper')} style={{ flex: 1, backgroundColor: CHROMA.koper.stops[1] }} />
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            {scale.map((s) => (
              <Txt key={s} v="num" size={11} color={C.muted}>
                {decimal(s, Number.isInteger(s) ? 0 : 1)}
              </Txt>
            ))}
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="small" color={C.muted}>
              Uitgroei
            </Txt>
            <Txt v="small" color={C.muted}>
              Je kleur
            </Txt>
          </Row>
        </View>
      </Glass>
      <Glass style={{ gap: 12 }}>
        <Txt v="label" color={C.muted}>
          Advies
        </Txt>
        <Txt v="h2">{doneToday ? `Volgende keer rond ${dayShort(nextDue)}` : cm >= 1.4 ? 'Tijd om bij te werken' : `Rond ${dayShort(nextDue)} is het tijd`}</Txt>
        <Txt v="body" color={C.soft}>
          Bij jouw kleur zien we de uitgroei na ongeveer {Math.round(r.due / 7)} weken. Selin heeft je formule, dus je kleur blijft precies hetzelfde.
        </Txt>
        {slot ? (
          <Press
            onPress={() => router.push({ pathname: '/boek/[id]', params: { id: 'uitgroei', stylist: 'selin' } })}
            fxNames="glass"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}
          >
            <View style={{ flex: 1 }}>
              <Txt v="label" color={C.muted} size={9}>
                Eerste plek bij {stylistById('selin').name}
              </Txt>
              <Txt v="h3">
                {dayShort(slot.start)} · {hhmm(slot.start)}
              </Txt>
            </View>
            <Tag label="Uitgroei kleuren · € 50" color="#140C10" bg={CHROMA.honing.stops[0]} />
          </Press>
        ) : null}
        <Button title="Boek uitgroei kleuren" icon="scissors" chroma="honing" full onPress={() => router.push({ pathname: '/boek/[id]', params: { id: 'uitgroei', stylist: 'selin' } })} />
      </Glass>
      <Press
        onPress={() => {
          toggleReminder('uitgroei');
          if (!on) toast('Wekker staat aan', { text: 'Je krijgt een seintje als je uitgroei 1,5 cm is.', icon: 'bell' });
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        fxNames="glass"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}
      >
        <View style={{ flex: 1 }}>
          <Txt v="h3">Seintje bij 1,5 cm</Txt>
          <Txt v="small" color={C.muted}>
            Een melding met een plek bij Selin erbij
          </Txt>
        </View>
        <View style={{ width: 52, height: 30, borderRadius: 15, padding: 3, backgroundColor: on ? C.ok : 'rgba(16,28,72,0.15)', alignItems: on ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
        </View>
      </Press>
    </Screen>
  );
}
