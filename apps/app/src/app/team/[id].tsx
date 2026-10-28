import { CHROMA, firstSlot, clock as hhmm, dayShort, looksBy, minutesFor, priceLabel, SALON, serviceById, SERVICES, stylistById, worksOn, weekdayShort, type StylistId } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, useWindowDimensions, View } from 'react-native';

import { HairArt } from '../../components/HairArt';
import { Screen } from '../../components/Screen';
import { Button, Glass, Press, Row, Tag, Txt } from '../../components/ui';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { C, MAX_WIDTH, PAD, R } from '../../theme';

export default function Stylist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = stylistById((id ?? 'selin') as StylistId);
  const { now } = useClock();
  const { bookings } = useDemo();
  const { width } = useWindowDimensions();
  const looks = looksBy(s.id);
  const w = (Math.min(width, MAX_WIDTH) - PAD * 2 - 12) / 2;
  const signature = SERVICES.find((x) => x.category === s.specialties[0] && !s.skips.includes(x.id)) ?? SERVICES[0];
  const slot = firstSlot(signature.id, minutesFor(signature.id), s.id, now, bookings);
  const week = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const day = new Date(now);
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + d);
    return day;
  });
  const colours = looks[0]?.colours ?? (CHROMA[s.chroma].stops.slice().reverse() as unknown as [string, string, string]);

  return (
    <Screen
      back
      hero={
        <View style={{ height: 320, marginTop: 14, marginHorizontal: PAD, borderRadius: R.xl, overflow: 'hidden' }}>
          <HairArt colours={colours} texture={looks[0]?.texture ?? 'waves'} seed={`team-${s.id}`} animate style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <View style={{ position: 'absolute', left: 20, bottom: 18, gap: 6 }}>
            <Tag label={s.role} color="#140C10" bg={CHROMA[s.chroma].stops[0]} />
            <Txt v="display" size={44} color={C.white}>
              {s.name}
            </Txt>
          </View>
        </View>
      }
    >
      {s.real ? (
        <Glass style={{ gap: 10 }}>
          <Txt v="body" color={C.soft}>
            De salon draagt zijn naam: {SALON.fullName}. Zijn eigen werk staat op Instagram.
          </Txt>
          <Button title={SALON.instagramHandle} icon="instagram" kind="glass" onPress={() => Linking.openURL(SALON.instagram)} />
        </Glass>
      ) : (
        <Txt v="quote" color={C.soft}>
          “{s.bio}”
        </Txt>
      )}
      <Row gap={6}>
        {week.map((d) => {
          const on = worksOn(s, d);
          return (
            <View key={d.toISOString()} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: on ? 'rgba(16,28,72,0.08)' : 'transparent' }}>
              <Txt v="label" size={9} color={on ? C.text : C.faint}>
                {weekdayShort(d)}
              </Txt>
              <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, backgroundColor: on ? CHROMA[s.chroma].stops[1] : 'transparent' }} />
            </View>
          );
        })}
      </Row>
      {slot ? (
        <Glass tint={s.chroma} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt v="label" color={C.muted} size={9}>
              Eerst vrij · {signature.short}
            </Txt>
            <Txt v="h2" size={19}>
              {dayShort(slot.start)} · {hhmm(slot.start)}
            </Txt>
          </View>
          <Button title="Boek" icon="scissors" size="sm" chroma={s.chroma} onPress={() => router.push({ pathname: '/boek/[id]', params: { id: signature.id, stylist: s.id } })} />
        </Glass>
      ) : null}
      {looks.length ? (
        <View style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            Portfolio · 3D-renders van haar looks
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {looks.map((l) => (
              <Press key={l.id} onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: l.service } })} style={{ width: w, gap: 6 }}>
                <View style={{ height: w * 1.25, borderRadius: R.lg, overflow: 'hidden' }}>
                  <HairArt colours={l.colours} texture={l.texture} seed={l.id} style={{ flex: 1 }} />
                </View>
                <Txt v="h3" size={14}>
                  {l.name}
                </Txt>
                <Txt v="small" color={C.muted}>
                  {serviceById(l.service).short} · {priceLabel(serviceById(l.service))}
                </Txt>
              </Press>
            ))}
          </View>
        </View>
      ) : null}
      <Button title={`Boek bij ${s.name.split(' ')[0]}`} icon="scissors" size="lg" full chroma={s.chroma} onPress={() => router.push({ pathname: '/boek/[id]', params: { id: signature.id, stylist: s.id } })} />
    </Screen>
  );
}
