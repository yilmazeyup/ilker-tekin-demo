import { euro, productById, serviceById } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Bottle } from '../../components/Art';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Glass, Row, Tag, Txt } from '../../components/ui';
import { useDemo } from '../../state/demo';
import { C, fx, R } from '../../theme';

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = productById(id ?? '') ?? productById('olaplex-3')!;
  const { addToCart } = useDemo();
  const toast = useToast();
  return (
    <Screen
      back
      footer={
        <Button
          title={`In mijn mandje · ${euro(p.price)}`}
          icon="bag"
          size="lg"
          full
          chroma="honing"
          onPress={() => {
            addToCart(p.id);
            toast('In je mandje', { text: 'Ophalen in de salon.', icon: 'bag', onPress: () => router.push('/winkelmand') });
          }}
        />
      }
    >
      <View {...fx('glass')} style={{ height: 330, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,28,72,0.1)' }}>
        <View {...fx('float')}>
          <Bottle product={p} height={270} />
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Txt v="label" color={C.muted}>
          {p.brand} · {p.size}
        </Txt>
        <Txt v="display" size={36}>
          {p.line} {p.name}
        </Txt>
        <Txt v="h2" ink="honing">
          {euro(p.price)}
        </Txt>
      </View>
      <Glass style={{ gap: 8 }}>
        <Txt v="label" color={C.muted}>
          Zo gebruik je het
        </Txt>
        <Txt v="body">{p.how}</Txt>
      </Glass>
      {p.after.length ? (
        <View style={{ gap: 8 }}>
          <Txt v="label" color={C.muted}>
            Past na
          </Txt>
          <Row gap={8} wrap>
            {p.after.slice(0, 6).map((s) => (
              <Tag key={s} label={serviceById(s).short} />
            ))}
          </Row>
        </View>
      ) : null}
      <Glass style={{ gap: 6 }}>
        <Txt v="h3">Ophalen in de salon</Txt>
        <Txt v="body" color={C.soft}>
          Een uur na je bestelling ligt het klaar bij de balie, tijdens openingstijden. Geen verzendkosten.
        </Txt>
      </Glass>
    </Screen>
  );
}
