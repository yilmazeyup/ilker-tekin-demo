import { LOOKS, MEMBER, serviceById, STYLISTS, stylistById, type StylistId } from '@ilker/shared';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { HairArt } from '../components/HairArt';
import { Icon } from '../components/Icon';
import { PhotoPicker } from '../components/PhotoPicker';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, DemoNote, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, FONT, R } from '../theme';

const TAGS = ['Precies wat ik wilde', 'Mooie kleur', 'Goed advies', 'Op tijd', 'Lekkere koffie', 'Fijne sfeer'];

/** Feature 16: a review with a photo after the visit. Your own reviews only: the demo shows no made-up ones. */
export default function Review() {
  const v = useVisit();
  const { reviews, addReview } = useDemo();
  const toast = useToast();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>(['Mooie kleur']);
  const [photo, setPhoto] = useState<string | null>(null);
  const [stylist, setStylist] = useState<StylistId>(v.appt.stylist);
  const look = LOOKS.find((l) => l.id === MEMBER.looks[0])!;

  return (
    <Screen back title="Hoe was het?" kicker="Review met foto">
      <Glass style={{ gap: 16 }} pad={20}>
        <Row gap={8} wrap>
          {STYLISTS.map((s) => (
            <Chip key={s.id} label={s.name.split(' ')[0]} on={stylist === s.id} chroma={s.chroma} onPress={() => setStylist(s.id)} />
          ))}
        </Row>
        <Row gap={6} style={{ justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Press key={n} onPress={() => setStars(n)} accessibilityLabel={`${n} sterren`} scaleTo={0.85}>
              <Icon name="star" size={40} color={n <= stars ? '#FFC24B' : C.faint} fill={n <= stars ? '#FFC24B' : undefined} />
            </Press>
          ))}
        </Row>
        <Row gap={8} wrap>
          {TAGS.map((t) => (
            <Chip key={t} label={t} on={tags.includes(t)} chroma="honing" onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
          ))}
        </Row>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Vertel iets over je ${serviceById(v.appt.service).short.toLowerCase()}…`}
          placeholderTextColor={C.faint}
          multiline
          style={{ minHeight: 96, padding: 14, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.06)', color: C.text, fontFamily: FONT.sans, fontSize: 15, textAlignVertical: 'top' }}
        />
        <PhotoPicker label="Foto van je nieuwe look" value={photo} onChange={setPhoto} height={220} />
      </Glass>
      <Button
        title="Plaats review · + 25 punten"
        icon="chat"
        full
        size="lg"
        onPress={() => {
          addReview({ stars, text: text.trim() || tags.join(', '), stylist, service: v.appt.service, photo: photo ?? undefined, tags });
          setText('');
          setPhoto(null);
          toast('Bedankt voor je review', { text: `${stylistById(stylist).name} ziet hem meteen. + 25 punten.`, icon: 'star' });
        }}
      />
      {reviews.length ? (
        <View style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            Jouw reviews
          </Txt>
          {reviews.map((r) => (
            <Glass key={r.id} style={{ gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={2}>
                  {Array.from({ length: r.stars }, (_, i) => (
                    <Icon key={i} name="star" size={15} color="#FFC24B" fill="#FFC24B" />
                  ))}
                </Row>
                <Tag label={`${stylistById(r.stylist).name} · ${serviceById(r.service).short}`} />
              </Row>
              {r.photo ? (
                <View style={{ height: 180, borderRadius: R.md, overflow: 'hidden' }}>
                  <PhotoPicker.Preview uri={r.photo} />
                </View>
              ) : (
                <View style={{ height: 120, borderRadius: R.md, overflow: 'hidden' }}>
                  <HairArt colours={look.colours} texture={look.texture} seed={`review-${r.id}`} style={{ flex: 1 }} />
                </View>
              )}
              <Txt v="body" color={C.soft}>
                {r.text}
              </Txt>
            </Glass>
          ))}
        </View>
      ) : null}
      <DemoNote text="De demo toont alleen reviews die je hier zelf schrijft. Er staan geen verzonnen reviews in." />
    </Screen>
  );
}
