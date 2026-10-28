import { CHROMA, LOOKS, priceLabel, serviceById, stylistById, type Look } from '@ilker/shared';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, useWindowDimensions, View } from 'react-native';

import { HairArt } from '../../components/HairArt';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Chip, nativeDriver, Press, Row, Tag, tap, Txt } from '../../components/ui';
import { useDemo } from '../../state/demo';
import { C, fx, MAX_WIDTH, PAD, R } from '../../theme';

const upkeep = (n: number) => ['', 'Weinig onderhoud', 'Gemiddeld onderhoud', 'Veel onderhoud'][n];

function LookFace({ look, height }: { look: Look; height: number }) {
  const service = serviceById(look.service);
  const by = stylistById(look.by);
  const streaks = look.service === 'babylights' || look.service === 'highlights' ? 0.3 : look.service === 'balayage' || look.service === 'airtouch' ? 0.18 : 0;
  return (
    <View style={{ height, borderRadius: R.xl, overflow: 'hidden', backgroundColor: C.deep }}>
      <HairArt colours={look.colours} texture={look.texture} seed={look.id} streaks={streaks} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.55 }, { backgroundImage: 'linear-gradient(180deg, rgba(6,11,34,0) 0%, rgba(6,11,34,0.88) 75%)' } as object]}
      />
      <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Tag label={look.tags[0]} color="#140C10" bg={CHROMA[look.chroma].stops[0]} />
        <Tag label="3D-render" color={C.white} bg="rgba(6,11,34,0.45)" />
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18, gap: 6 }}>
        <Txt v="display" size={36} color={C.white}>
          {look.name}
        </Txt>
        <Txt v="body" color="rgba(255,255,255,0.85)" numberOfLines={2}>
          {look.line}
        </Txt>
        <Row gap={8} style={{ marginTop: 4 }} wrap>
          <Tag label={service.short} color={C.white} bg="rgba(255,255,255,0.16)" />
          <Tag label={priceLabel(service)} color={C.white} bg="rgba(255,255,255,0.16)" />
          <Tag label={`${by.name} · ${upkeep(look.upkeep)}`} color={C.white} bg="rgba(255,255,255,0.16)" />
        </Row>
      </View>
    </View>
  );
}

function Deck() {
  const { saved, toggleSaved } = useDemo();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const cardW = Math.min(width, MAX_WIDTH) - PAD * 2;
  const height = Math.round(cardW * 1.32);
  const deck = useMemo(() => LOOKS.filter((l) => l.service !== 'heren'), []);
  const [index, setIndex] = useState(0);
  const pos = useRef(new Animated.ValueXY()).current;
  const current = deck[index % deck.length];
  const next = deck[(index + 1) % deck.length];

  const decide = (save: boolean) => {
    tap(save ? 'success' : 'light');
    if (save && !saved.includes(current.id)) {
      toggleSaved(current.id);
      toast(`${current.name} bewaard`, { text: `${stylistById(current.by).name} ziet hem bij je volgende afspraak.`, icon: 'heart' });
    }
    Animated.timing(pos, { toValue: { x: (save ? 1 : -1) * (cardW + 120), y: 30 }, duration: 260, useNativeDriver: nativeDriver }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      setIndex((i) => i + 1);
    });
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > 110) decide(true);
          else if (g.dx < -110) decide(false);
          else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: nativeDriver, stiffness: 260, damping: 18 }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, saved],
  );

  const rotate = pos.x.interpolate({ inputRange: [-cardW, 0, cardW], outputRange: ['-14deg', '0deg', '14deg'] });
  const like = pos.x.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });
  const nope = pos.x.interpolate({ inputRange: [-100, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ gap: 18 }}>
      <View style={{ height }}>
        <View style={{ position: 'absolute', top: 14, left: 10, right: 10, opacity: 0.6, transform: [{ scale: 0.95 }] }}>
          <LookFace look={next} height={height} />
        </View>
        <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }}>
          <LookFace look={current} height={height} />
          <Animated.View style={{ position: 'absolute', top: 60, left: 20, opacity: like, transform: [{ rotate: '-10deg' }] }}>
            <Tag label="Bewaren" color={C.white} bg={C.ok} />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', top: 60, right: 20, opacity: nope, transform: [{ rotate: '10deg' }] }}>
            <Tag label="Volgende" color="#140C10" bg={C.cream} />
          </Animated.View>
        </Animated.View>
      </View>
      <Row style={{ justifyContent: 'center' }} gap={16}>
        <Press
          onPress={() => decide(false)}
          accessibilityLabel="Volgende look"
          fxNames="glass"
          style={{ width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,28,72,0.16)' }}
        >
          <Icon name="close" size={24} />
        </Press>
        <Press
          onPress={() => router.push({ pathname: '/kleurstudio', params: { look: current.id } })}
          accessibilityLabel="Probeer deze kleur"
          fxNames="glass"
          style={{ height: 62, paddingHorizontal: 20, borderRadius: 22, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,28,72,0.16)' }}
        >
          <Icon name="wand" size={20} />
          <Txt v="h3">Pas de kleur</Txt>
        </Press>
        <Press
          onPress={() => decide(true)}
          accessibilityLabel="Bewaar deze look"
          fxNames="dye-chroma sheen"
          style={{ width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue }}
        >
          <Icon name="heart" size={24} color="#FFFFFF" fill="#FFFFFF" />
        </Press>
      </Row>
      <Txt v="small" color={C.muted} align="center">
        Swipe naar rechts om te bewaren. Je stylist ziet je bewaarde looks bij je afspraak.
      </Txt>
    </View>
  );
}

