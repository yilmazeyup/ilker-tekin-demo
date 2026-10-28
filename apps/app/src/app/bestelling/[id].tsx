import { clock as hhmm, dayLong, euro, productById, relativeDay, SALON } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { QrCode } from '../../components/Art';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Button, Glass, PopIn, Row, Txt } from '../../components/ui';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { C, fx } from '../../theme';

export default function Order() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useDemo();
  const { now } = useClock();
  const order = orders.find((o) => o.number === id);
  if (!order) {
    return (
      <Screen back title="Bestelling">
        <Txt color={C.soft}>Deze bestelling bestaat niet (meer) in de demo.</Txt>
        <Button title="Naar de shop" onPress={() => router.replace('/shop')} />
      </Screen>
    );
  }
  return (
    <Screen back>
      <PopIn>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View {...fx('dye-honing')} style={{ width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFC24B' }}>
            <Icon name="bag" size={32} color="#140C10" />
          </View>
          <Txt v="display" align="center">
            Ligt voor je klaar
          </Txt>
          <Txt v="body" color={C.soft} align="center">
            {relativeDay(order.ready, now) === 'vandaag' ? 'Vandaag' : dayLong(order.ready)} vanaf {hhmm(order.ready)} bij de balie, {SALON.street}.
          </Txt>
        </View>
      </PopIn>
      <Glass style={{ alignItems: 'center', gap: 12 }}>
        <View style={{ padding: 14, borderRadius: 20, backgroundColor: C.cream }}>
          <QrCode seed={order.number.length + order.lines.length * 5} size={170} />
        </View>
        <Txt v="label" color={C.muted}>
          Bestelling {order.number}
        </Txt>
      </Glass>
      <Glass style={{ gap: 8 }}>
        {order.lines.map((l) => {
          const p = productById(l.id)!;
          return (
            <Row key={l.id} style={{ justifyContent: 'space-between' }}>
              <Txt v="body" style={{ flex: 1 }} numberOfLines={1}>
                {l.qty}× {p.line} {p.name}
              </Txt>
              <Txt v="num">{euro(p.price * l.qty)}</Txt>
            </Row>
          );
        })}
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <Txt v="h3">Totaal</Txt>
          <Txt v="h3">{euro(order.total)}</Txt>
        </Row>
        <Txt v="small" color={C.muted}>
          + {Math.round(order.total)} Club-punten
        </Txt>
      </Glass>
      <Button title="Verder winkelen" kind="glass" full onPress={() => router.replace('/shop')} />
    </Screen>
  );
}
