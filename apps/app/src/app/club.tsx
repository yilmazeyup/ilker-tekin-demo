import { CHROMA, euro, GIFT_AMOUNTS, GIFT_DESIGNS, MEMBER, REFERRAL, REWARDS, tierFor, TIERS } from '@ilker/shared';
import { useState } from 'react';
import { Share, TextInput, View } from 'react-native';

import { QrCode, Ring } from '../components/Art';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, DemoNote, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { C, FONT, fx, R } from '../theme';

type Tab = 'club' | 'cadeau' | 'vrienden';

/** Feature 11: the Club with levels and rewards, gift cards, and inviting a friend. All demo values. */
export default function Club() {
  const [tab, setTab] = useState<Tab>('club');
  return (
    <Screen back title="Club" kicker="İlker Tekin Club">
      <Row gap={8}>
        <Chip label="Niveaus" on={tab === 'club'} onPress={() => setTab('club')} icon="crown" />
        <Chip label="Cadeaukaart" on={tab === 'cadeau'} onPress={() => setTab('cadeau')} icon="gift" />
        <Chip label="Vriendin" on={tab === 'vrienden'} onPress={() => setTab('vrienden')} icon="users" />
      </Row>
      {tab === 'club' ? <Levels /> : tab === 'cadeau' ? <Gift /> : <Friends />}
      <DemoNote text="De Club, beloningen en cadeaukaarten zijn een demo: de salon kiest zelf de niveaus en wat je ervoor krijgt." />
    </Screen>
  );
}

