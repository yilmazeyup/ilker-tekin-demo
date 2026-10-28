import type { ServiceId } from './menu';
import type { Concern } from './shop';

/** The hair quiz: six questions, a profile, a routine, products and a treatment from the menu. */

export type Answer = { id: string; label: string; adds: Partial<Record<Concern, number>> };
export type Question = { id: string; title: string; answers: Answer[] };

export const QUIZ: Question[] = [
  {
    id: 'texture',
    title: 'Hoe valt je haar als het vanzelf droogt?',
    answers: [
      { id: 'steil', label: 'Steil', adds: { volume: 1 } },
      { id: 'golvend', label: 'Golvend', adds: { frizz: 1 } },
      { id: 'krullend', label: 'Krullend', adds: { curls: 2, frizz: 1 } },
      { id: 'kroes', label: 'Kroes', adds: { curls: 2, repair: 1 } },
    ],
  },
  {
    id: 'state',
    title: 'Wat is er met je haar gedaan?',
    answers: [
      { id: 'natuur', label: 'Niets, het is natuurlijk', adds: {} },
      { id: 'kleur', label: 'Gekleurd', adds: { colour: 2 } },
      { id: 'blond', label: 'Geblondeerd of highlights', adds: { blond: 2, repair: 2 } },
      { id: 'ext', label: 'Extensions', adds: { extensions: 3 } },
    ],
  },
  {
    id: 'concern',
    title: 'Wat stoort je het meest?',
    answers: [
      { id: 'pluis', label: 'Pluis en frizz', adds: { frizz: 3 } },
      { id: 'breuk', label: 'Breuk en droge punten', adds: { repair: 3 } },
      { id: 'plat', label: 'Plat, weinig volume', adds: { volume: 3 } },
      { id: 'vaal', label: 'Kleur wordt snel vaal', adds: { colour: 2, blond: 1 } },
    ],
  },
  {
    id: 'heat',
    title: 'Hoe vaak gebruik je föhn, krul- of stijltang?',
    answers: [
      { id: 'dagelijks', label: 'Bijna elke dag', adds: { heat: 3, repair: 1 } },
      { id: 'soms', label: 'Een paar keer per week', adds: { heat: 2 } },
      { id: 'zelden', label: 'Zelden', adds: {} },
    ],
  },
  {
    id: 'wash',
    title: 'Hoe vaak was je je haar?',
    answers: [
      { id: 'elke', label: 'Elke dag', adds: { colour: 1, volume: 1 } },
      { id: 'om', label: 'Om de dag', adds: {} },
      { id: 'week', label: 'Twee keer per week of minder', adds: { curls: 1 } },
    ],
  },
  {
    id: 'thick',
    title: 'Hoe voelt een enkele haar?',
    answers: [
      { id: 'fijn', label: 'Fijn', adds: { volume: 2 } },
      { id: 'normaal', label: 'Normaal', adds: {} },
      { id: 'dik', label: 'Dik en stevig', adds: { frizz: 1 } },
    ],
  },
];

export type Profile = { id: Concern; name: string; line: string; routine: string[]; service: ServiceId };

export const PROFILES: Record<Concern, Profile> = {
  repair: {
    id: 'repair',
    name: 'Bond Builder',
    line: 'Je haar heeft het zwaar gehad. Herstel van binnenuit staat voorop.',
    routine: ['Was twee keer per week met No.4 en No.5', 'Eén keer per week No.3, tien minuten', 'Elke dag een paar druppels No.7 in de punten'],
    service: 'olaplex',
  },
  frizz: {
    id: 'frizz',
    name: 'Frizz Tamer',
    line: 'Je haar zoekt vocht in de lucht. Glad maken en afsluiten helpt.',
    routine: ['Sulfaatvrije shampoo, lauw water', 'No.6 Bond Smoother in vochtig haar', 'Föhn van boven naar beneden, koud naföhnen'],
    service: 'keratine',
  },
  colour: {
    id: 'colour',
    name: 'Colour Keeper',
    line: 'Je kleur is je statement. Houd hem langer helder.',
    routine: ['Wacht 48 uur na het kleuren met wassen', 'Vitamino Color bij elke wasbeurt', 'Eén keer per maand Metal Detox'],
    service: 'toner',
  },
  blond: {
    id: 'blond',
    name: 'Blonde Guardian',
    line: 'Blond verdient zorg: sterk houden en geel tegengaan.',
    routine: ['No.4P één keer per week', 'No.3 elke week', 'Altijd hittebescherming onder 185 °C'],
    service: 'toner',
  },
  curls: {
    id: 'curls',
    name: 'Curl Lover',
    line: 'Je krullen willen vocht en rust, geen borstel.',
    routine: ['Was twee keer per week, conditioner elke keer', 'Curl Expression in vochtig haar kneden', 'Diffuser of aan de lucht drogen'],
    service: 'proteine',
  },
  volume: {
    id: 'volume',
    name: 'Volume Seeker',
    line: 'Fijn haar met grote plannen: lucht aan de wortel.',
    routine: ['Lichte shampoo, conditioner alleen in de punten', 'Volume Lift bij de wortel', 'Föhnen met een ronde borstel'],
    service: 'fohnen',
  },
  heat: {
    id: 'heat',
    name: 'Heat Styler',
    line: 'Je stylet graag. Bescherming is je beste vriend.',
    routine: ['Altijd Pli Shaper voor het föhnen', 'Stijltang op maximaal 185 °C', 'No.7 als laatste stap'],
    service: 'olaplex',
  },
  extensions: {
    id: 'extensions',
    name: 'Length Lover',
    line: 'Je extensions blijven mooi met een vaste routine.',
    routine: ['Twee keer per dag de loop-borstel', "'s Nachts een losse vlecht", 'Elke zes tot acht weken onderhoud'],
    service: 'ext-intake',
  },
};

/** Adds up the answers and returns the strongest concern first. */
export function scoreQuiz(answers: Record<string, string>): Concern[] {
  const score: Partial<Record<Concern, number>> = {};
  for (const q of QUIZ) {
    const a = q.answers.find((x) => x.id === answers[q.id]);
    if (!a) continue;
    for (const [k, v] of Object.entries(a.adds) as [Concern, number][]) score[k] = (score[k] ?? 0) + v;
  }
  const order: Concern[] = ['repair', 'blond', 'colour', 'frizz', 'curls', 'volume', 'heat', 'extensions'];
  return order.filter((c) => (score[c] ?? 0) > 0).sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0) || order.indexOf(a) - order.indexOf(b));
}
