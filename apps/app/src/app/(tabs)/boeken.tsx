import { CATEGORIES, CHROMA, LENGTHS, MEMBER, minutesLabel, optionOf, priceLabel, SERVICES, euro, type CategoryId, type Length, type Service } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Chip, Press, Row, Tag, Txt } from '../../components/ui';
import { C, fx, PAD, R } from '../../theme';

/** The price for the chosen length, or the range when the service has no lengths. */
function priceFor(service: Service, length: Length): string {
  if (service.perStrand || service.options.length === 1) return priceLabel(service);
  const option = service.options.find((o) => o.length === length) ?? (length === 'halflang' ? service.options.find((o) => o.length === 'kort') : null);
  return option ? `${service.from ? 'vanaf ' : ''}${euro(option.price)}` : priceLabel(service);
}

const SHORTCUTS: { title: string; line: string; icon: IconName; to: string }[] = [
  { title: 'Samen in de stoel', line: 'Twee stoelen naast elkaar', icon: 'users', to: '/duo' },
  { title: 'Bruid & events', line: 'Met proefkapsel', icon: 'rings', to: '/bruid' },
  { title: 'Extensions-planner', line: 'Strengen en prijs', icon: 'strands', to: '/extensions' },
  { title: 'Wachtlijst', line: 'Eerder terecht', icon: 'list', to: '/wachtlijst' },
];

export default function Book() {
  const params = useLocalSearchParams<{ cat?: string }>();
  const [cat, setCat] = useState<CategoryId | 'alles'>((params.cat as CategoryId) ?? 'alles');
  const [length, setLength] = useState<Length>(MEMBER.length);
  const shown = CATEGORIES.filter((c) => cat === 'alles' || c.id === cat);
  return (
    <Screen title="Book now" kicker="Menu en prijzen van de salon" tabs>
      <Txt v="body" color={C.soft}>
        Prijzen gaan per haarlengte. Bij knippen en kleuren is föhnen inbegrepen. Hetzelfde menu als op de site van de salon.
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
        <Chip label="Alles" on={cat === 'alles'} onPress={() => setCat('alles')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name} on={cat === c.id} chroma={c.chroma} onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>
      <View {...fx('glass')} style={{ borderRadius: R.md, padding: 6, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}>
        {LENGTHS.map((l) => {
          const on = l.id === length;
          return (
            <Press
              key={l.id}
              onPress={() => setLength(l.id)}
              accessibilityState={{ selected: on }}
              style={{ flex: 1, paddingVertical: 9, borderRadius: R.sm, alignItems: 'center', backgroundColor: on ? C.blue : 'transparent' }}
            >
              <Txt v="h3" size={14} color={on ? '#FFFFFF' : C.text}>
                {l.label}
              </Txt>
              <Txt v="small" size={11} color={on ? 'rgba(255,255,255,0.8)' : C.muted}>
                {l.hint}
              </Txt>
            </Press>
          );
        })}
      </View>
      {cat === 'alles' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
          {SHORTCUTS.map((s) => (
            <Press
              key={s.to}
              onPress={() => router.push(s.to as never)}
              fxNames="glass"
              style={{ width: 150, padding: 14, gap: 10, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)', backgroundColor: 'rgba(16,28,72,0.03)' }}
            >
              <Icon name={s.icon} size={22} color={C.blue} />
              <View style={{ gap: 2 }}>
                <Txt v="h3" size={14}>
                  {s.title}
                </Txt>
                <Txt v="small" size={12} color={C.muted}>
                  {s.line}
                </Txt>
              </View>
            </Press>
          ))}
        </ScrollView>
      ) : null}
      {shown.map((c) => (
        <View key={c.id} style={{ gap: 10 }}>
          <Row gap={10} style={{ marginTop: 6 }}>
            <View {...fx(`dye-${c.chroma}`)} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: CHROMA[c.chroma].stops[1] }} />
            <Txt v="title" size={26}>
              {c.name}
            </Txt>
          </Row>
          {SERVICES.filter((s) => s.category === c.id).map((s) => (
            <Press
              key={s.id}
              onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: s.id, length } })}
              fxNames="glass"
              style={{ borderRadius: R.md, padding: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(16,28,72,0.11)', backgroundColor: 'rgba(255,255,255,0.025)' }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={12}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt v="h3" size={17}>
                    {s.short}
                  </Txt>
                  <Txt v="small" color={C.muted} numberOfLines={2}>
                    {s.blurb}
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Txt v="num" size={15} ink={c.chroma}>
                    {priceFor(s, length)}
                  </Txt>
                  <Txt v="small" size={12} color={C.muted}>
                    {s.perStrand ? optionOf(s).minutes + ' min' : minutesLabel(s)}
                  </Txt>
                </View>
              </Row>
              <Row gap={6} wrap>
                {s.popular ? <Tag label="Populair" color="#140C10" bg={CHROMA[c.chroma].stops[0]} /> : null}
                {s.olaplex ? <Tag label="Met Olaplex" /> : null}
                {s.from ? <Tag label="Vanaf-prijs" /> : null}
                {s.perStrand ? <Tag label="Per streng" /> : null}
                {s.options.length > 1 ? <Tag label={`${s.options.length} lengtes`} /> : null}
              </Row>
            </Press>
          ))}
        </View>
      ))}
      <Txt v="small" color={C.faint} align="center" style={{ marginTop: 10 }}>
        Menu en prijzen: ilkertekinhairstylist.nl, via Treatwell, oktober 2026.
      </Txt>
    </Screen>
  );
}
