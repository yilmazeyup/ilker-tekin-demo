import { addDays, startOfDay } from './format';
import type { ServiceId } from './menu';
import { between, pick, rng } from './random';
import { salonHours } from './salon';

/**
 * The shop: real products from the two brands the salon works with (L'Oréal Professionnel and Olaplex). Prices and
 * stock are demo values; orders are picked up in the salon, nothing is shipped or paid.
 */

export type Concern = 'repair' | 'colour' | 'blond' | 'frizz' | 'curls' | 'volume' | 'heat' | 'extensions';
export type ShopCategory = 'olaplex' | 'repair' | 'kleur' | 'styling';

export type Product = {
  id: string;
  brand: "L'Oréal Professionnel" | 'Olaplex' | 'Salon';
  line: string;
  name: string;
  size: string;
  price: number;
  category: ShopCategory;
  concerns: Concern[];
  /** Treatments it carries on at home. */
  after: ServiceId[];
  /** Bottle and liquid colours for the drawn packshot. */
  bottle: string;
  liquid: string;
  how: string;
};

export const SHOP_CATEGORIES: { id: ShopCategory; name: string }[] = [
  { id: 'olaplex', name: 'Olaplex' },
  { id: 'repair', name: 'Herstel' },
  { id: 'kleur', name: 'Kleur & blond' },
  { id: 'styling', name: 'Styling' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'olaplex-3',
    brand: 'Olaplex',
    line: 'No.3',
    name: 'Hair Perfector',
    size: '100 ml',
    price: 32,
    category: 'olaplex',
    concerns: ['repair', 'blond', 'colour'],
    after: ['blondering', 'highlights', 'balayage', 'babylights', 'airtouch', 'olaplex'],
    bottle: '#F4F1EC',
    liquid: '#E9B48A',
    how: 'Eén keer per week op vochtig haar, minstens 10 minuten voor het wassen.',
  },
  {
    id: 'olaplex-4',
    brand: 'Olaplex',
    line: 'No.4',
    name: 'Bond Maintenance Shampoo',
    size: '250 ml',
    price: 32,
    category: 'olaplex',
    concerns: ['repair', 'colour'],
    after: ['blondering', 'highlights', 'balayage', 'uitgroei', 'kleuren', 'olaplex'],
    bottle: '#F4F1EC',
    liquid: '#8FB7E8',
    how: 'Twee keer per week, lauw water. Goed uitspoelen.',
  },
  {
    id: 'olaplex-5',
    brand: 'Olaplex',
    line: 'No.5',
    name: 'Bond Maintenance Conditioner',
    size: '250 ml',
    price: 32,
    category: 'olaplex',
    concerns: ['repair', 'frizz'],
    after: ['blondering', 'highlights', 'balayage', 'olaplex'],
    bottle: '#F4F1EC',
    liquid: '#C3A4E8',
    how: 'Na No.4 in de lengtes, drie minuten laten intrekken.',
  },
  {
    id: 'olaplex-4p',
    brand: 'Olaplex',
    line: 'No.4P',
    name: 'Blonde Enhancer Toning Shampoo',
    size: '250 ml',
    price: 32,
    category: 'kleur',
    concerns: ['blond'],
    after: ['blondering', 'highlights', 'babylights', 'airtouch', 'toner'],
    bottle: '#2A1D3A',
    liquid: '#8F6BFF',
    how: 'Eén keer per week tegen geel: twee minuten laten inwerken.',
  },
  {
    id: 'olaplex-6',
    brand: 'Olaplex',
    line: 'No.6',
    name: 'Bond Smoother',
    size: '100 ml',
    price: 32,
    category: 'olaplex',
    concerns: ['frizz', 'heat'],
    after: ['keratine', 'fohnen', 'brazilian'],
    bottle: '#F4F1EC',
    liquid: '#9AD6C0',
    how: 'Leave-in: een kleine hoeveelheid in vochtig haar, dan föhnen.',
  },
  {
    id: 'olaplex-7',
    brand: 'Olaplex',
    line: 'No.7',
    name: 'Bonding Oil',
    size: '30 ml',
    price: 32,
    category: 'olaplex',
    concerns: ['heat', 'frizz', 'repair'],
    after: ['balayage', 'keratine', 'fohnen', 'krullen'],
    bottle: '#F4F1EC',
    liquid: '#FFC24B',
    how: 'Een paar druppels in de punten, nat of droog. Beschermt tot 230 °C.',
  },
  {
    id: 'loreal-absolut-shampoo',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Absolut Repair Shampoo',
    size: '300 ml',
    price: 24,
    category: 'repair',
    concerns: ['repair'],
    after: ['blondering', 'keratine', 'dames-knippen'],
    bottle: '#1B1410',
    liquid: '#E6B85C',
    how: 'Voor beschadigd haar: twee keer wassen, de tweede keer even laten intrekken.',
  },
  {
    id: 'loreal-absolut-mask',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Absolut Repair Masker',
    size: '250 ml',
    price: 32,
    category: 'repair',
    concerns: ['repair', 'frizz'],
    after: ['blondering', 'highlights', 'keratine'],
    bottle: '#1B1410',
    liquid: '#F2C879',
    how: 'Eén keer per week in plaats van conditioner, vijf minuten.',
  },
  {
    id: 'loreal-vitamino-shampoo',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Vitamino Color Shampoo',
    size: '300 ml',
    price: 22,
    category: 'kleur',
    concerns: ['colour'],
    after: ['uitgroei', 'kleuren', 'toner', 'lowlights'],
    bottle: '#3A0D10',
    liquid: '#F2243C',
    how: 'Voor gekleurd haar: houdt de kleur langer helder.',
  },
  {
    id: 'loreal-metal-detox',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Metal Detox Shampoo',
    size: '300 ml',
    price: 25,
    category: 'kleur',
    concerns: ['colour', 'blond', 'repair'],
    after: ['blondering', 'highlights', 'balayage', 'kleuren'],
    bottle: '#0E2A2B',
    liquid: '#4FD1C5',
    how: 'Haalt metaaldeeltjes uit kraanwater, zodat kleur en blond zuiver blijven.',
  },
  {
    id: 'loreal-blondifier',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Blondifier Gloss Shampoo',
    size: '300 ml',
    price: 23,
    category: 'kleur',
    concerns: ['blond'],
    after: ['babylights', 'highlights', 'airtouch'],
    bottle: '#2B2015',
    liquid: '#FFE6A6',
    how: 'Voor glanzend blond, elke wasbeurt.',
  },
  {
    id: 'loreal-liss',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Liss Unlimited Shampoo',
    size: '300 ml',
    price: 23,
    category: 'styling',
    concerns: ['frizz'],
    after: ['keratine', 'brazilian', 'proteine'],
    bottle: '#2A1238',
    liquid: '#D9CCFF',
    how: 'Tegen pluis: zacht en glad, ook bij vochtig weer.',
  },
  {
    id: 'loreal-curl',
    brand: "L'Oréal Professionnel",
    line: 'Serie Expert',
    name: 'Curl Expression Leave-in',
    size: '200 ml',
    price: 26,
    category: 'styling',
    concerns: ['curls', 'frizz'],
    after: ['permanent', 'krullen'],
    bottle: '#3A1424',
    liquid: '#FF8FB1',
    how: 'In vochtig haar kneden, aan de lucht laten drogen.',
  },
  {
    id: 'loreal-pli',
    brand: "L'Oréal Professionnel",
    line: 'Tecni.Art',
    name: 'Pli Shaper',
    size: '190 ml',
    price: 21,
    category: 'styling',
    concerns: ['heat', 'volume'],
    after: ['fohnen', 'krullen', 'opsteken', 'dames-knippen'],
    bottle: '#151515',
    liquid: '#A9C6FF',
    how: 'Hittebescherming en model: op vochtig haar voor het föhnen.',
  },
  {
    id: 'loreal-volume-lift',
    brand: "L'Oréal Professionnel",
    line: 'Tecni.Art',
    name: 'Volume Lift',
    size: '250 ml',
    price: 21,
    category: 'styling',
    concerns: ['volume'],
    after: ['fohnen', 'dames-knippen'],
    bottle: '#151515',
    liquid: '#FF7A3D',
    how: 'Bij de wortel spuiten en met een ronde borstel föhnen.',
  },
  {
    id: 'loop-brush',
    brand: 'Salon',
    line: 'Extensions',
    name: 'Loop-borstel',
    size: '1 stuk',
    price: 15,
    category: 'styling',
    concerns: ['extensions'],
    after: ['ext-microring', 'ext-nanoring', 'ext-keratine', 'ext-intake'],
    bottle: '#2A2025',
    liquid: '#FF5C93',
    how: 'Twee keer per dag van de punten naar boven borstelen, langs de bondjes.',
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const productsAfter = (service: ServiceId) => PRODUCTS.filter((p) => p.after.includes(service));
export const productsFor = (concern: Concern) => PRODUCTS.filter((p) => p.concerns.includes(concern));

/** When an order can be picked up: an hour after it is placed while open, otherwise an hour after opening. */
export function pickupReady(placed: Date): Date {
  for (let d = 0; d < 8; d++) {
    const day = addDays(startOfDay(placed), d);
    const hours = salonHours(day);
    if (!hours) continue;
    const open = new Date(day);
    open.setHours(hours.open, 0, 0, 0);
    const close = new Date(day);
    close.setHours(hours.close, 0, 0, 0);
    const ready = new Date(Math.max(placed.getTime() + 3600000, open.getTime() + 3600000));
    if (ready.getTime() <= close.getTime() - 15 * 60000) return new Date(Math.ceil(ready.getTime() / 900000) * 900000);
  }
  return placed;
}

/** Stock on the shelf for the panel, the same on every load; low items need ordering. */
export function stockOf(id: string, day: Date): { stock: number; min: number; sold: number } {
  const r = rng(`ilker-stock-${id}-${day.getMonth()}-${Math.floor(day.getDate() / 7)}`);
  const min = pick(r, [3, 4, 4, 5]);
  const sold = between(r, 4, 22);
  return { stock: between(r, 1, 14), min, sold };
}

/** Shop orders for pick-up placed through the app on a day, for the panel's shop. */
export type ShopOrder = { id: string; at: Date; name: string; lines: { id: string; qty: number }[]; total: number; ready: boolean };

export function shopOrders(day: Date, names: string[]): ShopOrder[] {
  const r = rng(`ilker-orders-${day.toDateString()}`);
  const n = between(r, 2, 6);
  return Array.from({ length: n }, (_, i) => {
    const at = new Date(startOfDay(day).getTime() + between(r, 7 * 60, 21 * 60) * 60000);
    const lines = Array.from({ length: between(r, 1, 3) }, () => ({ id: pick(r, PRODUCTS).id, qty: pick(r, [1, 1, 1, 2]) }));
    const total = lines.reduce((s, l) => s + (productById(l.id)?.price ?? 0) * l.qty, 0);
    return { id: `IT-${String(day.getDate()).padStart(2, '0')}${i + 1}`, at, name: pick(r, names), lines, total, ready: r() < 0.6 };
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
}
