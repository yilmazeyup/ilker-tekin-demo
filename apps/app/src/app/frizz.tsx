import { frizzFrom, PRODUCTS, euro } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Bottle, Ring } from '../components/Art';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Button, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useWeather } from '../components/Widgets';
import { useClock } from '../state/clock';
import { C, fx, R } from '../theme';

/** Feature 18: today's frizz forecast from the humidity and dew point in Eindhoven (Open-Meteo), with advice and products. */
export default function Frizz() {
  const weather = useWeather();
  const frizz = frizzFrom(weather);
  const { now } = useClock();
  const chroma = frizz.score < 25 ? 'ijs' : frizz.score < 50 ? 'honing' : frizz.score < 75 ? 'koper' : 'kers';
  const products = PRODUCTS.filter((p) => p.concerns.includes('frizz')).slice(0, 3);
  const max = Math.max(...weather.hourly, 100);
  const min = Math.min(...weather.hourly, 40);
  return (
    <Screen back title="Frizz vandaag" kicker={`Eindhoven · ${weather.live ? 'live weer' : 'demowaarde'}`}>
      <Glass tint={chroma} style={{ alignItems: 'center', gap: 14 }} pad={24}>
        <Ring value={frizz.score / 100} size={210} stroke={16} chroma={chroma}>
          <View style={{ alignItems: 'center' }}>
            <Txt v="timer" size={64}>
              {frizz.score}
            </Txt>
            <Txt v="label" color={C.muted}>
              van 100
            </Txt>
          </View>
        </Ring>
        <Txt v="hero" size={44} ink={chroma}>
          {frizz.level}
        </Txt>
        <Txt v="h3" align="center">
          {frizz.title}
        </Txt>
        <Row gap={18}>
          {[
            { icon: 'drop' as const, label: `${Math.round(weather.humidity)}%`, sub: 'vocht' },
            { icon: 'thermo' as const, label: `${Math.round(weather.temperature)}°`, sub: 'temperatuur' },
            { icon: 'cloud' as const, label: `${weather.dewPoint.toFixed(1).replace('.', ',')}°`, sub: 'dauwpunt' },
          ].map((x) => (
            <View key={x.sub} style={{ alignItems: 'center', gap: 4 }}>
              <Icon name={x.icon} size={20} color={C.soft} />
              <Txt v="h3">{x.label}</Txt>
              <Txt v="small" size={11} color={C.muted}>
                {x.sub}
              </Txt>
            </View>
          ))}
        </Row>
      </Glass>
      <Glass style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label" color={C.muted}>
            Luchtvochtigheid vandaag
          </Txt>
          <Tag label={`Piek rond ${String(frizz.peak).padStart(2, '0')}:00`} />
        </Row>
        <View style={{ height: 90, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
          {weather.hourly.map((h, i) => {
            const on = i === now.getHours();
            return (
              <View
                key={i}
                {...fx(on ? `dye-${chroma}` : '')}
                style={{ flex: 1, height: `${12 + ((h - min) / (max - min || 1)) * 88}%`, borderRadius: 3, backgroundColor: on ? '#FFB27A' : i >= 9 && i < 18 ? 'rgba(169,198,255,0.55)' : 'rgba(169,198,255,0.2)' }}
              />
            );
          })}
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          {['00', '06', '12', '18', '23'].map((t) => (
            <Txt key={t} v="num" size={10} color={C.muted}>
              {t}
            </Txt>
          ))}
        </Row>
      </Glass>
      <Glass style={{ gap: 12 }}>
        <Txt v="label" color={C.muted}>
          Wat je haar vandaag nodig heeft
        </Txt>
        {frizz.advice.map((a) => (
          <Row key={a} gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={C.ok} />
            <Txt v="body" style={{ flex: 1 }}>
              {a}
            </Txt>
          </Row>
        ))}
      </Glass>
      <Row gap={10}>
        {products.map((p) => (
          <Press
            key={p.id}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
            fxNames="glass"
            style={{ flex: 1, padding: 10, gap: 6, alignItems: 'center', borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Bottle product={p} height={90} />
            <Txt v="small" size={11} align="center" numberOfLines={2}>
              {p.line} {p.name}
            </Txt>
            <Txt v="num" size={12}>
              {euro(p.price)}
            </Txt>
          </Press>
        ))}
      </Row>
      {frizz.score >= 50 ? (
        <Button title="Keratine: maanden pluisvrij" icon="sparkle" kind="glass" full onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: 'keratine' } })} />
      ) : null}
      <Txt v="small" color={C.faint} align="center">
        Weerdata: Open-Meteo, voor de locatie van de salon. Alleen de coördinaten van de salon worden opgevraagd.
      </Txt>
    </Screen>
  );
}
