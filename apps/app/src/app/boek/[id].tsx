import {
  addDays,
  categoryById,
  CHROMA,
  clock as hhmm,
  dayLong,
  euro,
  minutesFor,
  openSlots,
  optionOf,
  priceFor,
  salonHours,
  serviceById,
  startOfDay,
  stylistById,
  stylistsFor,
  weekdayShort,
  type ServiceId,
  type StylistId,
} from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { HairArt } from '../../components/HairArt';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Glass, Press, Row, Tag, Txt } from '../../components/ui';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { C, fx, PAD, R } from '../../theme';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Row gap={10}>
        <Txt v="display" size={30} ink="chroma">
          {String(n).padStart(2, '0')}
        </Txt>
        <Txt v="h2" size={19}>
          {title}
        </Txt>
      </Row>
      {children}
    </View>
  );
}

export default function BookFlow() {
  const params = useLocalSearchParams<{ id: string; option?: string; stylist?: string }>();
  const service = serviceById((params.id ?? 'dames-knippen') as ServiceId);
  const category = categoryById(service.category);
  const { now } = useClock();
  const { bookings, book, joinWaitlist } = useDemo();
  const toast = useToast();
  const [optionId, setOptionId] = useState(params.option ?? service.options[0].id);
  const [strands, setStrands] = useState(100);
  const [stylist, setStylist] = useState<StylistId | 'any'>((params.stylist as StylistId) ?? 'any');
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(startOfDay(now), i)), [now.toDateString()]);
  const [day, setDay] = useState(() => days.find((d) => salonHours(d)) ?? days[0]);
  const [slotKey, setSlotKey] = useState<string | null>(null);
  const [olaplex, setOlaplex] = useState(false);
  const minutes = minutesFor(service.id, optionId, service.perStrand ? strands : undefined);
  const slots = useMemo(() => openSlots(service.id, minutes, stylist, day, now, bookings), [service.id, minutes, stylist, day, now.getHours(), bookings]);
  const slot = slots.find((s) => `${s.start.getTime()}-${s.stylist}` === slotKey) ?? null;
  const base = priceFor(service.id, optionId, service.perStrand ? strands : undefined);
  const price = base + (olaplex ? 40 : 0);
  const option = optionOf(service, optionId);

  const confirm = () => {
    if (!slot) return;
    const id = book({
      service: service.id,
      optionId,
      stylist: slot.stylist,
      start: slot.start,
      minutes: minutes + (olaplex ? 30 : 0),
      price,
      strands: service.perStrand ? strands : undefined,
      olaplex,
    });
    router.replace({ pathname: '/bevestiging/[id]', params: { id } });
  };

  return (
    <Screen
      back
      title={service.short}
      kicker={`Book now · ${category.name}`}
      footer={
        <Button
          title={slot ? `Book now · ${euro(price)}` : 'Kies een tijd'}
          icon="scissors"
          size="lg"
          full
          chroma={category.chroma}
          disabled={!slot}
          onPress={confirm}
        />
      }
    >
      {service.options.length > 1 ? (
        <Step n={1} title="Je lengte">
          <Row gap={8}>
            {service.options.map((o) => {
              const on = o.id === optionId;
              return (
                <Press
                  key={o.id}
                  onPress={() => {
                    setOptionId(o.id);
                    setSlotKey(null);
                  }}
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1, padding: 12, borderRadius: R.md, gap: 2, backgroundColor: on ? C.blue : 'rgba(16,28,72,0.05)' }}
                >
                  <Txt v="small" weight="600" color={on ? '#FFFFFF' : C.soft}>
                    {o.label.replace(' haar', '')}
                  </Txt>
                  <Txt v="h3" color={on ? '#FFFFFF' : C.text}>
                    {euro(o.price)}
                  </Txt>
                </Press>
              );
            })}
          </Row>
        </Step>
      ) : null}

      {service.perStrand ? (
        <Step n={1} title="Aantal strengen">
          <Glass style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Press onPress={() => setStrands((s) => Math.max(25, s - 25))} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(16,28,72,0.08)', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Minder strengen">
                <Icon name="minus" />
              </Press>
              <View style={{ alignItems: 'center' }}>
                <Txt v="display" size={44} ink={category.chroma}>
                  {strands}
                </Txt>
                <Txt v="small" color={C.muted}>
                  strengen · {euro(strands * option.price)}
                </Txt>
              </View>
              <Press onPress={() => setStrands((s) => Math.min(250, s + 25))} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(16,28,72,0.08)', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Meer strengen">
                <Icon name="plus" />
              </Press>
            </Row>
            <Button title="Weet je het niet? Gebruik de planner" kind="ghost" size="sm" onPress={() => router.push('/extensions')} />
          </Glass>
        </Step>
      ) : null}

      <Step n={service.options.length > 1 || service.perStrand ? 2 : 1} title="Bij wie">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
          {[{ id: 'any' as const }, ...stylistsFor(service.id)].map((s) => {
            const on = stylist === s.id;
            const st = s.id === 'any' ? null : stylistById(s.id);
            return (
              <Press
                key={s.id}
                onPress={() => {
                  setStylist(s.id);
                  setSlotKey(null);
                }}
                accessibilityState={{ selected: on }}
                style={{ width: 104, borderRadius: R.md, overflow: 'hidden', borderWidth: 2, borderColor: on ? C.blue : 'rgba(16,28,72,0.1)' }}
              >
                <View style={{ height: 96 }}>
                  {st ? (
                    <HairArt colours={CHROMA[st.chroma].stops} texture="waves" seed={`face-${st.id}`} style={{ flex: 1 }} background="#120C10" />
                  ) : (
                    <View {...fx('dye-chroma')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue }}>
                      <Icon name="sparkle" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={{ padding: 10, gap: 2, backgroundColor: on ? C.blue : 'rgba(16,28,72,0.04)' }}>
                  <Txt v="h3" size={14} color={on ? '#FFFFFF' : C.text} numberOfLines={1}>
                    {st ? st.name.split(' ')[0] : 'Geen voorkeur'}
                  </Txt>
                  <Txt v="small" size={11} color={on ? 'rgba(255,255,255,0.8)' : C.muted} numberOfLines={1}>
                    {st ? st.role : 'Eerste vrije plek'}
                  </Txt>
                </View>
              </Press>
            );
          })}
        </ScrollView>
      </Step>

      <Step n={service.options.length > 1 || service.perStrand ? 3 : 2} title="Wanneer">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
          {days.map((d) => {
            const open = !!salonHours(d);
            const on = d.toDateString() === day.toDateString();
            return (
              <Press
                key={d.toISOString()}
                disabled={!open}
                onPress={() => {
                  setDay(d);
                  setSlotKey(null);
                }}
                accessibilityState={{ selected: on, disabled: !open }}
                accessibilityLabel={dayLong(d)}
                fxNames=''
                style={{ width: 58, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: on ? C.blue : open ? 'rgba(16,28,72,0.06)' : 'transparent', borderWidth: open ? 0 : 1, borderColor: 'rgba(16,28,72,0.06)' }}
              >
                <Txt v="label" size={9} color={on ? '#FFFFFF' : C.muted}>
                  {weekdayShort(d)}
                </Txt>
                <Txt v="h2" size={22} color={on ? '#FFFFFF' : open ? C.text : C.faint}>
                  {d.getDate()}
                </Txt>
              </Press>
            );
          })}
        </ScrollView>
        {slots.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slots.map((s) => {
              const key = `${s.start.getTime()}-${s.stylist}`;
              const on = key === slotKey;
              return (
                <Press
                  key={key}
                  onPress={() => setSlotKey(key)}
                  accessibilityState={{ selected: on }}
                  style={{ width: '23%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: on ? C.blue : 'rgba(16,28,72,0.06)' }}
                >
                  <Txt v="num" size={15} color={on ? '#FFFFFF' : C.text}>
                    {hhmm(s.start)}
                  </Txt>
                  {stylist === 'any' ? (
                    <Txt v="small" size={10} color={on ? 'rgba(255,255,255,0.8)' : C.muted}>
                      {stylistById(s.stylist).name.split(' ')[0]}
                    </Txt>
                  ) : null}
                </Press>
              );
            })}
          </View>
        ) : (
          <Glass style={{ gap: 10 }}>
            <Txt v="h3">{salonHours(day) ? 'Deze dag is vol' : 'Gesloten op zondag en maandag'}</Txt>
            <Txt v="body" color={C.soft}>
              Zet je op de wachtlijst: komt er iets vrij, dan krijg je meteen een seintje.
            </Txt>
            <Button
              title="Op de wachtlijst"
              icon="list"
              kind="glass"
              onPress={() => {
                joinWaitlist({ service: service.id, stylist, part: 'hele dag' });
                toast('Je staat op de wachtlijst', { text: 'We laten het weten zodra er een plek vrijkomt.', icon: 'list' });
                router.push('/wachtlijst');
              }}
            />
          </Glass>
        )}
      </Step>

      {service.colour && !service.olaplex ? (
        <Press
          onPress={() => setOlaplex((o) => !o)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: olaplex }}
          fxNames="glass"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.md, borderWidth: 1, borderColor: olaplex ? CHROMA.violet.glow : 'rgba(16,28,72,0.12)' }}
        >
          <View style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: olaplex ? CHROMA.violet.glow : 'rgba(16,28,72,0.08)' }}>
            {olaplex ? <Icon name="check" size={16} color="#140C10" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3">Olaplex-behandeling erbij</Txt>
            <Txt v="small" color={C.muted}>
              Beschermt je haar tijdens het kleuren · 30 min
            </Txt>
          </View>
          <Txt v="num">+ {euro(40)}</Txt>
        </Press>
      ) : null}

      {slot ? (
        <Glass tint={category.chroma} style={{ gap: 8 }}>
          <Tag label="Samenvatting" />
          <Txt v="title" size={24}>
            {dayLong(slot.start)} · {hhmm(slot.start)}
          </Txt>
          <Txt v="body" color={C.soft}>
            {service.short}
            {service.options.length > 1 ? ` (${option.label.toLowerCase()})` : ''}
            {service.perStrand ? ` · ${strands} strengen` : ''} bij {stylistById(slot.stylist).name} · {minutes + (olaplex ? 30 : 0)} min
          </Txt>
          <Txt v="small" color={C.muted}>
            Je betaalt in de salon of in de app. Demo: er wordt niets echt geboekt.
          </Txt>
        </Glass>
      ) : null}
    </Screen>
  );
}
