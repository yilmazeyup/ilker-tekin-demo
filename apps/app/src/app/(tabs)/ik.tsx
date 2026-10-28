import { CHROMA, clock as hhmm, dayShort, euro, MEMBER, relativeDay, serviceById, stylistById, tierFor } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Glass, Press, Row, Tag, Txt } from '../../components/ui';
import { useDemo } from '../../state/demo';
import { useVisit } from '../../state/live';
import { C, fx, R } from '../../theme';

const TILES: { title: string; icon: IconName; to: string; chroma: 'koper' | 'honing' | 'roze' | 'violet' | 'ijs' | 'kers' | 'mocha' }[] = [
  { title: 'Haarpaspoort', icon: 'book', to: '/paspoort', chroma: 'mocha' },
  { title: 'Uitgroei', icon: 'ruler', to: '/uitgroei', chroma: 'honing' },
  { title: 'Consult', icon: 'camera', to: '/consult', chroma: 'violet' },
  { title: 'Nazorg', icon: 'leaf', to: '/nazorg', chroma: 'ijs' },
  { title: 'Wachtlijst', icon: 'list', to: '/wachtlijst', chroma: 'violet' },
  { title: 'Reviews', icon: 'star', to: '/review', chroma: 'roze' },
  { title: 'Haarquiz', icon: 'flask', to: '/quiz', chroma: 'ijs' },
  { title: 'Frizz', icon: 'drop', to: '/frizz', chroma: 'ijs' },
  { title: 'Betalen', icon: 'card', to: '/betalen', chroma: 'kers' },
];

export default function Me() {
  const { points, bookings, cancel, orders, resetDemo, gifts } = useDemo();
  const v = useVisit();
  const toast = useToast();
  const { tier, next, progress } = tierFor(points);
  const upcoming = bookings.filter((b) => b.start.getTime() > v.now.getTime());
  return (
    <Screen title={MEMBER.first} kicker="Ik" tabs>
      <Press onPress={() => router.push('/club')} fxNames={`dye-${tier.chroma} grain`} style={{ borderRadius: R.xl, padding: 20, gap: 12, backgroundColor: CHROMA[tier.chroma].stops[1], overflow: 'hidden' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label" color="#140C10">
            Club · {tier.name}
          </Txt>
          <Icon name="crown" size={20} color="#140C10" />
        </Row>
        <Txt v="hero" size={48} color="#140C10">
          {points.toLocaleString('nl-NL')}
        </Txt>
        {next ? (
          <View style={{ gap: 6 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(20,12,16,0.2)' }}>
              <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: 3, backgroundColor: '#140C10' }} />
            </View>
            <Txt v="small" color="rgba(20,12,16,0.8)">
              Nog {next.from - points} punten tot {next.name} · cadeaukaarten en vriendinnen in de Club
            </Txt>
          </View>
        ) : null}
      </Press>

      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Afspraken
        </Txt>
        <Press onPress={() => router.push('/live')} fxNames="glass" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(242,36,60,0.4)' }}>
          <View {...fx('dye-kers')} style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA.kers.stops[1] }}>
            <Icon name="timer" size={20} color="#140C10" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3">{serviceById(v.appt.service).short}</Txt>
            <Txt v="small" color={C.muted}>
              {relativeDay(v.appt.start, v.now)} {hhmm(v.appt.start)} · {stylistById(v.appt.stylist).name}
            </Txt>
          </View>
          <Tag label={v.phase === 'now' ? 'Nu' : v.phase === 'done' ? 'Klaar' : 'Live'} color="#140C10" bg={v.phase === 'done' ? C.ok : CHROMA.kers.stops[0]} />
        </Press>
        {upcoming.map((b) => (
          <Glass key={b.id} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt v="h3">{serviceById(b.service).short}{b.duo ? ' · samen' : ''}</Txt>
              <Txt v="small" color={C.muted}>
                {dayShort(b.start)} {hhmm(b.start)} · {stylistById(b.stylist).name} · {euro(b.price)}
              </Txt>
            </View>
            <Press
              onPress={() => {
                cancel(b.id);
                toast('Afspraak geannuleerd', { text: 'Wie op de wachtlijst staat, krijgt je plek.', icon: 'calendar' });
              }}
              accessibilityLabel="Annuleren"
              style={{ padding: 8 }}
            >
              <Icon name="close" size={18} color={C.muted} />
            </Press>
          </Glass>
        ))}
        <Button title="Nieuwe afspraak" icon="scissors" kind="glass" full onPress={() => router.push('/boeken')} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TILES.map((t) => (
          <Press
            key={t.to}
            onPress={() => router.push(t.to as never)}
            fxNames="glass"
            style={{ width: '30.8%', aspectRatio: 1, padding: 12, borderRadius: R.md, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(16,28,72,0.1)' }}
          >
            <View {...fx(`dye-${t.chroma}`)} style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: CHROMA[t.chroma].stops[1] }}>
              <Icon name={t.icon} size={17} color="#140C10" />
            </View>
            <Txt v="h3" size={13}>
              {t.title}
            </Txt>
          </Press>
        ))}
      </View>

      {orders.length || gifts.length ? (
        <View style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            Bestellingen en cadeaukaarten
          </Txt>
          {orders.map((o) => (
            <Press key={o.number} onPress={() => router.push({ pathname: '/bestelling/[id]', params: { id: o.number } })} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: R.sm, backgroundColor: 'rgba(16,28,72,0.05)' }}>
              <Txt v="body">{o.number}</Txt>
              <Txt v="num">{euro(o.total)}</Txt>
            </Press>
          ))}
          {gifts.map((g) => (
            <Row key={g.code} style={{ justifyContent: 'space-between', padding: 12, borderRadius: R.sm, backgroundColor: 'rgba(16,28,72,0.05)' }}>
              <Txt v="body">Cadeaukaart {g.code}</Txt>
              <Txt v="num">{euro(g.amount)}</Txt>
            </Row>
          ))}
        </View>
      ) : null}

      <Glass style={{ gap: 10 }}>
        <Txt v="h3">Over deze demo</Txt>
        <Txt v="small" color={C.soft}>
          Het menu, de prijzen, het adres en de openingstijden zijn van İlker Tekin Hairstylist. Yara, de andere klanten, het team naast İlker, de Club en de shopprijzen zijn verzonnen. Er wordt niets echt geboekt of betaald.
        </Txt>
        <Button
          title="Demo opnieuw beginnen"
          icon="refresh"
          kind="glass"
          size="sm"
          onPress={() => {
            resetDemo();
            toast('De demo begint opnieuw', { icon: 'refresh' });
            router.replace('/');
          }}
        />
      </Glass>
    </Screen>
  );
}
