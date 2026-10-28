import { addDays, CHROMA, clock as hhmm, dayLong, duoSlots, euro, minutesFor, priceFor, salonHours, serviceById, startOfDay, weekdayShort, type ServiceId } from '@ilker/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, Chip, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useClock } from '../state/clock';
import { useDemo } from '../state/demo';
import { C, FONT, fx, PAD, R } from '../theme';

const OPTIONS: ServiceId[] = ['dames-knippen', 'fohnen', 'uitgroei', 'toner', 'krullen', 'olaplex', 'heren'];

/** Feature 15: two chairs side by side, for you and a friend: both stylists free at the same time in neighbouring chairs. */
export default function Duo() {
  const { now } = useClock();
  const { bookings, book } = useDemo();
  const [mine, setMine] = useState<ServiceId>('fohnen');
  const [hers, setHers] = useState<ServiceId>('fohnen');
  const [friend, setFriend] = useState('');
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i + 1)).filter((d) => salonHours(d)), [now.toDateString()]);
  const [day, setDay] = useState(days[0]);
  const [pick, setPick] = useState<number | null>(null);
  const slots = useMemo(
    () => duoSlots({ service: mine, minutes: minutesFor(mine) }, { service: hers, minutes: minutesFor(hers) }, day, now, bookings).slice(0, 12),
    [mine, hers, day, bookings, now.getHours()],
  );
  const slot = pick === null ? null : slots.find((s) => s.start.getTime() === pick) ?? null;
  const total = priceFor(mine) + priceFor(hers);

  return (
    <Screen
      back
      title="Samen in de stoel"
      kicker="Duo"
      footer={
        <Button
          title={slot ? `Boek samen · ${euro(total)}` : 'Kies een tijd'}
          icon="users"
          size="lg"
          full
          chroma="violet"
          disabled={!slot}
          onPress={() => {
            if (!slot) return;
            const id = book({
              service: mine,
              optionId: serviceById(mine).options[0].id,
              stylist: slot.first.id,
              start: slot.start,
              minutes: minutesFor(mine),
              price: total,
              duo: { name: friend || 'Je vriendin', service: hers, optionId: serviceById(hers).options[0].id, stylist: slot.second.id, chair: slot.second.chair },
            });
            router.replace({ pathname: '/bevestiging/[id]', params: { id } });
          }}
        />
      }
    >
      <Txt v="body" color={C.soft}>
        Kom samen met je vriendin, zus of moeder. We zoeken een moment met twee vrije stylisten op stoelen naast elkaar.
      </Txt>
      <Glass style={{ gap: 12 }}>
        <Txt v="label" color={C.muted}>
          Jij
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {OPTIONS.map((s) => (
            <Chip key={s} label={serviceById(s).short} on={mine === s} chroma="violet" onPress={() => setMine(s)} />
          ))}
        </ScrollView>
        <Txt v="label" color={C.muted}>
          Zij
        </Txt>
        <TextInput
          value={friend}
          onChangeText={setFriend}
          placeholder="Naam van je vriendin"
          placeholderTextColor={C.faint}
          style={{ height: 48, paddingHorizontal: 14, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.06)', color: C.text, fontFamily: FONT.sans, fontSize: 15 }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {OPTIONS.map((s) => (
            <Chip key={s} label={serviceById(s).short} on={hers === s} chroma="roze" onPress={() => setHers(s)} />
          ))}
        </ScrollView>
      </Glass>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
        {days.map((d) => {
          const on = d.toDateString() === day.toDateString();
          return (
            <Press
              key={d.toISOString()}
              onPress={() => {
                setDay(d);
                setPick(null);
              }}
              accessibilityLabel={dayLong(d)}
              accessibilityState={{ selected: on }}
              fxNames={on ? 'dye-violet' : ''}
              style={{ width: 58, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.blue : 'rgba(16,28,72,0.06)' }}
            >
              <Txt v="label" size={9} color={on ? '#FFFFFF' : C.muted}>
                {weekdayShort(d)}
              </Txt>
              <Txt v="h2" size={21} color={on ? '#FFFFFF' : C.text}>
                {d.getDate()}
              </Txt>
            </Press>
          );
        })}
      </ScrollView>
      {slots.length ? (
        <View style={{ gap: 10 }}>
          {slots.map((s) => {
            const on = s.start.getTime() === pick;
            return (
              <Press
                key={s.start.getTime()}
                onPress={() => setPick(s.start.getTime())}
                accessibilityState={{ selected: on }}
                fxNames={on ? '' : 'glass'}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(16,28,72,0.1)', backgroundColor: on ? C.blue : 'transparent' }}
              >
                <Txt v="h2" size={20} color={on ? '#FFFFFF' : C.text}>
                  {hhmm(s.start)}
                </Txt>
                <Row gap={6} style={{ flex: 1 }}>
                  {[s.first, s.second].map((st) => (
                    <View key={st.id} {...fx(`dye-${st.chroma}`)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: CHROMA[st.chroma].stops[1] }}>
                      <Txt v="small" weight="700" color="#140C10">
                        Stoel {st.chair + 1} · {st.name.split(' ')[0]}
                      </Txt>
                    </View>
                  ))}
                </Row>
              </Press>
            );
          })}
        </View>
      ) : (
        <Glass>
          <Txt v="body" color={C.soft}>
            Op deze dag zijn er geen twee stoelen naast elkaar tegelijk vrij. Kies een andere dag.
          </Txt>
        </Glass>
      )}
      {slot ? <Tag label={`${dayLong(slot.start)} · samen ${euro(total)}`} color="#140C10" bg={CHROMA.violet.stops[0]} /> : null}
    </Screen>
  );
}
