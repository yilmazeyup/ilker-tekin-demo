import { euro, productById } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Bottle } from '../components/Art';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Button, DemoNote, Divider, Glass, Press, Row, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { C, R } from '../theme';

export default function Cart() {
  const { cart, setQty, placeOrder, vouchers } = useDemo();
  const hasVoucher = vouchers.includes('r-product');
  const [useVoucher, setUseVoucher] = useState(hasVoucher);
  const subtotal = cart.reduce((s, l) => s + (productById(l.id)?.price ?? 0) * l.qty, 0);
  const discount = useVoucher && hasVoucher ? Math.round(subtotal * 10) / 100 : 0;
  const total = subtotal - discount;
  if (!cart.length) {
    return (
      <Screen back title="Je mandje" kicker="Ophalen in de salon">
        <Txt v="body" color={C.soft}>
          Nog leeg.
        </Txt>
        <Button title="Naar de shop" icon="bag" onPress={() => router.replace('/shop')} />
      </Screen>
    );
  }
  return (
    <Screen
      back
      title="Je mandje"
      kicker="Ophalen in de salon"
      footer={
        <Button
          title={`Bestel · ${euro(total)}`}
          icon="lock"
          size="lg"
          full
          chroma="honing"
          onPress={() => {
            const number = placeOrder(useVoucher);
            router.replace({ pathname: '/bestelling/[id]', params: { id: number } });
          }}
        />
      }
    >
      <View style={{ gap: 10 }}>
        {cart.map((l) => {
          const p = productById(l.id)!;
          return (
            <Glass key={l.id} pad={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 56, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: R.sm, backgroundColor: 'rgba(16,28,72,0.05)' }}>
                <Bottle product={p} height={70} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="h3" size={14} numberOfLines={2}>
                  {p.line} {p.name}
                </Txt>
                <Txt v="num" size={13} color={C.muted}>
                  {euro(p.price)}
                </Txt>
              </View>
              <Row gap={10}>
                <Press onPress={() => setQty(l.id, l.qty - 1)} accessibilityLabel="Minder" style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(16,28,72,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="minus" size={15} />
                </Press>
                <Txt v="num">{l.qty}</Txt>
                <Press onPress={() => setQty(l.id, l.qty + 1)} accessibilityLabel="Meer" style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(16,28,72,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={15} />
                </Press>
              </Row>
            </Glass>
          );
        })}
      </View>
      {hasVoucher ? (
        <Press onPress={() => setUseVoucher((u) => !u)} accessibilityRole="checkbox" accessibilityState={{ checked: useVoucher }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, backgroundColor: 'rgba(91,227,166,0.1)' }}>
          <Icon name={useVoucher ? 'check' : 'gift'} size={18} color={C.ok} />
          <Txt v="body" style={{ flex: 1 }}>
            Club-beloning: 10% op je producten
          </Txt>
        </Press>
      ) : null}
      <Glass style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="body" color={C.soft}>
            Subtotaal
          </Txt>
          <Txt v="num">{euro(subtotal)}</Txt>
        </Row>
        {discount ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="body" color={C.ok}>
              Korting
            </Txt>
            <Txt v="num" color={C.ok}>
              − {euro(discount)}
            </Txt>
          </Row>
        ) : null}
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="body" color={C.soft}>
            Ophalen in de salon
          </Txt>
          <Txt v="num" color={C.ok}>
            gratis
          </Txt>
        </Row>
        <Divider style={{ marginVertical: 4 }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">Totaal</Txt>
          <Txt v="h2" ink="honing">
            {euro(total)}
          </Txt>
        </Row>
      </Glass>
      <DemoNote text="Testbestelling: er wordt niets betaald of klaargezet. In het beheer verschijnt hij bij de shop." />
    </Screen>
  );
}
