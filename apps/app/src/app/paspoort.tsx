import { ago, CHROMA, dateLong, euro, memberHistory, MEMBER, productById, serviceById, stylistById } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Button, Glass, Row, Tag, Txt } from '../components/ui';
import { useClock } from '../state/clock';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, R } from '../theme';

/** Feature 5: the hair passport. Every visit, the colour formula, and what was used in the chair and bought for home. */
export default function Passport() {
  const { now } = useClock();
  const { payment } = useDemo();
  const v = useVisit();
  const history = memberHistory(now);
  const formula = history.find((h) => h.formula)?.formula;
  const total = history.reduce((s, h) => s + h.price, 0);

  return (
    <Screen back title="Haarpaspoort" kicker={`${MEMBER.name} · sinds ${MEMBER.sinceYear}`}>
      <View {...fx('dye-mocha grain')} style={{ borderRadius: R.xl, padding: 22, gap: 18, backgroundColor: CHROMA.mocha.stops[1], overflow: 'hidden' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="label" color="#140C10">
            İlker Tekin · Haarpaspoort
          </Txt>
          <Icon name="book" size={22} color="#140C10" />
        </Row>
        <Txt v="display" color="#140C10">
          {MEMBER.first}
        </Txt>
        <Row gap={18}>
          {[
            { k: 'Lengte', v: 'Halflang' },
            { k: 'Basis', v: `Niveau ${MEMBER.level}` },
            { k: 'Textuur', v: 'Golvend' },
          ].map((x) => (
            <View key={x.k}>
              <Txt v="label" color="rgba(20,12,16,0.65)" size={9}>
                {x.k}
              </Txt>
              <Txt v="h3" color="#140C10">
                {x.v}
              </Txt>
            </View>
          ))}
        </Row>
      </View>

      {formula ? (
        <Glass tint="koper" style={{ gap: 12 }} pad={20}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label" color={C.muted}>
              Je kleurformule
            </Txt>
            <Tag label={`Selin · ${ago(history[0].date, now)}`} />
          </Row>
          <Txt v="h2" size={20}>
            {formula.mix}
          </Txt>
          <Row gap={16} wrap>
            <View>
              <Txt v="label" color={C.muted} size={9}>
                Ontwikkelaar
              </Txt>
              <Txt v="num">{formula.developer}</Txt>
            </View>
            <View>
              <Txt v="label" color={C.muted} size={9}>
                Inwerktijd
              </Txt>
              <Txt v="num">{formula.minutes} min</Txt>
            </View>
          </Row>
          {formula.extra ? (
            <Txt v="small" color={C.soft}>
              {formula.extra}
            </Txt>
          ) : null}
          <Txt v="small" color={C.muted}>
            Elke stylist in de salon ziet dezelfde formule. Zo is je kleur altijd dezelfde, ook bij een ander.
          </Txt>
        </Glass>
      ) : null}

      <Row gap={10}>
        <Glass style={{ flex: 1, gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Bezoeken
          </Txt>
          <Txt v="display" size={34}>
            {history.length + (payment ? 1 : 0)}
          </Txt>
        </Glass>
        <Glass style={{ flex: 1, gap: 4 }}>
          <Txt v="label" color={C.muted} size={9}>
            Vaste stylist
          </Txt>
          <Txt v="display" size={34}>
            Selin
          </Txt>
        </Glass>
      </Row>

      <View style={{ gap: 0 }}>
        <Txt v="label" color={C.muted} style={{ marginBottom: 10 }}>
          Tijdlijn
        </Txt>
        {v.phase !== 'later' ? (
          <TimelineItem
            first
            title={serviceById(v.appt.service).short}
            meta={`Vandaag · ${stylistById(v.appt.stylist).name}`}
            body={v.phase === 'done' ? 'Net klaar. De formule van vandaag staat hierboven.' : 'Nu in de salon.'}
            chroma="kers"
          />
        ) : null}
        {history.map((h, i) => {
          const service = serviceById(h.service);
          return (
            <TimelineItem
              key={h.id}
              first={i === 0 && v.phase === 'later'}
              title={`${service.short}${h.optionId ? ` · ${h.optionId}` : ''}`}
              meta={`${dateLong(h.date)} · ${stylistById(h.stylist).name} · ${euro(h.price)}`}
              body={[h.formula ? `Formule: ${h.formula.mix}` : null, h.used.length ? `In de stoel: ${h.used.join(', ')}` : null, h.bought.length ? `Mee naar huis: ${h.bought.map((b) => productById(b)?.name ?? b).join(', ')}` : null, h.note ?? null]
                .filter(Boolean)
                .join('\n')}
              chroma={service.colour ? 'koper' : 'ijs'}
            />
          );
        })}
      </View>
      <Txt v="small" color={C.muted} align="center">
        Totaal in twee jaar: {euro(total)} · demo-gegevens
      </Txt>
      <Button title="Boek je volgende kleur" icon="scissors" full onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: 'uitgroei' } })} />
    </Screen>
  );
}

function TimelineItem({ title, meta, body, chroma, first }: { title: string; meta: string; body: string; chroma: 'koper' | 'ijs' | 'kers'; first?: boolean }) {
  return (
    <Row gap={14} style={{ alignItems: 'stretch' }}>
      <View style={{ width: 14, alignItems: 'center' }}>
        <View style={{ width: 2, height: 10, backgroundColor: first ? 'transparent' : 'rgba(16,28,72,0.12)' }} />
        <View {...fx(`dye-${chroma}`)} style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: CHROMA[chroma].stops[1] }} />
        <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(16,28,72,0.12)' }} />
      </View>
      <View style={{ flex: 1, paddingBottom: 18, gap: 4 }}>
        <Txt v="h3">{title}</Txt>
        <Txt v="small" color={C.muted}>
          {meta}
        </Txt>
        {body ? (
          <Txt v="small" color={C.soft}>
            {body}
          </Txt>
        ) : null}
      </View>
    </Row>
  );
}
