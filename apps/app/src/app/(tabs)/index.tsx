import {
  CATEGORIES,
  CHROMA,
  clock as hhmm,
  dayLong,
  euro,
  FEATURES,
  greeting,
  HOURS_TEXT,
  LOOKS,
  MEMBER,
  PRODUCTS,
  productsAfter,
  salonHours,
  SALON,
  servicesIn,
  serviceById,
  STEP_LABEL,
  stylistById,
  type ChromaId,
} from '@ilker/shared';
import { router } from 'expo-router';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bottle } from '../../components/Art';
import { HairArt } from '../../components/HairArt';
import { HeroImage } from '../../components/HeroImage';
import { Icon } from '../../components/Icon';
import { Backdrop } from '../../components/Screen';
import { Button, Glass, LiveDot, Press, Row, SectionHead, Tag, Txt } from '../../components/ui';
import { Chairs, FrizzDial, RegrowthGauge } from '../../components/Widgets';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { useFloor, useVisit } from '../../state/live';
import { C, CHROMA as CH, fx, isWeb, MAX_WIDTH, PAD, R } from '../../theme';

const glow = (id: ChromaId) => CHROMA[id].glow;

function VisitHero() {
  const v = useVisit();
  const { live } = useDemo();
  const stylist = stylistById(v.appt.stylist);
  const service = serviceById(v.appt.service);
  const status =
    v.phase === 'now' && v.step
      ? `${STEP_LABEL[v.step.kind]} · stoel ${v.appt.chair + 1}`
      : v.phase === 'done'
        ? 'Klaar. Tijd om af te rekenen'
        : v.phase === 'waiting'
          ? 'Ingecheckt · even plaatsnemen'
          : v.late
            ? `${stylist.name} loopt ${v.late} min uit: je bent om ${hhmm(v.appt.begin)} aan de beurt`
            : `Je bent om ${hhmm(v.appt.begin)} aan de beurt`;
  return (
    <View style={{ borderRadius: R.xl, overflow: 'hidden', height: 430 }} {...fx('lift')}>
      <HeroImage style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },
          isWeb ? ({ backgroundImage: 'linear-gradient(180deg, rgba(6,11,34,0.05) 0%, rgba(6,11,34,0.15) 40%, rgba(6,11,34,0.92) 100%)' } as object) : { backgroundColor: 'rgba(6,11,34,0.45)' },
        ]}
      />
      <View style={{ position: 'absolute', top: 18, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Tag label={v.appt.start.toDateString() === v.now.toDateString() ? 'Vandaag' : 'Je volgende afspraak'} color="#140C10" bg={C.cream} />
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20, gap: 12 }}>
        <Txt v="display" size={42} color={C.white}>
          {service.short}
        </Txt>
        <Row gap={8}>
          <View {...fx(`dye-${stylist.chroma}`)} style={{ width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: glow(stylist.chroma) }}>
            <Txt v="h3" size={13} color="#140C10" weight="800">
              {stylist.name[0]}
            </Txt>
          </View>
          <Txt v="body" color="rgba(255,255,255,0.86)" style={{ flex: 1 }}>
            {status}
          </Txt>
        </Row>
        <Row gap={10}>
          {v.phase === 'later' && !live.checkedIn ? (
            <Button title="Check in" icon="qr" size="md" onPress={() => router.push('/live')} />
          ) : v.phase === 'done' ? (
            <Button title="Betalen & fooi" icon="card" size="md" onPress={() => router.push('/betalen')} />
          ) : (
            <Button title="Live volgen" icon="timer" size="md" onPress={() => router.push('/live')} />
          )}
          <Button title="Drankje" icon="cup" kind="glass" size="md" onPress={() => router.push('/drankje')} />
        </Row>
      </View>
    </View>
  );
}