function Levels() {
  const { points, redeem, vouchers } = useDemo();
  const toast = useToast();
  const { tier, next, progress } = tierFor(points);
  return (
    <>
      <View {...fx(`dye-${tier.chroma} grain`)} style={{ borderRadius: R.xl, padding: 22, gap: 16, backgroundColor: CHROMA[tier.chroma].stops[1], overflow: 'hidden' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label" color="#140C10">
            {MEMBER.name}
          </Txt>
          <Icon name="crown" size={22} color="#140C10" />
        </Row>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Txt v="hero" size={56} color="#140C10">
              {tier.name}
            </Txt>
            <Txt v="h3" color="rgba(20,12,16,0.75)">
              {points.toLocaleString('nl-NL')} punten
            </Txt>
          </View>
          <View style={{ padding: 8, borderRadius: 14, backgroundColor: C.cream }}>
            <QrCode seed={11} size={74} />
          </View>
        </Row>
        {next ? (
          <View style={{ gap: 6 }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(20,12,16,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${progress * 100}%`, height: 8, backgroundColor: '#140C10' }} />
            </View>
            <Txt v="small" color="rgba(20,12,16,0.8)">
              Nog {next.from - points} punten tot {next.name}
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 10 }}>
        {TIERS.map((t) => {
          const reached = points >= t.from;
          return (
            <Row key={t.id} gap={14} style={{ padding: 14, borderRadius: R.md, backgroundColor: t.id === tier.id ? 'rgba(16,28,72,0.08)' : 'transparent' }}>
              <Ring value={reached ? 1 : Math.min(1, points / t.from)} size={44} stroke={5} chroma={t.chroma}>
                <Icon name={reached ? 'check' : 'lock'} size={15} color={reached ? C.text : C.muted} />
              </Ring>
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={8}>
                  <Txt v="h3">{t.name}</Txt>
                  <Txt v="num" size={12} color={C.muted}>
                    vanaf {t.from}
                  </Txt>
                </Row>
                <Txt v="small" color={C.soft}>
                  {t.perks.join(' · ')}
                </Txt>
              </View>
            </Row>
          );
        })}
      </View>
      <Txt v="label" color={C.muted}>
        Inwisselen
      </Txt>
      {REWARDS.map((r) => {
        const owned = vouchers.filter((v) => v === r.id).length;
        return (
          <Glass key={r.id} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt v="h3">{r.name}</Txt>
              <Txt v="small" color={C.muted}>
                {r.line}
                {owned ? ` · ${owned}× klaar voor gebruik` : ''}
              </Txt>
            </View>
            <Button
              title={`${r.points}`}
              icon="star"
              size="sm"
              kind={points >= r.points ? 'dye' : 'glass'}
              disabled={points < r.points}
              onPress={() => {
                if (redeem(r.id)) toast(`${r.name} ingewisseld`, { text: 'Staat klaar bij je volgende afspraak.', icon: 'gift' });
              }}
            />
          </Glass>
        );
      })}
    </>
  );
}

function Gift() {
  const { buyGift, gifts } = useDemo();
  const toast = useToast();
  const [amount, setAmount] = useState(50);
  const [design, setDesign] = useState(GIFT_DESIGNS[0].id);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('Voor jouw nieuwe look. Liefs!');
  const chroma = GIFT_DESIGNS.find((d) => d.id === design)!.chroma;
  return (
    <>
      <View {...fx(`dye-${chroma} grain`)} style={{ height: 210, borderRadius: R.xl, padding: 22, justifyContent: 'space-between', backgroundColor: CHROMA[chroma].stops[1], overflow: 'hidden' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label" color="#140C10">
            Cadeaukaart
          </Txt>
          <Txt v="label" color="#140C10">
            İlker Tekin
          </Txt>
        </Row>
        <Txt v="hero" size={64} color="#140C10">
          {euro(amount)}
        </Txt>
        <Txt v="body" color="rgba(20,12,16,0.8)" numberOfLines={1}>
          {to ? `Voor ${to} · ` : ''}
          {message}
        </Txt>
      </View>
      <Row gap={8} wrap>
        {GIFT_AMOUNTS.map((a) => (
          <Chip key={a} label={euro(a)} on={amount === a} chroma={chroma} onPress={() => setAmount(a)} />
        ))}
      </Row>
      <Row gap={10}>
        {GIFT_DESIGNS.map((d) => (
          <Press
            key={d.id}
            onPress={() => setDesign(d.id)}
            accessibilityLabel={d.name}
            accessibilityState={{ selected: d.id === design }}
            fxNames={`dye-${d.chroma}`}
            style={{ flex: 1, height: 54, borderRadius: 14, borderWidth: 2, borderColor: d.id === design ? C.blue : 'transparent', backgroundColor: CHROMA[d.chroma].stops[1] }}
          />
        ))}
      </Row>
      <TextInput
        value={to}
        onChangeText={setTo}
        placeholder="Voor wie?"
        placeholderTextColor={C.faint}
        style={{ height: 52, paddingHorizontal: 16, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.06)', color: C.text, fontFamily: FONT.sans, fontSize: 15 }}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Je bericht"
        placeholderTextColor={C.faint}
        style={{ height: 52, paddingHorizontal: 16, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.06)', color: C.text, fontFamily: FONT.sans, fontSize: 15 }}
      />
      <Button
        title={`Koop voor ${euro(amount)}`}
        icon="gift"
        full
        size="lg"
        chroma={chroma}
        onPress={() => {
          const code = buyGift({ amount, design, to: to || 'een vriendin', message });
          toast('Cadeaukaart klaar', { text: `Code ${code}. Demo: niets betaald of verstuurd.`, icon: 'gift' });
        }}
      />
      {gifts.map((g) => (
        <Glass key={g.code} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="gift" size={20} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Txt v="h3">
              {euro(g.amount)} voor {g.to}
            </Txt>
            <Txt v="num" size={12} color={C.muted}>
              {g.code}
            </Txt>
          </View>
          <Tag label="Klaar" color={C.white} bg={C.ok} />
        </Glass>
      ))}
    </>
  );
}

function Friends() {
  const { invited, invite } = useDemo();
  const toast = useToast();
  const joined = REFERRAL.joined + invited;
  return (
    <>
      <Glass tint="roze" style={{ gap: 14 }} pad={22}>
        <Txt v="title">
          Jij {REFERRAL.youGet} punten, zij {euro(REFERRAL.friendGets)} korting
        </Txt>
        <Txt v="body" color={C.soft}>
          Deel je code. Boekt je vriendin haar eerste afspraak, dan krijgt zij {euro(REFERRAL.friendGets)} korting en jij {REFERRAL.youGet} punten.
        </Txt>
        <View style={{ padding: 18, borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,92,147,0.5)', alignItems: 'center', gap: 4 }}>
          <Txt v="label" color={C.muted}>
            Jouw code
          </Txt>
          <Txt v="display" size={34} ink="roze">
            {MEMBER.code}
          </Txt>
        </View>
        <Button
          title="Deel je code"
          icon="share"
          chroma="roze"
          full
          onPress={async () => {
            try {
              await Share.share({ message: `Boek bij İlker Tekin Hairstylist in Eindhoven met mijn code ${MEMBER.code}: € 10 korting op je eerste afspraak. (demo)` });
            } catch {
              // Sharing is not available here: the toast below still confirms.
            }
            invite();
            toast('Gedeeld', { text: 'Demo: er is niets echt verstuurd.', icon: 'share' });
          }}
        />
      </Glass>
      <Row gap={10}>
        <Glass style={{ flex: 1, gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Uitgenodigd
          </Txt>
          <Txt v="display" size={34}>
            {joined + 1}
          </Txt>
        </Glass>
        <Glass style={{ flex: 1, gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Geboekt
          </Txt>
          <Txt v="display" size={34}>
            {REFERRAL.joined}
          </Txt>
        </Glass>
        <Glass style={{ flex: 1, gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Verdiend
          </Txt>
          <Txt v="display" size={34}>
            {REFERRAL.joined * REFERRAL.youGet}
          </Txt>
        </Glass>
      </Row>
    </>
  );
}
