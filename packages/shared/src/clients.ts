import type { DrinkId } from './drinks';
import type { Length, ServiceId } from './menu';
import { LOOKS } from './looks';
import { between, pick, rng, weighted, type Rng } from './random';
import type { StylistId } from './team';

/**
 * The salon's (fictional) clients: who they are, their hair, and the colour formula the salon keeps for them. The
 * same pool feeds the agenda, the live floor and the client cards, so a client's history adds up across days.
 */

export type ClientKind = 'woman' | 'man' | 'kid';
export type HairState = 'natuurlijk' | 'gekleurd' | 'blond' | 'highlights';
export type HairTexture = 'steil' | 'golvend' | 'krullend' | 'kroes';

export type Formula = {
  /** "Majirel 6.34 (30 g) + 7.4 (15 g)" */
  mix: string;
  /** "Oxydant Crème 6% · 1:1,5" */
  developer: string;
  minutes: number;
  /** Olaplex, a toner afterwards, grey coverage. */
  extra?: string;
};

export type Client = {
  id: string;
  name: string;
  kind: ClientKind;
  /** Masked, as the panel shows it. */
  phone: string;
  sinceYear: number;
  length: Length;
  /** Natural level, 1 (black) to 10 (lightest blond). */
  level: number;
  grey: number;
  texture: HairTexture;
  state: HairState;
  favourite: StylistId;
  formula: Formula | null;
  allergy: string | null;
  note: string;
  drink: DrinkId;
  looks: string[];
};

const KIDS = ['Mila', 'Sem', 'Noah', 'Liv', 'Finn', 'Yara', 'Adam', 'Elin', 'Zara', 'Mats', 'Lise', 'Emir'];
const WOMEN = [
  'Sophie', 'Emma', 'Julia', 'Tess', 'Fleur', 'Lisa', 'Anouk', 'Eva', 'Maud', 'Femke', 'Roos', 'Iris', 'Lotte', 'Sanne',
  'Elif', 'Zeynep', 'Merve', 'Ayşe', 'Derya', 'Büşra', 'Esra', 'Melis', 'Defne', 'Nisa', 'Selma', 'Aylin', 'Ece', 'Dilan',
  'Yasmina', 'Salma', 'Imane', 'Nora', 'Sara', 'Hiba', 'Kenza', 'Amira', 'Ilham', 'Soukaina', 'Chloé', 'Nina', 'Olivia',
  'Isabel', 'Priya', 'Ana', 'Marta', 'Lieke', 'Noortje', 'Puck', 'Jasmijn', 'Demi', 'Kiki', 'Floor', 'Vera', 'Hanna',
];
const MEN = ['Thomas', 'Bram', 'Emre', 'Mehmet', 'Yusuf', 'Omar', 'Bilal', 'Luuk', 'Sem', 'Milan', 'Ruben', 'Kaan', 'Hamza', 'Jesse', 'Mats', 'Burak', 'Can', 'Jordy'];
const LAST = [
  'de Vries', 'Jansen', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters',
  'Hendriks', 'van Dijk', 'Dekker', 'Brouwer', 'Verhoeven', 'van Leeuwen', 'Kuipers', 'Willems', 'Aerts', 'van der Heijden', 'Coolen',
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Koç', 'Polat',
  'El Amrani', 'Bouzid', 'Benali', 'Haddou', 'Aziz', 'Rossi', 'Novak', 'Santos', 'Kowalski', 'Nguyen',
];

const NOTES = [
  'Houdt van een strakke föhn, niet te veel volume.',
  'Wil altijd dezelfde stylist.',
  'Gevoelige hoofdhuid: lauw water.',
  'Komt vaak net te vroeg, graag meteen een drankje.',
  'Laat de pony graag wat langer.',
  'Kleur liever iets te warm dan te koel.',
  'Draagt haar meestal in een staart: punten extra verzorgen.',
  'Wil volgende keer een balayage bespreken.',
  'Sport veel: geeft de voorkeur aan wash-and-go.',
  'Altijd een afspraak op zaterdagochtend.',
  'Houdt van rust in de stoel.',
  'Wil graag tips voor thuis.',
];

const ALLERGIES = ['PPD-gevoelig: altijd eerst een strengtest', 'Geen parfum op de hoofdhuid', 'Latex: handschoenen zonder latex'];

const DRINKS: DrinkId[] = ['cappuccino', 'espresso', 'latte', 'thee', 'muntthee', 'water', 'chai', 'bruiswater'];

const ONLY_WOMEN_LOOKS = LOOKS.filter((l) => l.service !== 'heren').map((l) => l.id);

