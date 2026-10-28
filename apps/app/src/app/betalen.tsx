import { euro, serviceById, stylistById } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, DemoNote, Divider, Glass, Press, Row, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, R } from '../theme';

const TIPS = [0, 2.5, 5, 10];
const METHODS: { id: string; label: string; icon: IconName }[] = [
  { id: 'ideal', label: 'iDEAL', icon: 'euro' },
  { id: 'apple', label: 'Apple Pay', icon: 'phone' },
  { id: 'kaart', label: 'Kaart', icon: 'card' },
];

/** Feature 17: pay for today's visit in the app, with a tip for your stylist. A test payment: nothing is charged. */
export default function Pay() {
  const v = useVisit();
  const { pay, payment, vouchers } = useDemo();
  const toast = useToast();
  const [tip, setTip] = useState(5);
  const [method, setMethod] = useState('ideal');
  const stylist = stylistById(v.appt.stylist);
  const service = serviceById(v.appt.service);
  const discount = vouchers.includes('r-25') ? 25 : 0;
  const total = Math.max(0, v.appt.price - discount) + tip;
  const paid = payment?.visit === v.appt.id;

  if (paid) {
    return (
      <Screen back title="Betaald" kicker="Bedankt">
        <Glass style={{ alignItems: 'center', gap: 12 }} pad={24} tint="ijs">
          <View {...fx('dye-ijs')} style={{ width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A9C6FF' }}>
            <Icon name="check" size={34} color="#140C10" stroke={2.4} />
          </View>
          <Txt v="title" align="center">
            {euro(payment!.amount + payment!.tip)} betaald
          </Txt>
          <Txt v="body" color={C.soft} align="center">
            {payment!.tip ? `Waarvan ${euro(payment!.tip)} fooi voor ${stylist.name}. ` : ''}Je hebt {Math.round(payment!.amount)} Club-punten gespaard.
          </Txt>
        </Glass>
        <Button title="Laat een review met foto achter" icon="camera" full onPress={() => router.push('/review')} />
        <Button title="Nazorg voor je kleur" icon="leaf" kind="glass" full onPress={() => router.push({ pathname: '/nazorg', params: { care: service.care } })} />
      </Screen>
    );
  }

  return (
    <Screen back title="Afrekenen" kicker={`${service.short} bij ${stylist.name}`}>
      <Glass style={{ gap: 12 }} pad={20}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="body" color={C.soft}>
            {service.short}
          </Txt>
          <Txt v="num">{euro(v.appt.price)}</Txt>
        </Row>
        {discount ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="body" color={C.ok}>
              Club-beloning
            </Txt>
            <Txt v="num" color={C.ok}>
              − {euro(discount)}
            </Txt>
          </Row>
        ) : null}
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="body" color={C.soft}>
            Fooi voor {stylist.name}
          </Txt>
          <Txt v="num">{euro(tip)}</Txt>
        </Row>
        <Divider style={{ marginVertical: 4 }} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Txt v="h3">Totaal</Txt>
          <Txt v="display" size={36} ink="chroma">
            {euro(total)}
          </Txt>
        </Row>
      </Glass>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Fooi voor {stylist.name}
        </Txt>
        <Row gap={8}>
          {TIPS.map((t) => {
            const on = t === tip;
            return (
              <Press
                key={t}
                onPress={() => setTip(t)}
                accessibilityState={{ selected: on }}
                fxNames={on ? '' : 'glass'}
                style={{ flex: 1, paddingVertical: 14, borderRadius: R.md, alignItems: 'center', backgroundColor: on ? C.blue : 'transparent', borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(16,28,72,0.12)' }}
              >
                <Txt v="h3" color={on ? '#FFFFFF' : C.text}>
                  {t ? euro(t) : 'Geen'}
                </Txt>
              </Press>
            );
          })}
        </Row>
      </View>
      <View style={{ gap: 10 }}>
        <Txt v="label" color={C.muted}>
          Betaalwijze
        </Txt>
        <Row gap={8}>
          {METHODS.map((m) => {
            const on = m.id === method;
            return (
              <Press
                key={m.id}
                onPress={() => setMethod(m.id)}
                accessibilityState={{ selected: on }}
                style={{ flex: 1, padding: 14, borderRadius: R.md, alignItems: 'center', gap: 6, backgroundColor: on ? C.blue : 'rgba(16,28,72,0.06)' }}
              >
                <Icon name={m.icon} size={20} color={on ? '#FFFFFF' : C.text} />
                <Txt v="small" weight="600" color={on ? '#FFFFFF' : C.text}>
                  {m.label}
                </Txt>
              </Press>
            );
          })}
        </Row>
      </View>
      <Button
        title={`Betaal ${euro(total)}`}
        icon="lock"
        size="lg"
        full
        onPress={() => {
          pay(Math.max(0, v.appt.price - discount), tip, method);
          toast('Betaald', { text: tip ? `${stylist.name} krijgt je fooi.` : 'Bedankt voor je bezoek.', icon: 'check' });
        }}
      />
      <DemoNote text="Testbetaling: er wordt niets afgeschreven. In de echte app gaat dit via een betaalprovider zoals Mollie (iDEAL, Apple Pay, kaart)." />
    </Screen>
  );
}