function SalonNow() {
  const floor = useFloor();
  const busy = floor.busyLabel;
  const taken = floor.chairs.filter((c) => c.appt).length;
  return (
    <Glass pad={18} style={{ gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8}>
          <LiveDot alert={busy === 'Vol'} />
          <Txt v="label" color={C.soft}>
            Nu in de salon{floor.demo ? ' · demo' : ''}
          </Txt>
        </Row>
        <Txt v="num" color={C.muted}>
          {hhmm(floor.now)}
        </Txt>
      </Row>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 4 }}>
          <Txt v="title" ink={busy === 'Rustig' ? 'ijs' : busy === 'Gezellig druk' ? 'honing' : 'kers'}>
            {busy}
          </Txt>
          <Txt v="small" color={C.muted}>
            {taken} van {floor.staff.length} stoelen bezet · {floor.waiting.length} wachtend
          </Txt>
        </View>
        <Chairs floor={floor} size={26} />
      </Row>
      <Row gap={10}>
        <View style={{ flex: 1, padding: 12, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.05)', gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Inloop wachttijd
          </Txt>
          <Txt v="h2" size={20}>
            ± {floor.walkInWait} min
          </Txt>
        </View>
        <View style={{ flex: 1, padding: 12, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.05)', gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Eerste vrije stoel
          </Txt>
          <Txt v="h2" size={20}>
            {floor.nextFree ? `${hhmm(floor.nextFree.at)}` : 'Morgen'}
          </Txt>
          {floor.nextFree ? (
            <Txt v="small" color={C.muted}>
              bij {floor.nextFree.stylist.name.split(' ')[0]}
            </Txt>
          ) : null}
        </View>
      </Row>
      <Button title="Zet me in de inloopwachtrij" icon="door" kind="glass" full onPress={() => router.push('/salon')} />
    </Glass>
  );
}

function FeatureRail() {
  return (
    <View>
      <View style={{ paddingHorizontal: PAD }}>
        <SectionHead kicker="Nieuw in de app" title="Twintig dingen die je hier kunt" action="Alles" onAction={() => router.push('/nieuw')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 12 }}>
        {FEATURES.map((f) => (
          <Press
            key={f.id}
            onPress={() => router.push(f.path as never)}
            fxNames={`dye-${f.chroma} grain lift`}
            style={{ width: 168, height: 214, borderRadius: R.lg, padding: 16, justifyContent: 'space-between', backgroundColor: CH[f.chroma].stops[1], overflow: 'hidden' }}
          >
            <Txt v="hero" size={58} color="#140C10" style={{ opacity: 0.9 }}>
              {String(f.no).padStart(2, '0')}
            </Txt>
            <View style={{ gap: 6 }}>
              <Txt v="h3" color="#140C10" size={17} weight="700">
                {f.title}
              </Txt>
              <Txt v="small" color="rgba(20,12,16,0.78)" numberOfLines={3}>
                {f.line}
              </Txt>
            </View>
          </Press>
        ))}
      </ScrollView>
    </View>
  );
}

