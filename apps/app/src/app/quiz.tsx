import { CHROMA, euro, PRODUCTS, PROFILES, QUIZ, scoreQuiz, serviceById, type Concern } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Bottle } from '../components/Art';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Bar, Button, Glass, PopIn, Press, Row, Tag, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { C, R } from '../theme';

const CHROMA_OF: Record<Concern, 'koper' | 'honing' | 'roze' | 'violet' | 'ijs' | 'kers' | 'mocha'> = {
  repair: 'violet',
  blond: 'honing',
  colour: 'koper',
  frizz: 'ijs',
  curls: 'roze',
  volume: 'kers',
  heat: 'koper',
  extensions: 'roze',
};

/** Feature 7: six questions, a hair profile, a routine and the products and treatment that go with it. */
export default function Quiz() {
  const { quiz, setQuiz, addToCart } = useDemo();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  if (quiz) {
    const main = PROFILES[quiz[0] ?? 'repair'];
    const chroma = CHROMA_OF[main.id];
    const products = PRODUCTS.filter((p) => quiz.slice(0, 2).some((c) => p.concerns.includes(c))).slice(0, 4);
    const service = serviceById(main.service);
    return (
      <Screen back title="Jouw haarprofiel" kicker="Haarquiz">
        <PopIn>
          <Glass tint={chroma} style={{ gap: 12 }} pad={22}>
            <Tag label={quiz.length > 1 ? `Ook: ${PROFILES[quiz[1]].name}` : 'Jouw profiel'} color="#140C10" bg={CHROMA[chroma].stops[0]} />
            <Txt v="hero" size={48} ink={chroma}>
              {main.name}
            </Txt>
            <Txt v="body" color={C.soft}>
              {main.line}
            </Txt>
          </Glass>
        </PopIn>
        <Glass style={{ gap: 12 }}>
          <Txt v="label" color={C.muted}>
            Je routine
          </Txt>
          {main.routine.map((r, i) => (
            <Row key={r} gap={12} style={{ alignItems: 'flex-start' }}>
              <Txt v="display" size={24} ink={chroma}>
                {i + 1}
              </Txt>
              <Txt v="body" style={{ flex: 1, marginTop: 4 }}>
                {r}
              </Txt>
            </Row>
          ))}
        </Glass>
        <View style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            Past bij jou
          </Txt>
          <Row gap={10} wrap>
            {products.map((p) => (
              <Press
                key={p.id}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                fxNames="glass"
                style={{ width: '48%', padding: 12, gap: 8, alignItems: 'center', borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.1)' }}
              >
                <Bottle product={p} height={100} />
                <Txt v="small" weight="600" align="center" numberOfLines={2}>
                  {p.line} {p.name}
                </Txt>
                <Txt v="num" size={13}>
                  {euro(p.price)}
                </Txt>
              </Press>
            ))}
          </Row>
          <Button
            title="Alles in mijn mandje"
            icon="bag"
            kind="glass"
            full
            onPress={() => {
              products.forEach((p) => addToCart(p.id));
              toast(`${products.length} producten in je mandje`, { text: 'Ophalen in de salon.', icon: 'bag' });
            }}
          />
        </View>
        <Glass style={{ gap: 10 }}>
          <Txt v="label" color={C.muted}>
            In de salon
          </Txt>
          <Txt v="h2">{service.short}</Txt>
          <Txt v="body" color={C.soft}>
            {service.blurb}
          </Txt>
          <Button title="Bekijk en boek" icon="scissors" chroma={chroma} onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: service.id } })} />
        </Glass>
        <Button
          title="Opnieuw doen"
          icon="refresh"
          kind="ghost"
          onPress={() => {
            setQuiz(null);
            setAnswers({});
            setStep(0);
          }}
        />
      </Screen>
    );
  }

  const q = QUIZ[step];
  return (
    <Screen back title="Haarquiz" kicker={`Vraag ${step + 1} van ${QUIZ.length}`}>
      <Bar value={(step + 1) / QUIZ.length} chroma="chroma" height={6} />
      <PopIn key={q.id}>
        <View style={{ gap: 14 }}>
          <Txt v="title">{q.title}</Txt>
          {q.answers.map((a) => {
            const on = answers[q.id] === a.id;
            return (
              <Press
                key={a.id}
                onPress={() => {
                  const next = { ...answers, [q.id]: a.id };
                  setAnswers(next);
                  setTimeout(() => {
                    if (step < QUIZ.length - 1) setStep(step + 1);
                    else setQuiz(scoreQuiz(next));
                  }, 220);
                }}
                accessibilityState={{ selected: on }}
                fxNames={on ? '' : 'glass'}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: R.md, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(16,28,72,0.12)', backgroundColor: on ? C.blue : 'transparent' }}
              >
                <Txt v="h3" size={17} color={on ? '#FFFFFF' : C.text} style={{ flex: 1 }}>
                  {a.label}
                </Txt>
                <Icon name={on ? 'check' : 'chevron'} size={18} color={on ? '#FFFFFF' : C.muted} />
              </Press>
            );
          })}
        </View>
      </PopIn>
      {step > 0 ? <Button title="Vorige vraag" icon="back" kind="ghost" onPress={() => setStep(step - 1)} /> : null}
    </Screen>
  );
}
