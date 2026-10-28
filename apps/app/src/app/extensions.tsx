import { CHROMA, euro, minutesFor, serviceById, type ServiceId } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HairArt } from '../components/HairArt';
import { Screen } from '../components/Screen';
import { Button, Chip, DemoNote, Glass, Row, Tag, Txt } from '../components/ui';
import { C, PAD, R } from '../theme';

const LENGTHS = [50, 60, 70] as const;
const VOLUMES = [
  { id: 'subtiel', label: 'Subtiel', line: 'Meer lengte, je eigen volume', factor: 0.7 },
  { id: 'vol', label: 'Vol', line: 'Lengte en zichtbaar meer volume', factor: 1 },
  { id: 'glam', label: 'Glam', line: 'Maximaal volume', factor: 1.35 },
];
const OWN = [
  { id: 'fijn', label: 'Fijn', factor: 0.85 },
  { id: 'normaal', label: 'Normaal', factor: 1 },
  { id: 'dik', label: 'Dik', factor: 1.2 },
];
const TYPES: ServiceId[] = ['ext-microring', 'ext-nanoring', 'ext-keratine'];

/** Feature 20: the extensions planner. Length, volume and your own hair give a number of strands, priced at the salon's € 3,50 a strand. */
export default function ExtensionsPlanner() {
  const [length, setLength] = useState<(typeof LENGTHS)[number]>(60);
  const [volume, setVolume] = useState('vol');
  const [own, setOwn] = useState('normaal');
  const [type, setType] = useState<ServiceId>('ext-microring');
  const v = VOLUMES.find((x) => x.id === volume)!;
  const o = OWN.find((x) => x.id === own)!;
  const strands = Math.round(((100 + (length - 50) * 2) * v.factor * o.factor) / 5) * 5;
  const service = serviceById(type);
  const price = strands * service.options[0].price;
  const minutes = minutesFor(type, undefined, strands);

  return (
    <Screen
      back
      hero={
        <View style={{ height: 300, marginTop: 14, marginHorizontal: PAD, borderRadius: R.xl, overflow: 'hidden' }}>
          <HairArt colours={['#2E1D13', '#6B4630', '#B98A60']} texture="waves" seed={`ext-${length}-${volume}`} density={v.factor} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          <View style={{ position: 'absolute', left: 20, bottom: 18, gap: 6 }}>
            <Tag label="Extensions-planner" color="#140C10" bg={CHROMA.roze.stops[0]} />
            <Txt v="display" size={38} color={C.white}>
              {length} cm · {v.label}
            </Txt>
          </View>
        </View>
      }
    >
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Lengte
        </Txt>
        <Row gap={8}>
          {LENGTHS.map((l) => (
            <Chip key={l} label={`${l} cm`} on={length === l} chroma="roze" onPress={() => setLength(l)} />
          ))}
        </Row>
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Hoeveel volume
        </Txt>
        <Row gap={8} wrap>
          {VOLUMES.map((x) => (
            <Chip key={x.id} label={x.label} on={volume === x.id} chroma="roze" onPress={() => setVolume(x.id)} />
          ))}
        </Row>
        <Txt v="small" color={C.muted}>
          {v.line}
        </Txt>
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Je eigen haar
        </Txt>
        <Row gap={8}>
          {OWN.map((x) => (
            <Chip key={x.id} label={x.label} on={own === x.id} onPress={() => setOwn(x.id)} />
          ))}
        </Row>
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Techniek
        </Txt>
        <Row gap={8} wrap>
          {TYPES.map((t) => (
            <Chip key={t} label={serviceById(t).short} on={type === t} onPress={() => setType(t)} />
          ))}
        </Row>
        <Txt v="small" color={C.muted}>
          {service.blurb}
        </Txt>
      </View>
      <Glass tint="roze" style={{ gap: 12 }} pad={20}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Txt v="label" color={C.muted}>
              Ongeveer
            </Txt>
            <Txt v="hero" size={56} ink="roze">
              {strands}
            </Txt>
            <Txt v="small" color={C.muted}>
              strengen
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt v="display" size={36}>
              {euro(price)}
            </Txt>
            <Txt v="small" color={C.muted}>
              {strands} × {euro(service.options[0].price)} · ± {Math.round(minutes / 15) * 15} min
            </Txt>
          </View>
        </Row>
        <Txt v="small" color={C.soft}>
          Een schatting: bij het gratis adviesgesprek kijkt Lina naar je haar en spreek je het precieze aantal af.
        </Txt>
      </Glass>
      <Button title="Gratis adviesgesprek boeken" icon="chat" size="lg" full chroma="roze" onPress={() => router.push({ pathname: '/boek/[id]', params: { id: 'advies', stylist: 'lina' } })} />
      <Button title={`Meteen boeken · ${strands} strengen`} icon="scissors" kind="glass" full onPress={() => router.push({ pathname: '/boek/[id]', params: { id: type } })} />
      <DemoNote text="Prijzen per streng komen uit het menu van de salon (€ 3,50). Het aantal strengen is een vuistregel van de demo." />
    </Screen>
  );
}
