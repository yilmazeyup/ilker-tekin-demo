import {
  addDays,
  CHROMA,
  DEMO_WEATHER,
  fetchWeather,
  frizzFrom,
  memberHistory,
  serviceById,
  startOfDay,
  type ChromaId,
  type Floor,
  type Weather,
} from '@ilker/shared';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { C, fx, R } from '../theme';
import { Ring } from './Art';
import { Press, Txt } from './ui';

/** Today's weather in Eindhoven, fetched once per session; a demo day when offline. */
let cached: Weather | null = null;
let pending: Promise<Weather> | null = null;
export function useWeather(): Weather {
  const [w, setW] = useState<Weather>(cached ?? DEMO_WEATHER);
  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    pending ??= fetchWeather(controller.signal).catch(() => DEMO_WEATHER);
    pending.then((value) => {
      cached = value;
      setW(value);
    });
    return () => clearTimeout(timeout);
  }, []);
  return w;
}

/** The chairs as a row of seats, filled where someone sits, in their stylist's colour. */
export function Chairs({ floor, size = 34 }: { floor: Floor; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {floor.chairs.map((c) => {
        const chroma: ChromaId = c.stylist?.chroma ?? 'mocha';
        const taken = !!c.appt;
        return (
          <View key={c.chair} style={{ alignItems: 'center', gap: 4 }}>
            <View
              {...fx(taken ? `dye-${chroma}` : '')}
              style={{
                width: size,
                height: size * 1.18,
                borderTopLeftRadius: size * 0.42,
                borderTopRightRadius: size * 0.42,
                borderBottomLeftRadius: 6,
                borderBottomRightRadius: 6,
                backgroundColor: taken ? CHROMA[chroma].stops[1] : c.stylist ? 'rgba(16,28,72,0.08)' : 'rgba(16,28,72,0.03)',
                borderWidth: 1,
                borderColor: taken ? 'transparent' : c.stylist ? 'rgba(16,28,72,0.22)' : 'rgba(16,28,72,0.06)',
                borderStyle: c.stylist ? 'solid' : 'dashed',
              }}
            />
            <View style={{ width: size * 0.7, height: 3, borderRadius: 2, backgroundColor: c.away ? C.warn : 'rgba(16,28,72,0.18)' }} />
          </View>
        );
      })}
    </View>
  );
}

/** The frizz score as a dial with the level, for Home and the forecast screen. */
export function FrizzDial({ size = 92, onPress }: { size?: number; onPress?: () => void }) {
  const weather = useWeather();
  const frizz = frizzFrom(weather);
  const chroma: ChromaId = frizz.score < 25 ? 'ijs' : frizz.score < 50 ? 'honing' : frizz.score < 75 ? 'koper' : 'kers';
  return (
    <Press onPress={onPress} fxNames="glass" style={{ flex: 1, borderRadius: R.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(16,28,72,0.13)', backgroundColor: 'rgba(255,255,255,0.025)' }}>
      <Txt v="label" color={C.muted}>
        Frizz vandaag
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ring value={frizz.score / 100} size={size * 0.62} stroke={7} chroma={chroma}>
          <Txt v="num" size={15}>
            {frizz.score}
          </Txt>
        </Ring>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h2" size={19} ink={chroma}>
            {frizz.level}
          </Txt>
          <Txt v="small" color={C.muted}>
            {Math.round(weather.humidity)}% vocht
          </Txt>
        </View>
      </View>
    </Press>
  );
}

/** How far the colour has grown out since the last colour, at about 1.25 cm a month. */
export function regrowth(now: Date) {
  const last = memberHistory(now).find((v) => serviceById(v.service).colour);
  const days = last ? Math.max(0, Math.round((startOfDay(now).getTime() - startOfDay(last.date).getTime()) / 86400000)) : 0;
  const cm = Math.round(((days / 30.4) * 1.25) * 10) / 10;
  const service = last ? serviceById(last.service) : null;
  const due = service?.regrowthDays ?? 35;
  return { last, days, cm, due, dueDate: last ? addDays(last.date, due) : null, share: Math.min(1.2, days / due) };
}

export function RegrowthGauge({ now, onPress, done }: { now: Date; onPress?: () => void; done?: boolean }) {
  const r = regrowth(now);
  return (
    <Press onPress={onPress} fxNames="glass" style={{ flex: 1, borderRadius: R.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(16,28,72,0.13)', backgroundColor: 'rgba(255,255,255,0.025)' }}>
      <Txt v="label" color={C.muted}>
        Uitgroei
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        <Txt v="display" size={36} ink="honing">
          {done ? '0' : r.cm.toFixed(1).replace('.', ',')}
        </Txt>
        <Txt v="h3" color={C.soft} style={{ marginBottom: 6 }}>
          cm
        </Txt>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(16,28,72,0.08)', overflow: 'hidden', flexDirection: 'row' }}>
        <View {...fx('dye-honing')} style={{ width: `${done ? 2 : Math.min(100, r.share * 100)}%`, backgroundColor: '#FFC24B' }} />
      </View>
      <Txt v="small" color={C.muted}>
        {done ? 'Vandaag bijgewerkt' : `${Math.round(r.days / 7)} weken sinds je kleur`}
      </Txt>
    </Press>
  );
}
