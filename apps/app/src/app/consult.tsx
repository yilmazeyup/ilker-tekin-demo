import { CHROMA, LOOKS, stylistById, clock as hhmm, relativeDay } from '@ilker/shared';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { HairArt } from '../components/HairArt';
import { Icon } from '../components/Icon';
import { PhotoPicker } from '../components/PhotoPicker';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Chip, DemoNote, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { tr } from '../i18n';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, FONT, PAD, R } from '../theme';

const HISTORY = ['Henna gebruikt', 'Zelf geverfd (box dye)', 'Geblondeerd', 'Keratine gehad', 'Zwanger of borstvoeding', 'Gevoelige hoofdhuid'];

/** Feature 4: before the visit, a photo of your hair now and of your dream look; your stylist sees them in the salon's screen. */
export default function Consult() {
  const { consult, setConsult, sendConsult, saved, live } = useDemo();
  const v = useVisit();
  const toast = useToast();
  const stylist = stylistById(v.appt.stylist);
  const [dreamMode, setDreamMode] = useState<'look' | 'photo'>(consult.dream ? 'photo' : 'look');
  const looks = LOOKS.filter((l) => saved.includes(l.id)).concat(LOOKS.filter((l) => !saved.includes(l.id) && l.service !== 'heren')).slice(0, 8);
  const sent = !!consult.sent || live.consultSent;
  const ready = !!consult.now && (!!consult.dream || !!consult.look);

  return (
    <Screen back title="Consult vooraf" kicker={`Voor ${stylist.name} · ${relativeDay(v.appt.start, v.now)} ${hhmm(v.appt.start)}`}>
      <Txt v="body" color={C.soft}>
        Twee foto's en een paar vragen, zodat {stylist.name} je kleur kan voorbereiden voor je binnenkomt.
      </Txt>
      <Glass style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">1 · Je haar nu</Txt>
          {consult.now ? <Icon name="check" size={18} color={C.ok} /> : null}
        </Row>
        <PhotoPicker label="Foto van je haar nu" value={consult.now ?? null} onChange={(uri) => setConsult({ now: uri ?? undefined })} height={220} />
        <Txt v="small" color={C.muted}>
          Tip: bij daglicht, van achteren en van opzij.
        </Txt>
      </Glass>
      <Glass style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">2 · Je droomlook</Txt>
          {consult.dream || consult.look ? <Icon name="check" size={18} color={C.ok} /> : null}
        </Row>
        <Row gap={8}>
          <Chip label="Uit de looks" on={dreamMode === 'look'} onPress={() => setDreamMode('look')} icon="sparkle" />
          <Chip label="Eigen foto" on={dreamMode === 'photo'} onPress={() => setDreamMode('photo')} icon="image" />
        </Row>
        {dreamMode === 'look' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}>
            {looks.map((l) => {
              const on = consult.look === l.id;
              return (
                <Press key={l.id} onPress={() => setConsult({ look: on ? undefined : l.id, dream: undefined })} accessibilityState={{ selected: on }} style={{ width: 118, gap: 6 }}>
                  <View style={{ height: 150, borderRadius: R.md, overflow: 'hidden', borderWidth: 2, borderColor: on ? CHROMA[l.chroma].glow : 'transparent' }}>
                    <HairArt colours={l.colours} texture={l.texture} seed={l.id} style={{ flex: 1 }} />
                    {saved.includes(l.id) ? (
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Icon name="heart" size={16} color="#FF5C93" fill="#FF5C93" />
                      </View>
                    ) : null}
                  </View>
                  <Txt v="small" weight="600" numberOfLines={1}>
                    {l.name}
                  </Txt>
                </Press>
              );
            })}
          </ScrollView>
        ) : (
          <PhotoPicker label="Foto van je droomlook" value={consult.dream ?? null} onChange={(uri) => setConsult({ dream: uri ?? undefined, look: undefined })} height={200} />
        )}
      </Glass>
      <Glass style={{ gap: 12 }}>
        <Txt v="h3">3 · Goed om te weten</Txt>
        <Row gap={8} wrap>
          {HISTORY.map((h) => (
            <Chip
              key={h}
              label={h}
              on={consult.history.includes(h)}
              chroma="violet"
              onPress={() => setConsult({ history: consult.history.includes(h) ? consult.history.filter((x) => x !== h) : [...consult.history, h] })}
            />
          ))}
        </Row>
        <TextInput
          value={consult.notes}
          onChangeText={(notes) => setConsult({ notes })}
          placeholder={tr('Iets anders? Bijvoorbeeld: niet te koel, pony laten staan…')}
          placeholderTextColor={C.faint}
          multiline
          style={{ minHeight: 80, padding: 14, borderRadius: R.md, backgroundColor: 'rgba(16,28,72,0.06)', color: C.text, fontFamily: FONT.sans, fontSize: 15, textAlignVertical: 'top' }}
        />
      </Glass>
      {sent ? (
        <Glass tint="violet" style={{ gap: 6 }}>
          <Tag label="Verstuurd" color={C.white} bg={C.ok} />
          <Txt v="h3">{stylist.name} heeft je consult</Txt>
          <Txt v="body" color={C.soft}>
            Je foto's staan op het scherm van de salon, bij je afspraak. Je kunt ze hier nog aanpassen en opnieuw sturen.
          </Txt>
        </Glass>
      ) : null}
      <Button
        title={sent ? 'Opnieuw sturen' : `Stuur naar ${stylist.name}`}
        icon="arrowUpRight"
        size="lg"
        full
        chroma="violet"
        disabled={!ready}
        onPress={() => {
          sendConsult();
          toast('Consult verstuurd', { text: `${stylist.name} ziet je foto's in de salon.`, icon: 'camera' });
        }}
      />
      <View style={{ paddingHorizontal: PAD * 0 }}>
        <DemoNote text="Je foto's blijven in deze browser: ze gaan alleen naar het beheer van deze demo, niet naar een server." />
      </View>
    </Screen>
  );
}
