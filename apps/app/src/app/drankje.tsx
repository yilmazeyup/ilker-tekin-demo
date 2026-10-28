import { CHROMA, DRINKS, drinkById, MEMBER, type DrinkId } from '@ilker/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Bar, Button, DemoNote, Glass, Press, Row, Tag, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, R } from '../theme';

const STAGES = ['Besteld', 'Wordt gemaakt', 'Onderweg', 'Bij je stoel'];

/** Feature 10: order a drink to your chair; the salon sees it on its screen and brings it. */
export default function Drink() {
  const { live, orderDrink } = useDemo();
  const v = useVisit();
  const toast = useToast();
  const [pick, setPick] = useState<DrinkId>(MEMBER.drink);
  const ordered = live.drink;
  const age = ordered ? v.now.getTime() - ordered.at.getTime() : 0;
  const stage = !ordered ? -1 : age < 60000 ? 0 : age < 180000 ? 1 : age < 240000 ? 2 : 3;
  const where = v.phase === 'now' ? `stoel ${v.appt.chair + 1}` : v.checkedIn ? 'de wachtruimte' : 'je stoel zodra je er bent';

  return (
    <Screen back title="Drankje aan je stoel" kicker="Bar">
      {ordered && stage < 3 ? (
        <Glass tint="mocha" style={{ gap: 14 }} pad={20}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Tag label={STAGES[stage]} color="#140C10" bg={CHROMA.honing.stops[1]} />
            <Txt v="num" color={C.muted}>
              naar {where}
            </Txt>
          </Row>
          <Txt v="title">{drinkById(ordered.id).name}</Txt>
          <Bar value={(stage + 1) / 4} chroma="honing" height={8} />
          <Row style={{ justifyContent: 'space-between' }}>
            {STAGES.map((s, i) => (
              <Txt key={s} v="small" size={11} color={i <= stage ? C.text : C.faint}>
                {s}
              </Txt>
            ))}
          </Row>
        </Glass>
      ) : null}
      <View style={{ gap: 10 }}>
        {DRINKS.map((d) => {
          const on = pick === d.id;
          return (
            <Press
              key={d.id}
              onPress={() => setPick(d.id)}
              accessibilityState={{ selected: on }}
              fxNames={on ? '' : 'glass'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: R.md,
                borderWidth: 1,
                borderColor: on ? 'transparent' : 'rgba(16,28,72,0.11)',
                backgroundColor: on ? C.blue : 'transparent',
              }}
            >
              <View {...fx(on ? '' : 'dye-mocha')} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#FFFFFF' : CHROMA.mocha.stops[1] }}>
                <Icon name={d.hot ? 'cup' : 'drop'} size={20} color={on ? C.blue : '#140C10'} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" color={on ? '#FFFFFF' : C.text}>
                  {d.name}
                </Txt>
                <Txt v="small" color={on ? 'rgba(255,255,255,0.8)' : C.muted}>
                  {d.line}
                </Txt>
              </View>
              {d.id === MEMBER.drink ? <Tag label="Jouw vaste" color={on ? C.blue : '#140C10'} bg={on ? '#FFFFFF' : C.cream} /> : null}
            </Press>
          );
        })}
      </View>
      <Button
        title={`Bestel naar ${where}`}
        icon="cup"
        full
        size="lg"
        chroma="honing"
        onPress={() => {
          orderDrink(pick);
          toast(`${drinkById(pick).name} besteld`, { text: 'Kim brengt hem zo. De salon ziet je bestelling op het scherm.', icon: 'cup' });
        }}
      />
      <DemoNote text="Een demo-drankenkaart: de salon bepaalt zelf wat er op staat. Je bestelling verschijnt in het beheer bij jouw stoel." />
    </Screen>
  );
}
