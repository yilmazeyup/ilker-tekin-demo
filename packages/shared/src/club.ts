import type { ChromaId, ServiceId } from './menu';

/** İlker Tekin Club: a demo loyalty programme. One point per euro; levels unlock perks, points buy rewards. */

export type Tier = { id: string; name: string; from: number; chroma: ChromaId; perks: string[] };

export const TIERS: Tier[] = [
  { id: 'glow', name: 'Glow', from: 0, chroma: 'ijs', perks: ['1 punt per euro', 'Verrassing op je verjaardag'] },
  { id: 'gloss', name: 'Gloss', from: 600, chroma: 'roze', perks: ['Drankje naar keuze bij elke afspraak', 'Eerder bericht bij nieuwe looks'] },
  { id: 'lustre', name: 'Lustre', from: 1200, chroma: 'koper', perks: ['Voorrang op de wachtlijst', '10% op producten in de shop'] },
  { id: 'icon', name: 'Icon', from: 2500, chroma: 'violet', perks: ['Elk jaar een Olaplex-behandeling cadeau', 'Kleurconsult met je stylist'] },
];

export function tierFor(points: number): { tier: Tier; next: Tier | null; progress: number } {
  const index = TIERS.reduce((at, t, i) => (points >= t.from ? i : at), 0);
  const tier = TIERS[index];
  const next = TIERS[index + 1] ?? null;
  const progress = next ? (points - tier.from) / (next.from - tier.from) : 1;
  return { tier, next, progress };
}

export type Reward = { id: string; name: string; points: number; service?: ServiceId; line: string };

export const REWARDS: Reward[] = [
  { id: 'r-pony', name: 'Pony knippen', points: 150, service: 'pony', line: 'Tussendoor je pony bijgeknipt' },
  { id: 'r-product', name: '10% op je volgende product', points: 200, line: 'In de app of in de salon' },
  { id: 'r-fohnen', name: 'Wassen & föhnen', points: 350, service: 'fohnen', line: 'Voor een avond uit' },
  { id: 'r-olaplex', name: 'Olaplex-behandeling', points: 400, service: 'olaplex', line: 'Bij je volgende afspraak' },
  { id: 'r-toner', name: 'Kleurspoeling & toner', points: 500, service: 'toner', line: 'Kort of halflang haar' },
  { id: 'r-25', name: '€ 25 korting', points: 600, line: 'Op elke behandeling' },
];

export const GIFT_AMOUNTS = [25, 50, 75, 100, 150, 250];

export const GIFT_DESIGNS: { id: string; name: string; chroma: ChromaId }[] = [
  { id: 'g-koper', name: 'Copper', chroma: 'koper' },
  { id: 'g-roze', name: 'Rosé', chroma: 'roze' },
  { id: 'g-violet', name: 'Violet', chroma: 'violet' },
  { id: 'g-ijs', name: 'Ice', chroma: 'ijs' },
];

/** Refer a friend: she gets money off her first visit, you get points once she has been. */
export const REFERRAL = { friendGets: 10, youGet: 250, joined: 2 };