/** A colour formula in the salon's own L'Oréal Professionnel and Olaplex products. */
export function formulaFor(service: ServiceId, client: Pick<Client, 'level' | 'grey'>, r: Rng): Formula {
  const level = client.level;
  const tone = () => pick(r, ['0', '1', '3', '4', '13', '34', '35', '43']);
  switch (service) {
    case 'toner':
      return {
        mix: `Dia Light ${pick(r, ['9', '10'])}.${pick(r, ['13', '22', '01', '12', '18'])} (30 g) + ${pick(r, ['9', '10'])}.${pick(r, ['01', '02', '21'])} (30 g)`,
        developer: 'Diactivateur 2,7% · 1:1,5',
        minutes: 20,
        extra: 'Glans en tint, geen grijsdekking',
      };
    case 'blondering':
    case 'highlights':
    case 'babylights':
    case 'balayage':
    case 'balayage-refresh':
    case 'airtouch':
      return {
        mix: `Blond Studio Multi-Techniques (${between(r, 40, 60)} g) + Olaplex No.1`,
        developer: `Oxydant Crème ${pick(r, ['6%', '6%', '9%'])} · 1:2`,
        minutes: pick(r, [35, 40, 45]),
        extra: `Toner Dia Light ${pick(r, ['10.22', '9.13', '10.12', '9.01'])} · Olaplex No.2 na het spoelen`,
      };
    case 'lowlights':
      return { mix: `Majirel ${Math.max(4, level - 2)}.${tone()} (40 g)`, developer: 'Oxydant Crème 6% · 1:1,5', minutes: 30 };
    default: {
      const a = Math.max(3, Math.min(9, level + pick(r, [-1, 0, 0, 1])));
      const b = Math.max(3, Math.min(9, a + pick(r, [0, 1])));
      return {
        mix: `Majirel ${a}.${tone()} (${pick(r, [20, 30, 40])} g) + ${b}.${tone()} (${pick(r, [10, 15, 20])} g)`,
        developer: `Oxydant Crème ${pick(r, ['6%', '6%', '3%'])} · 1:1,5`,
        minutes: pick(r, [30, 35]),
        extra: client.grey >= 30 ? `+ ⅓ ${a}.0 voor grijsdekking` : undefined,
      };
    }
  }
}

function makeClient(i: number): Client {
  const r = rng(`ilker-client-${i}`);
  const kind: ClientKind = i % 13 === 7 ? 'kid' : i % 6 === 3 ? 'man' : 'woman';
  const first = kind === 'kid' ? pick(r, KIDS) : kind === 'man' ? pick(r, MEN) : pick(r, WOMEN);
  const name = kind === 'kid' ? `${first} ${pick(r, LAST)}` : `${first} ${pick(r, LAST)}`;
  const level = kind === 'woman' ? weighted(r, [[2, 1], [3, 3], [4, 4], [5, 4], [6, 3], [7, 2], [8, 1]] as const) : between(r, 2, 6);
  const state: HairState =
    kind === 'woman' ? weighted(r, [['gekleurd', 4], ['highlights', 3], ['blond', 2], ['natuurlijk', 2]] as const) : 'natuurlijk';
  const favourite: StylistId =
    kind !== 'woman'
      ? pick(r, ['daan', 'daan', 'ilker'] as const)
      : state === 'blond' || state === 'highlights'
        ? pick(r, ['noor', 'noor', 'selin', 'ilker'] as const)
        : state === 'gekleurd'
          ? pick(r, ['selin', 'selin', 'ilker', 'noor'] as const)
          : pick(r, ['lina', 'daan', 'ilker', 'lina'] as const);
  const grey = kind === 'woman' && r() < 0.35 ? pick(r, [10, 20, 30, 40, 50]) : 0;
  const base = {
    id: `c-${String(i).padStart(3, '0')}`,
    name,
    kind,
    phone: `06 •• •• ${between(r, 10, 99)} ${between(r, 10, 99)}`,
    sinceYear: pick(r, [2023, 2024, 2024, 2025, 2025, 2026]),
    length: kind === 'woman' ? weighted(r, [['kort', 1], ['halflang', 2], ['lang', 2]] as const) : ('kort' as Length),
    level,
    grey,
    texture: weighted(r, [['steil', 4], ['golvend', 4], ['krullend', 2], ['kroes', 1]] as const),
    state,
    favourite,
    allergy: r() < 0.07 ? pick(r, ALLERGIES) : null,
    note: pick(r, NOTES),
    drink: pick(r, DRINKS),
    looks: kind === 'woman' ? Array.from(new Set([pick(r, ONLY_WOMEN_LOOKS), pick(r, ONLY_WOMEN_LOOKS)])).slice(0, between(r, 0, 2)) : [],
  };
  const colourService: ServiceId | null =
    state === 'gekleurd' ? 'uitgroei' : state === 'blond' ? 'blondering' : state === 'highlights' ? 'balayage' : null;
  return { ...base, formula: colourService ? formulaFor(colourService, base, r) : null };
}

export const CLIENTS: Client[] = Array.from({ length: 220 }, (_, i) => makeClient(i));

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id);

/** "Sophie de V." */
export function shortName(name: string): string {
  const [first, ...rest] = name.split(' ');
  const last = rest.filter((p) => p[0] && p[0] === p[0].toUpperCase()).pop() ?? rest[rest.length - 1] ?? '';
  return last ? `${first} ${last[0]}.` : first;
}
