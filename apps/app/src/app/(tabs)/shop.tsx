import { euro, PRODUCTS, SHOP_CATEGORIES, type ShopCategory } from '@ilker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { Bottle } from '../../components/Art';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Chip, IconButton, Press, Row, Txt } from '../../components/ui';
import { useDemo } from '../../state/demo';
import { C, fx, MAX_WIDTH, PAD, R } from '../../theme';

/** Feature 12: the shop, with pick-up in the salon. Real products from the salon's two brands; demo prices. */
export default function Shop() {
  const { cart, addToCart, orders } = useDemo();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState<ShopCategory | 'alles'>('alles');
  const items = PRODUCTS.filter((p) => cat === 'alles' || p.category === cat);
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const w = (Math.min(width, MAX_WIDTH) - PAD * 2 - 12) / 2;
  return (
    <Screen
      title="Shop"
      kicker="Ophalen in de salon"
      tabs
      right={
        <View>
          <IconButton name="bag" label="Mandje" onPress={() => router.push('/winkelmand')} />
          {count ? (
            <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
              <Txt v="num" size={11} color="#140C10">
                {count}
              </Txt>
            </View>
          ) : null}
        </View>
      }
    >
      <Txt v="body" color={C.soft}>
        Olaplex en L'Oréal Professionnel, de merken waar de salon mee werkt. Bestel in de app, haal het op bij je volgende bezoek of tussendoor.
      </Txt>
      {orders.length ? (
        <Press onPress={() => router.push({ pathname: '/bestelling/[id]', params: { id: orders[0].number } })} fxNames="glass" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(91,227,166,0.4)' }}>
          <Icon name="bag" size={20} color={C.ok} />
          <View style={{ flex: 1 }}>
            <Txt v="h3" size={15}>
              Bestelling {orders[0].number}
            </Txt>
            <Txt v="small" color={C.muted}>
              Klaar om op te halen
            </Txt>
          </View>
          <Icon name="chevron" size={16} color={C.muted} />
        </Press>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -PAD }} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8 }}>
        <Chip label="Alles" on={cat === 'alles'} onPress={() => setCat('alles')} />
        {SHOP_CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name} on={cat === c.id} chroma="honing" onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map((p) => (
          <View key={p.id} {...fx('glass')} style={{ width: w, borderRadius: R.lg, padding: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Press onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityLabel={`${p.line} ${p.name}`} style={{ gap: 8 }}>
              <View style={{ height: 150, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,28,72,0.05)' }}>
                <Bottle product={p} height={128} />
              </View>
              <Txt v="label" size={9} color={C.muted}>
                {p.brand}
              </Txt>
              <Txt v="h3" size={14} numberOfLines={2}>
                {p.line} {p.name}
              </Txt>
            </Press>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="num">{euro(p.price)}</Txt>
              <Press
                onPress={() => {
                  addToCart(p.id);
                  toast('In je mandje', { text: `${p.line} ${p.name}`, icon: 'bag', onPress: () => router.push('/winkelmand') });
                }}
                accessibilityLabel={`${p.name} in je mandje`}
                style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft }}
              >
                <Icon name="plus" size={18} color={C.blue} />
              </Press>
            </Row>
          </View>
        ))}
      </View>
      <Txt v="small" color={C.faint} align="center">
        Producten van de merken van de salon; prijzen en voorraad zijn demowaarden.
      </Txt>
    </Screen>
  );
}