function LooksTeaser() {
  const picks = ['honey-babylights', 'cherry-cola', 'ice-blonde'].map((id) => LOOKS.find((l) => l.id === id)!);
  return (
    <Press onPress={() => router.push('/looks')} scaleTo={0.985} style={{ height: 300, borderRadius: R.xl, overflow: 'hidden' }} fxNames="glass lift">
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {picks.map((look, i) => (
          <View
            key={look.id}
            style={{
              position: 'absolute',
              width: 150,
              height: 210,
              borderRadius: 22,
              overflow: 'hidden',
              transform: [{ translateX: (i - 1) * 86 }, { rotate: `${(i - 1) * 9}deg` }, { translateY: i === 1 ? -18 : 6 }],
              borderWidth: 2,
              borderColor: 'rgba(16,28,72,0.18)',
              zIndex: i === 1 ? 2 : 1,
            }}
          >
            <HairArt colours={look.colours} texture={look.texture} seed={look.id} style={{ flex: 1 }} background="#120C10" />
            <View style={{ position: 'absolute', left: 10, bottom: 10 }}>
              <Tag label={look.name} color="#140C10" bg={C.cream} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Txt v="label" color={C.muted}>
            Look-deck
          </Txt>
          <Txt v="h2">Swipe je volgende look</Txt>
        </View>
        <View {...fx('dye-chroma')} style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue }}>
          <Icon name="arrow" size={20} color="#FFFFFF" />
        </View>
      </View>
    </Press>
  );
}

function MenuPreview() {
  return (
    <View style={{ gap: 10 }}>
      {CATEGORIES.map((c) => {
        const prices = servicesIn(c.id).flatMap((s) => s.options.map((o) => o.price)).filter((p) => p > 0);
        const from = Math.min(...prices);
        return (
          <Press
            key={c.id}
            onPress={() => router.push({ pathname: '/boeken', params: { cat: c.id } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(16,28,72,0.08)' }}
          >
            <View {...fx(`dye-${c.chroma}`)} style={{ width: 10, height: 44, borderRadius: 5, backgroundColor: CH[c.chroma].stops[1] }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="h3" size={17}>
                {c.name}
              </Txt>
              <Txt v="small" color={C.muted}>
                {c.line}
              </Txt>
            </View>
            <Txt v="num" color={C.soft}>
              {c.id === 'extensions' ? '€ 3,50/streng' : `vanaf ${euro(from)}`}
            </Txt>
            <Icon name="chevron" size={16} color={C.muted} />
          </Press>
        );
      })}
    </View>
  );
}

function ShopPicks() {
  const { addToCart } = useDemo();
  const picks = [...productsAfter('uitgroei'), ...PRODUCTS.filter((p) => p.id === 'olaplex-3' || p.id === 'olaplex-7')].slice(0, 4);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 12 }}>
      {picks.map((p) => (
        <View
          key={p.id}
          {...fx('glass lift')}
          style={{ width: 172, borderRadius: R.lg, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)', backgroundColor: 'rgba(16,28,72,0.03)' }}
        >
          <Press onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityLabel={`${p.line} ${p.name}`} style={{ gap: 10 }}>
            <View style={{ height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.05)' }}>
              <Bottle product={p} height={124} />
            </View>
            <Txt v="label" color={C.muted} size={9}>
              {p.brand}
            </Txt>
            <Txt v="h3" size={14} numberOfLines={2}>
              {p.line} {p.name}
            </Txt>
          </Press>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="num">{euro(p.price)}</Txt>
            <Press
              onPress={() => addToCart(p.id)}
              accessibilityLabel={`${p.name} in je mandje`}
              style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" size={17} color={C.blue} />
            </Press>
          </Row>
        </View>
      ))}
    </ScrollView>
  );
}

function SalonCard() {
  const { now } = useClock();
  const hours = salonHours(now);
  return (
    <Glass pad={20} style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Txt v="label" color={C.muted}>
            De salon
          </Txt>
          <Txt v="title" size={26}>
            {SALON.street}
          </Txt>
          <Txt v="body" color={C.soft}>
            {SALON.postcode} {SALON.city} · bushalte {SALON.stop}
          </Txt>
        </View>
        <Tag label={hours ? `Vandaag ${String(hours.open).padStart(2, '0')}:00 – ${hours.close}:00` : 'Vandaag gesloten'} color="#140C10" bg={hours ? '#5BE3A6' : C.cream} />
      </Row>
      {HOURS_TEXT.map((h) => (
        <Row key={h.days} style={{ justifyContent: 'space-between' }}>
          <Txt v="body" color={C.soft}>
            {h.days}
          </Txt>
          <Txt v="num">{h.hours}</Txt>
        </Row>
      ))}
      <Row gap={8} wrap>
        <Button title="Route" icon="route" kind="cream" size="sm" onPress={() => Linking.openURL(SALON.maps)} />
        <Button title="Bellen" icon="phone" kind="glass" size="sm" onPress={() => Linking.openURL(`tel:${SALON.phoneIntl}`)} />
        <Button title="Over de salon" icon="info" kind="glass" size="sm" onPress={() => router.push('/salon-info')} />
      </Row>
    </Glass>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { now, demo } = useClock();
  const v = useVisit();
  const hello = `${greeting(now)},`;
  const heroSize = Math.min(58, Math.floor((Math.min(width, MAX_WIDTH) - PAD * 2) / (hello.length * 0.53)));
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <Backdrop />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <View style={{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: 26 }}>
          <View style={{ paddingTop: insets.top + 64, paddingHorizontal: PAD, gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="label" color={C.muted}>
                {dayLong(now)} · {hhmm(now)}
                {demo ? ' · demo' : ''}
              </Txt>
              <Press onPress={() => router.push('/nieuw')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="grid" size={15} color={C.soft} />
                <Txt v="label" color={C.soft}>
                  20 nieuw
                </Txt>
              </Press>
            </Row>
            <View>
              <Txt v="hero" size={heroSize}>
                {hello}
              </Txt>
              <Txt v="hero" size={heroSize} ink="chroma">
                {MEMBER.first}.
              </Txt>
            </View>
          </View>
          <View style={{ paddingHorizontal: PAD }}>
            <VisitHero />
          </View>
          <View style={{ paddingHorizontal: PAD }}>
            <SalonNow />
          </View>
          <FeatureRail />
          <Row gap={12} style={{ paddingHorizontal: PAD, alignItems: 'stretch' }}>
            <FrizzDial onPress={() => router.push('/frizz')} />
            <RegrowthGauge now={now} done={v.phase === 'done'} onPress={() => router.push('/uitgroei')} />
          </Row>
          <View style={{ paddingHorizontal: PAD }}>
            <LooksTeaser />
          </View>
          <View style={{ paddingHorizontal: PAD }}>
            <SectionHead kicker="Menu & prijzen" title="Book now" action="Alles" onAction={() => router.push('/boeken')} />
            <MenuPreview />
          </View>
          <View>
            <View style={{ paddingHorizontal: PAD }}>
              <SectionHead kicker="Bij jouw kleur" title="Ophalen in de salon" action="Shop" onAction={() => router.push('/shop')} />
            </View>
            <ShopPicks />
          </View>
          <View style={{ paddingHorizontal: PAD }}>
            <SalonCard />
          </View>
          <View style={{ paddingHorizontal: PAD, gap: 6, alignItems: 'center' }}>
            <Txt v="label" color={C.faint} align="center">
              Demo · fictieve klanten en team · niets wordt echt geboekt of betaald
            </Txt>
            <Txt v="small" color={C.faint} align="center">
              Menu, prijzen, adres en openingstijden zijn van {SALON.fullName}.
            </Txt>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
