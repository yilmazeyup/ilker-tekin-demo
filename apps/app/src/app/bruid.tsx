import { addDays, CHROMA, dateLong, euro, LOOKS, monthShort, optionOf, PACKAGES, serviceById, trialDate, weekdayShort } from '@ilker/shared';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { HairArt } from '../components/HairArt';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, DemoNote, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useClock } from '../state/clock';
import { C, fx, PAD, R } from '../theme';

/** Feature 14: bridal and event packages, made of the salon's own treatments, planned back from the big day with a trial. */
export default function Bridal() {
  const { now } = useClock();
  const toast = useToast();
  const [pkgId, setPkgId] = useState(PACKAGES[0].id);
  const [guests, setGuests] = useState(3);
  const days = useMemo(() => Array.from({ length: 16 }, (_, i) => addDays(now, 42 + i * 7)), [now.toDateString()]);
  const [eventDay, setEventDay] = useState(days[4]);
  const pkg = PACKAGES.find((p) => p.id === pkgId)!;
  const trial = trialDate(eventDay, now);
  const total = pkg.parts.reduce((s, p) => s + optionOf(serviceById(p.service), p.optionId).price, 0) * (pkg.perGuest ? guests : 1);
  const look = LOOKS.find((l) => l.id === 'bridal-chignon')!;

  return (
    <Screen
      back
      hero={
        <View style={{ height: 280, marginTop: 14, marginHorizontal: PAD, borderRadius: R.xl, overflow: 'hidden' }}>
          <HairArt colours={look.colours} texture="updo" seed="bridal-hero" animate style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <View style={{ position: 'absolute', left: 20, bottom: 18, gap: 6 }}>
            <Tag label="Bruid & events" color="#140C10" bg={CHROMA.honing.stops[0]} />
            <Txt v="display" size={40} color={C.white}>
              Jouw grote dag
            </Txt>
          </View>
        </View>
      }
    >
      <Txt v="body" color={C.soft}>
        Pakketten uit het menu van de salon: je betaalt wat de behandelingen kosten, met een proefkapsel vier à vijf weken ervoor.
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
        {PACKAGES.map((p) => {
          const on = p.id === pkgId;
          return (
            <Press
              key={p.id}
              onPress={() => setPkgId(p.id)}
              accessibilityState={{ selected: on }}
              fxNames={on ? '' : 'glass'}
              style={{ width: 200, padding: 16, gap: 8, borderRadius: R.lg, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(16,28,72,0.12)', backgroundColor: on ? C.blue : 'transparent' }}
            >
              <Txt v="h3" color={on ? '#FFFFFF' : C.text}>
                {p.name}
              </Txt>
              <Txt v="small" color={on ? 'rgba(255,255,255,0.8)' : C.muted} numberOfLines={3}>
                {p.line}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Wanneer is de dag?
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
          {days.map((d) => {
            const on = d.toDateString() === eventDay.toDateString();
            return (
              <Press
                key={d.toISOString()}
                onPress={() => setEventDay(d)}
                accessibilityState={{ selected: on }}
                style={{ width: 70, height: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.blue : 'rgba(16,28,72,0.06)' }}
              >
                <Txt v="label" size={9} color={on ? '#FFFFFF' : C.muted}>
                  {weekdayShort(d)}
                </Txt>
                <Txt v="h2" color={on ? '#FFFFFF' : C.text}>
                  {d.getDate()}
                </Txt>
                <Txt v="small" size={10} color={on ? 'rgba(255,255,255,0.8)' : C.muted}>
                  {monthShort(d)}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
      </View>
      {pkg.perGuest ? (
        <Row gap={8}>
          <Txt v="h3" style={{ flex: 1 }}>
            Aantal personen
          </Txt>
          {[2, 3, 4, 6].map((g) => (
            <Chip key={g} label={`${g}`} on={guests === g} onPress={() => setGuests(g)} chroma="roze" />
          ))}
        </Row>
      ) : null}
      <Glass tint={pkg.chroma} style={{ gap: 4 }} pad={18}>
        <Txt v="label" color={C.muted} style={{ marginBottom: 8 }}>
          Je planning
        </Txt>
        {pkg.parts.map((part, i) => {
          const service = serviceById(part.service);
          const date = part.when.startsWith('4') ? trial : part.when.startsWith('1') ? addDays(eventDay, -7) : part.when === 'Na het boeken' ? addDays(now, 3) : eventDay;
          return (
            <Row key={i} gap={12} style={{ paddingVertical: 10, borderBottomWidth: i < pkg.parts.length - 1 ? 1 : 0, borderColor: 'rgba(16,28,72,0.08)' }}>
              <View {...fx(`dye-${pkg.chroma}`)} style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA[pkg.chroma].stops[1] }}>
                <Icon name={part.label.startsWith('Proef') ? 'eye' : part.service === 'opsteken' ? 'rings' : part.service === 'advies' ? 'chat' : 'sparkle'} size={16} color="#140C10" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" size={15}>
                  {part.label}
                </Txt>
                <Txt v="small" color={C.muted}>
                  {part.when} · {dateLong(date)}
                </Txt>
              </View>
              <Txt v="num" size={13}>
                {service.from ? 'v.a. ' : ''}
                {euro(optionOf(service, part.optionId).price)}
              </Txt>
            </Row>
          );
        })}
        <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <Txt v="h3">Totaal{pkg.perGuest ? ` voor ${guests}` : ''}</Txt>
          <Txt v="title" size={28} ink={pkg.chroma}>
            {pkg.parts.some((p) => serviceById(p.service).from) ? 'v.a. ' : ''}
            {euro(total)}
          </Txt>
        </Row>
      </Glass>
      <Button
        title="Plan het proefkapsel"
        icon="calendar"
        size="lg"
        full
        chroma={pkg.chroma}
        onPress={() => toast('Aanvraag verstuurd', { text: `Proefkapsel rond ${dateLong(trial)}. De salon belt je om het te bevestigen. (demo)`, icon: 'rings' })}
      />
      <DemoNote text="De pakketten zijn een voorbeeld, gemaakt van de behandelingen en prijzen op het menu van de salon." />
    </Screen>
  );
}