function Saved() {
  const { saved, toggleSaved } = useDemo();
  const { width } = useWindowDimensions();
  const w = (Math.min(width, MAX_WIDTH) - PAD * 2 - 12) / 2;
  const looks = LOOKS.filter((l) => saved.includes(l.id));
  if (!looks.length)
    return (
      <Txt v="body" color={C.soft}>
        Nog niets bewaard. Swipe een look naar rechts.
      </Txt>
    );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {looks.map((l) => (
        <View key={l.id} style={{ width: w, gap: 8 }}>
          <Press onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: l.service } })} style={{ height: w * 1.25, borderRadius: R.lg, overflow: 'hidden' }}>
            <HairArt colours={l.colours} texture={l.texture} seed={l.id} style={{ flex: 1 }} />
          </Press>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="h3" size={14} style={{ flex: 1 }} numberOfLines={1}>
              {l.name}
            </Txt>
            <Press onPress={() => toggleSaved(l.id)} accessibilityLabel={`${l.name} niet meer bewaren`}>
              <Icon name="heart" size={18} color="#FF5C93" fill="#FF5C93" />
            </Press>
          </Row>
          <Txt v="small" color={C.muted}>
            {serviceById(l.service).short} · {stylistById(l.by).name}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export default function Looks() {
  const { saved } = useDemo();
  const [tab, setTab] = useState<'deck' | 'saved'>('deck');
  return (
    <Screen title="Swipe je look" kicker="Look-deck" tabs>
      <Row gap={8}>
        <Chip label="Ontdekken" on={tab === 'deck'} onPress={() => setTab('deck')} icon="sparkle" />
        <Chip label={`Bewaard · ${saved.length}`} on={tab === 'saved'} onPress={() => setTab('saved')} icon="heart" />
      </Row>
      {tab === 'deck' ? <Deck /> : <Saved />}
      <View {...fx('glass')} style={{ borderRadius: R.lg, padding: 6, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}>
        {[
          { title: 'Kleur passen', line: 'Probeer een kleur op je eigen foto', icon: 'wand' as const, to: '/kleurstudio' },
          { title: 'Portfolio’s', line: 'Het werk van elke stylist', icon: 'users' as const, to: '/team' },
          { title: 'Haarquiz', line: 'Jouw routine in zes vragen', icon: 'flask' as const, to: '/quiz' },
        ].map((item) => (
          <Press key={item.to} onPress={() => router.push(item.to as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
            <Icon name={item.icon} size={22} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Txt v="h3">{item.title}</Txt>
              <Txt v="small" color={C.muted}>
                {item.line}
              </Txt>
            </View>
            <Icon name="chevron" size={16} color={C.muted} />
          </Press>
        ))}
      </View>
      <Button title="Boek je favoriete look" icon="scissors" full onPress={() => router.push('/boeken')} />
    </Screen>
  );
}
