import { ABOUT, HOURS_TEXT, OLAPLEX, SALON } from '@ilker/shared';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Button, Glass, Press, Row, Txt } from '../components/ui';
import { C, fx, R } from '../theme';

/** Everything the salon's own site offers: about, hours, address, contact, socials and the Olaplex explainer. */
export default function SalonInfo() {
  const contacts: { icon: IconName; label: string; value: string; url: string }[] = [
    { icon: 'phone', label: 'Bellen', value: SALON.phone, url: `tel:${SALON.phoneIntl}` },
    { icon: 'mail', label: 'Mailen', value: SALON.email, url: `mailto:${SALON.email}` },
    { icon: 'instagram', label: 'Instagram', value: SALON.instagramHandle, url: SALON.instagram },
    { icon: 'tiktok', label: 'TikTok', value: SALON.tiktokHandle, url: SALON.tiktok },
    { icon: 'facebook', label: 'Facebook', value: 'İlker Tekin', url: SALON.facebook },
  ];
  return (
    <Screen back title="De salon" kicker={SALON.fullName}>
      <Txt v="quote" color={C.soft}>
        Welkom. Ontdek je schoonheid, heb zelfvertrouwen.
      </Txt>
      <Glass style={{ gap: 14 }} pad={20}>
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <Icon name="pin" size={22} color={C.blue} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3">{SALON.street}</Txt>
            <Txt v="body" color={C.soft}>
              {SALON.postcode} {SALON.city}
            </Txt>
            <Txt v="small" color={C.muted}>
              Dichtstbijzijnde bushalte: {SALON.stop}
            </Txt>
          </View>
        </Row>
        <Button title="Route plannen" icon="route" kind="cream" onPress={() => Linking.openURL(SALON.maps)} />
      </Glass>
      <Glass style={{ gap: 10 }} pad={20}>
        <Txt v="label" color={C.muted}>
          Openingstijden
        </Txt>
        {HOURS_TEXT.map((h) => (
          <Row key={h.days} style={{ justifyContent: 'space-between' }}>
            <Txt v="body">{h.days}</Txt>
            <Txt v="num">{h.hours}</Txt>
          </Row>
        ))}
      </Glass>
      <View style={{ gap: 8 }}>
        {contacts.map((c) => (
          <Press
            key={c.label}
            onPress={() => Linking.openURL(c.url)}
            fxNames="glass"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Icon name={c.icon} size={20} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Txt v="h3" size={15}>
                {c.label}
              </Txt>
              <Txt v="small" color={C.muted}>
                {c.value}
              </Txt>
            </View>
            <Icon name="arrowUpRight" size={16} color={C.muted} />
          </Press>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Over ons
        </Txt>
        {ABOUT.map((a) => (
          <Glass key={a.title} style={{ gap: 6 }}>
            <Txt v="h3">{a.title}</Txt>
            <Txt v="body" color={C.soft}>
              {a.text}
            </Txt>
          </Glass>
        ))}
      </View>
      <View {...fx('dye-violet grain')} style={{ borderRadius: R.xl, padding: 22, gap: 12, backgroundColor: '#8F6BFF', overflow: 'hidden' }}>
        <Txt v="label" color="#140C10">
          Merk in de salon
        </Txt>
        <Txt v="display" color="#140C10">
          {OLAPLEX.title}
        </Txt>
        <Txt v="body" color="rgba(20,12,16,0.85)">
          {OLAPLEX.intro}
        </Txt>
        {OLAPLEX.steps.map((s) => (
          <Row key={s.no} gap={12} style={{ alignItems: 'flex-start' }}>
            <Txt v="h3" color="#140C10" style={{ width: 52 }}>
              {s.no}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt v="h3" color="#140C10">
                {s.name}
              </Txt>
              <Txt v="small" color="rgba(20,12,16,0.8)">
                {s.text}
              </Txt>
            </View>
          </Row>
        ))}
      </View>
      <Button title="Book now" icon="scissors" size="lg" full onPress={() => router.push('/boeken')} />
      <Txt v="small" color={C.faint} align="center">
        Alle gegevens op deze pagina komen van ilkertekinhairstylist.nl.
      </Txt>
    </Screen>
  );
}
