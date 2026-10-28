import {
  CARE,
  categoryById,
  CHROMA,
  dayShort,
  euro,
  firstSlot,
  LOOKS,
  minutesFor,
  optionOf,
  planSteps,
  priceLabel,
  productsAfter,
  serviceById,
  STEP_LABEL,
  stylistsFor,
  clock as hhmm,
  type Length,
  type ServiceId,
} from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Bottle } from '../../components/Art';
import { HairArt } from '../../components/HairArt';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Button, Glass, Press, Row, SectionHead, Tag, Txt } from '../../components/ui';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { C, fx, PAD, R } from '../../theme';

export default function Treatment() {
  const params = useLocalSearchParams<{ id: string; length?: string }>();
  const service = serviceById((params.id ?? 'dames-knippen') as ServiceId);
  const category = categoryById(service.category);
  const chroma = CHROMA[category.chroma];
  const [optionId, setOptionId] = useState(service.options.find((o) => o.length === (params.length as Length))?.id ?? service.options[0].id);
  const option = optionOf(service, optionId);
  const { now } = useClock();
  const { bookings } = useDemo();
  const look = LOOKS.find((l) => l.service === service.id) ?? LOOKS.find((l) => l.chroma === category.chroma) ?? LOOKS[0];
  const steps = planSteps(service.id, service.perStrand ? minutesFor(service.id, undefined, 100) : option.minutes);
  const stylists = stylistsFor(service.id);
  const firsts = useMemo(
    () => stylists.map((s) => ({ stylist: s, slot: firstSlot(service.id, minutesFor(service.id, optionId), s.id, now, bookings) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service.id, optionId, now.toDateString(), bookings.length],
  );
  const care = CARE[service.care];
  const products = productsAfter(service.id).slice(0, 3);
  const book = () => router.push({ pathname: '/boek/[id]', params: { id: service.id, option: optionId } });

  return (
    <Screen
      back
      hero={
        <View style={{ height: 300, marginTop: 14, marginHorizontal: PAD, borderRadius: R.xl, overflow: 'hidden' }}>
          <HairArt colours={look.colours} texture={look.texture} seed={`svc-${service.id}`} animate density={60} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} background="#120C10" />
          <View style={{ position: 'absolute', left: 18, bottom: 16, right: 18, gap: 8 }}>
            <Tag label={category.name} color="#140C10" bg={chroma.stops[0]} />
          </View>
        </View>
      }
      footer={<Button title={`Book now · ${service.perStrand ? priceLabel(service) : euro(option.price)}`} icon="scissors" size="lg" full chroma={category.chroma} onPress={book} />}
    >
      <View style={{ gap: 10 }}>
        <Txt v="display" size={38}>
          {service.short}
        </Txt>
        <Txt v="label" color={C.muted}>
          {service.name}
        </Txt>
        <Txt v="body" color={C.soft}>
          {service.blurb}
        </Txt>
      </View>

      {service.perStrand ? (
        <Glass style={{ gap: 12 }} tint={category.chroma}>
          <Txt v="h3">Per streng geprijsd</Txt>
          <Txt v="body" color={C.soft}>
            {euro(option.price)} per streng. Hoeveel strengen jij nodig hebt hangt af van je eigen haar en je wens: de planner rekent het voor je uit.
          </Txt>
          <Button title="Open de extensions-planner" icon="strands" kind="glass" onPress={() => router.push('/extensions')} />
        </Glass>
      ) : service.options.length > 1 ? (
        <View style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            Kies je lengte
          </Txt>
          <Row gap={8}>
            {service.options.map((o) => {
              const on = o.id === optionId;
              return (
                <Press
                  key={o.id}
                  onPress={() => setOptionId(o.id)}
                  accessibilityState={{ selected: on }}
                  fxNames={on ? '' : 'glass'}
                  style={{ flex: 1, padding: 14, borderRadius: R.md, gap: 4, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(16,28,72,0.12)', backgroundColor: on ? C.blue : 'transparent' }}
                >
                  <Txt v="small" weight="600" color={on ? '#FFFFFF' : C.soft}>
                    {o.label.replace(' haar', '')}
                  </Txt>
                  <Txt v="h2" size={20} color={on ? '#FFFFFF' : C.text}>
                    {euro(o.price)}
                  </Txt>
                  <Txt v="small" size={12} color={on ? 'rgba(255,255,255,0.8)' : C.muted}>
                    {o.minutes} min
                  </Txt>
                </Press>
              );
            })}
          </Row>
        </View>
      ) : null}

      <View>
        <SectionHead kicker="Zo verloopt je afspraak" title="Stap voor stap" />
        <Glass pad={16} style={{ gap: 0 }}>
          {steps.map((s, i) => (
            <Row key={i} gap={14} style={{ paddingVertical: 10 }}>
              <View {...fx(s.kind === 'inwerken' ? `dye-${category.chroma}` : '')} style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: s.kind === 'inwerken' ? chroma.stops[1] : 'rgba(16,28,72,0.07)' }}>
                <Icon name={s.station === 'basin' ? 'wash' : s.kind === 'inwerken' ? 'timer' : s.kind === 'knippen' ? 'scissors' : s.kind === 'föhnen' ? 'wind' : 'chair'} size={18} color={s.kind === 'inwerken' ? '#140C10' : C.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" size={15}>
                  {STEP_LABEL[s.kind]}
                </Txt>
                <Txt v="small" color={C.muted}>
                  {s.station === 'basin' ? 'Bij de wasbak' : s.kind === 'inwerken' ? 'In je stoel, met een timer in de app' : 'In je stoel'}
                </Txt>
              </View>
              <Txt v="num" color={C.soft}>
                {s.minutes} min
              </Txt>
            </Row>
          ))}
        </Glass>
      </View>

      <View>
        <SectionHead kicker="Wie doet het" title="Kies je stylist" action="Portfolio's" onAction={() => router.push('/team')} />
        <View style={{ gap: 10 }}>
          {firsts.map(({ stylist, slot }) => (
            <Press
              key={stylist.id}
              onPress={() => router.push({ pathname: '/boek/[id]', params: { id: service.id, option: optionId, stylist: stylist.id } })}
              fxNames="glass"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.11)' }}
            >
              <View style={{ width: 46, height: 56, borderRadius: 12, overflow: 'hidden' }}>
                <HairArt colours={CHROMA[stylist.chroma].stops} texture="waves" seed={`face-${stylist.id}`} style={{ flex: 1 }} background="#120C10" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3">{stylist.name}</Txt>
                <Txt v="small" color={C.muted}>
                  {stylist.role}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt v="label" color={C.muted} size={9}>
                  Eerst vrij
                </Txt>
                <Txt v="num" size={13}>
                  {slot ? `${dayShort(slot.start)} ${hhmm(slot.start)}` : 'vol'}
                </Txt>
              </View>
            </Press>
          ))}
        </View>
      </View>

      <Glass style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">{care.title}</Txt>
          <Press onPress={() => router.push({ pathname: '/nazorg', params: { care: care.id } })}>
            <Txt v="small" weight="600" color={C.soft}>
              Nazorg →
            </Txt>
          </Press>
        </Row>
        {care.dos.slice(0, 3).map((d) => (
          <Row key={d} gap={10}>
            <Icon name="check" size={16} color={C.ok} />
            <Txt v="body" color={C.soft} style={{ flex: 1 }}>
              {d}
            </Txt>
          </Row>
        ))}
      </Glass>

      {products.length ? (
        <View>
          <SectionHead kicker="Voor thuis" title="Houdt het mooi" />
          <Row gap={10}>
            {products.map((p) => (
              <Press
                key={p.id}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                fxNames="glass"
                style={{ flex: 1, alignItems: 'center', padding: 10, gap: 6, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.1)' }}
              >
                <Bottle product={p} height={92} />
                <Txt v="small" size={11} align="center" numberOfLines={2}>
                  {p.line} {p.name}
                </Txt>
              </Press>
            ))}
          </Row>
        </View>
      ) : null}
    </Screen>
  );
}
