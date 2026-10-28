import { euro } from './format';

/**
 * The salon's menu with its real prices and times, from its Treatwell page (salon 519974, October 2026), where "Book
 * now" on ilkertekinhairstylist.nl leads. Prices depend on hair length. The short texts are our own summaries.
 */

export type CategoryId = 'knippen' | 'kleuren' | 'highlights' | 'verzorging' | 'styling' | 'extensions';
export type Length = 'kort' | 'halflang' | 'lang';
export type ChromaId = 'koper' | 'honing' | 'roze' | 'violet' | 'ijs' | 'kers' | 'mocha';

export type Category = { id: CategoryId; name: string; line: string; chroma: ChromaId };

export const CATEGORIES: Category[] = [
  { id: 'knippen', name: 'Knippen', line: 'Wassen, knippen en föhnen of krullen', chroma: 'ijs' },
  { id: 'kleuren', name: 'Kleuren', line: 'Uitgroei, één kleur, toner en blonderen', chroma: 'koper' },
  { id: 'highlights', name: 'Highlights & balayage', line: 'Pakketten met Olaplex, knippen en föhnen', chroma: 'honing' },
  { id: 'verzorging', name: 'Verzorging', line: 'Olaplex, keratine en proteïne', chroma: 'violet' },
  { id: 'styling', name: 'Stylen & krullen', line: 'Föhnen, opsteken, krullen en permanent', chroma: 'roze' },
  { id: 'extensions', name: 'Extensions', line: 'Micro ring, nano ring en microkeratine', chroma: 'kers' },
];

export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export type Option = { id: string; label: string; length?: Length; price: number; minutes: number };

export type ServiceId =
  | 'dames-knippen' | 'pony' | 'heren' | 'kinderen'
  | 'uitgroei' | 'kleuren' | 'toner' | 'blondering'
  | 'highlights' | 'balayage-refresh' | 'balayage' | 'airtouch' | 'babylights' | 'lowlights'
  | 'olaplex' | 'keratine' | 'proteine' | 'brazilian'
  | 'fohnen' | 'opsteken' | 'krullen' | 'permanent'
  | 'ext-microring' | 'ext-nanoring' | 'ext-keratine' | 'ext-intake' | 'ext-verwijderen' | 'advies';

export type CareId = 'knippen' | 'kleur' | 'blond' | 'olaplex' | 'keratine' | 'styling' | 'permanent' | 'extensions';

export type Service = {
  id: ServiceId;
  category: CategoryId;
  /** As on the salon's menu. */
  name: string;
  /** For buttons and cards. */
  short: string;
  blurb: string;
  options: Option[];
  /** "Vanaf": the final price is settled in the salon. */
  from?: boolean;
  /** Priced per strand; the option is one strand. */
  perStrand?: boolean;
  olaplex?: boolean;
  /** Colour work: shows up in the hair passport with a formula and can be tried on in the colour studio. */
  colour?: boolean;
  /** Days after which colour has visibly grown out; drives the regrowth reminder. */
  regrowthDays?: number;
  care: CareId;
  popular?: boolean;
  /** Mostly for men or children: kept out of the women's look deck. */
  audience?: 'men' | 'kids';
};

const L = (kort: [number, number], halflang: [number, number], lang: [number, number]): Option[] => [
  { id: 'kort', label: 'Kort haar', length: 'kort', price: kort[0], minutes: kort[1] },
  { id: 'halflang', label: 'Halflang haar', length: 'halflang', price: halflang[0], minutes: halflang[1] },
  { id: 'lang', label: 'Lang haar', length: 'lang', price: lang[0], minutes: lang[1] },
];
const ONE = (price: number, minutes: number): Option[] => [{ id: 'std', label: 'Standaard', price, minutes }];
const KH = (kortHalf: [number, number], lang: [number, number]): Option[] => [
  { id: 'kort', label: 'Kort en halflang haar', length: 'kort', price: kortHalf[0], minutes: kortHalf[1] },
  { id: 'lang', label: 'Lang haar', length: 'lang', price: lang[0], minutes: lang[1] },
];

export const SERVICES: Service[] = [
  {
    id: 'dames-knippen',
    category: 'knippen',
    name: 'Vrouwen – wassen, knippen & föhnen',
    short: 'Knippen & föhnen',
    blurb: 'Een bob, laagjes of een pony: samen kiezen we de coupe die bij jou past. Met wassen en föhnen, of krullen.',
    options: L([40, 30], [50, 45], [60, 45]),
    care: 'knippen',
    popular: true,
  },
  { id: 'pony', category: 'knippen', name: 'Vrouwen – pony knippen', short: 'Pony knippen', blurb: 'Je pony weer precies goed, tussendoor.', options: ONE(10, 15), care: 'knippen' },
  {
    id: 'heren',
    category: 'knippen',
    name: 'Mannen – wassen, knippen & stijlen',
    short: 'Heren knippen',
    blurb: 'Knippen, tondeuse en strakke contouren, gewassen en gestyled.',
    options: ONE(25, 30),
    care: 'knippen',
    popular: true,
    audience: 'men',
  },
  {
    id: 'kinderen',
    category: 'knippen',
    name: 'Kinderen t/m 12 jaar – knippen',
    short: 'Kinderen knippen',
    blurb: 'Een frisse coupe en een leuke beurt, ook voor wie niet graag naar de kapper gaat.',
    options: ONE(20, 30),
    care: 'knippen',
    audience: 'kids',
  },
  {
    id: 'uitgroei',
    category: 'kleuren',
    name: 'Vrouwen – kleuren uitgroei',
    short: 'Uitgroei kleuren',
    blurb: 'De uitgroei bijgewerkt in je eigen kleur, met gratis föhnen.',
    options: ONE(50, 60),
    colour: true,
    regrowthDays: 35,
    care: 'kleur',
    popular: true,
  },
  {
    id: 'kleuren',
    category: 'kleuren',
    name: 'Vrouwen – kleuren (one color)',
    short: 'Kleuren, één kleur',
    blurb: 'Grijs dekken of een nieuwe kleur, van uitgroei tot punten. Met gratis föhnen.',
    options: L([60, 60], [80, 60], [100, 60]),
    colour: true,
    regrowthDays: 42,
    care: 'kleur',
  },
  {
    id: 'toner',
    category: 'kleuren',
    name: 'Vrouwen – kleurspoeling & toner',
    short: 'Kleurspoeling & toner',
    blurb: 'Tijdelijke kleur zonder waterstofperoxide: meer glans en diepte, of je blond weer koel.',
    options: KH([50, 45], [60, 45]),
    colour: true,
    regrowthDays: 42,
    care: 'kleur',
  },
  {
    id: 'blondering',
    category: 'kleuren',
    name: 'Vrouwen – oxiblondering met Olaplex & toner',
    short: 'Blonderen met Olaplex',
    blurb: 'Van donker naar licht, met Olaplex in elke stap en een toner voor de juiste tint.',
    options: L([150, 60], [200, 90], [250, 120]),
    olaplex: true,
    colour: true,
    regrowthDays: 42,
    care: 'blond',
  },
  {
    id: 'highlights',
    category: 'highlights',
    name: 'Vrouwen – highlights met Olaplex, heel haar & knippen + föhnen + verfspoeling',
    short: 'Highlights heel haar',
    blurb: 'Lichte accenten met folies, zo veel en zo dik als jij wilt. Inclusief knippen, föhnen en verfspoeling.',
    options: L([170, 120], [215, 150], [235, 180]),
    olaplex: true,
    colour: true,
    regrowthDays: 70,
    care: 'blond',
  },
  {
    id: 'balayage-refresh',
    category: 'highlights',
    name: 'Vrouwen – balayage met Olaplex, refresh + verfspoeling',
    short: 'Balayage refresh',
    blurb: 'Je balayage weer helder, met een verfspoeling. Vanaf-prijs; een verschil reken je af in de salon.',
    options: [
      { id: 'halflang', label: 'Halflang haar', length: 'halflang', price: 170, minutes: 120 },
      { id: 'lang', label: 'Lang haar', length: 'lang', price: 185, minutes: 180 },
    ],
    from: true,
    olaplex: true,
    colour: true,
    regrowthDays: 90,
    care: 'blond',
  },
  {
    id: 'balayage',
    category: 'highlights',
    name: 'Vrouwen – balayage met Olaplex + knippen, föhnen & verfspoeling',
    short: 'Balayage',
    blurb: 'Met de hand geveegde kleur, zonder folies: zachte overgangen die mooi uitgroeien.',
    options: L([195, 90], [215, 120], [250, 180]),
    olaplex: true,
    colour: true,
    regrowthDays: 90,
    care: 'blond',
    popular: true,
  },
  {
    id: 'airtouch',
    category: 'highlights',
    name: 'Vrouwen – ombre & airtouch balayage met Olaplex + knippen, föhnen & verfspoeling',
    short: 'Ombre & airtouch',
    blurb: 'Van donker naar licht, of omgekeerd, met de airtouch-techniek voor de zachtste overloop. Vanaf-prijs.',
    options: L([200, 90], [240, 120], [280, 180]),
    from: true,
    olaplex: true,
    colour: true,
    regrowthDays: 100,
    care: 'blond',
  },
  {
    id: 'babylights',
    category: 'highlights',
    name: 'Vrouwen – babylights met Olaplex + knippen, föhnen & verfspoeling',
    short: 'Babylights',
    blurb: 'Heel fijne, lichte plukjes voor een natuurlijke zon-in-je-haar look. Vanaf-prijs.',
    options: L([200, 90], [230, 120], [260, 180]),
    from: true,
    olaplex: true,
    colour: true,
    regrowthDays: 80,
    care: 'blond',
    popular: true,
  },
  {
    id: 'lowlights',
    category: 'highlights',
    name: 'Vrouwen – lowlights heel haar met föhnen',
    short: 'Lowlights',
    blurb: 'Donkere plukjes in licht haar: meer diepte, subtiel. Vanaf-prijs.',
    options: L([80, 60], [100, 60], [130, 60]),
    from: true,
    colour: true,
    regrowthDays: 56,
    care: 'kleur',
  },
  {
    id: 'olaplex',
    category: 'verzorging',
    name: 'Olaplex-behandeling',
    short: 'Olaplex',
    blurb: 'Herstelt gebroken verbindingen na kleuren of hitte, of houdt gezond haar sterk.',
    options: ONE(40, 30),
    olaplex: true,
    care: 'olaplex',
  },
  {
    id: 'keratine',
    category: 'verzorging',
    name: 'Keratinebehandeling',
    short: 'Keratine',
    blurb: 'Vloeibare keratine, verzegeld met de stijltang: pluisvrij, glanzend en tot 80% steiler, 3 à 5 maanden.',
    options: KH([100, 60], [150, 60]),
    care: 'keratine',
    popular: true,
  },
  {
    id: 'proteine',
    category: 'verzorging',
    name: 'Proteïnebehandeling + botox',
    short: 'Proteïne + botox',
    blurb: 'Een intensieve kuur die het haar van binnenuit voedt, voor glans en minder pluis.',
    options: KH([100, 60], [120, 60]),
    care: 'keratine',
  },
  {
    id: 'brazilian',
    category: 'verzorging',
    name: 'Brazilian keratine',
    short: 'Brazilian keratine',
    blurb: 'De sterkste gladmaker: diep gevoed, pluisvrij en glanzend voor maanden.',
    options: KH([150, 60], [200, 90]),
    care: 'keratine',
  },
  {
    id: 'fohnen',
    category: 'styling',
    name: 'Vrouwen – wassen & föhnen',
    short: 'Wassen & föhnen',
    blurb: 'Föhn en ronde borstel: natuurlijk, vol en precies in model.',
    options: ONE(35, 30),
    care: 'styling',
    popular: true,
  },
  {
    id: 'opsteken',
    category: 'styling',
    name: 'Vrouwen – opsteken',
    short: 'Opsteken',
    blurb: 'Los en speels of strak voor een sollicitatie, feest of bruiloft. Vanaf-prijs.',
    options: ONE(70, 60),
    from: true,
    care: 'styling',
  },
  {
    id: 'krullen',
    category: 'styling',
    name: 'Vrouwen – haar krullen',
    short: 'Krullen',
    blurb: 'Steil haar omgetoverd tot volle krullen met de krultang.',
    options: ONE(50, 60),
    care: 'styling',
  },
  {
    id: 'permanent',
    category: 'styling',
    name: 'Vrouwen – permanent',
    short: 'Permanent',
    blurb: 'Krullen die blijven: rollers en een vloeistof die de vorm vastzet.',
    options: L([120, 60], [150, 60], [200, 60]),
    care: 'permanent',
  },
  {
    id: 'ext-microring',
    category: 'extensions',
    name: 'Hair extensions – micro ring, per streng (50, 60 of 70 cm)',
    short: 'Micro ring',
    blurb: 'Strengen vastgezet met kleine, platte ringetjes: niet schadelijk voor je eigen haar.',
    options: ONE(3.5, 60),
    perStrand: true,
    care: 'extensions',
  },
  {
    id: 'ext-nanoring',
    category: 'extensions',
    name: 'Hair extensions – nano ring, per streng (50, 60 of 70 cm)',
    short: 'Nano ring',
    blurb: 'Nog kleinere ringetjes, bijna onzichtbaar: ideaal voor fijn haar.',
    options: ONE(3.5, 60),
    perStrand: true,
    care: 'extensions',
  },
  {
    id: 'ext-keratine',
    category: 'extensions',
    name: 'Hair microkeratine extensions (wax), per streng (50, 60 of 70 cm)',
    short: 'Microkeratine',
    blurb: 'Strengen met een klein keratine-bondje, voor een natuurlijke val.',
    options: ONE(3.5, 60),
    perStrand: true,
    care: 'extensions',
  },
  { id: 'ext-intake', category: 'extensions', name: 'Extensions – intake, per streng', short: 'Extensions inzetten', blurb: 'Het inzetten van extensions, per streng.', options: ONE(1.5, 60), perStrand: true, care: 'extensions' },
  {
    id: 'ext-verwijderen',
    category: 'extensions',
    name: 'Extensions verwijderen, per streng',
    short: 'Extensions verwijderen',
    blurb: 'Met een speciale vloeistof weken de bondjes los, zonder je eigen haar te beschadigen.',
    options: ONE(1.5, 60),
    perStrand: true,
    care: 'extensions',
  },
  {
    id: 'advies',
    category: 'extensions',
    name: 'Gratis adviesgesprek',
    short: 'Gratis advies',
    blurb: 'Een kwartier om je wensen te bespreken: kleur, extensions of een nieuwe look.',
    options: ONE(0, 15),
    care: 'styling',
  },
];

export const serviceById = (id: ServiceId) => SERVICES.find((s) => s.id === id)!;
export const servicesIn = (category: CategoryId) => SERVICES.filter((s) => s.category === category);
export const optionOf = (service: Service, optionId?: string) => service.options.find((o) => o.id === optionId) ?? service.options[0];

/** "€ 40 – 60", "vanaf € 170", "€ 3,50 per streng", "Gratis". */
export function priceLabel(service: Service): string {
  if (service.perStrand) return `${euro(service.options[0].price)} per streng`;
  const prices = service.options.map((o) => o.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max === 0) return 'Gratis';
  if (service.from) return `vanaf ${euro(min)}`;
  return min === max ? euro(min) : `${euro(min)} – ${max}`;
}

export function minutesLabel(service: Service): string {
  const mins = service.options.map((o) => o.minutes);
  const min = Math.min(...mins);
  const max = Math.max(...mins);
  const f = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} u ${m % 60}` : `${m / 60} u`);
  return min === max ? f(min) : `${f(min)} – ${f(max)}`;
}

/** How to tell your length, for the price per length. */
export const LENGTHS: { id: Length; label: string; hint: string }[] = [
  { id: 'kort', label: 'Kort', hint: 'Tot je kin' },
  { id: 'halflang', label: 'Halflang', hint: 'Tot je schouders' },
  { id: 'lang', label: 'Lang', hint: 'Over je schouders' },
];

// ---------------------------------------------------------------------------------------------------------------
// What happens during a visit, step by step: the live salon in the panel and the timer in the app both follow this.

export type StepKind =
  | 'wassen' | 'knippen' | 'föhnen' | 'aanbrengen' | 'folies' | 'inwerken' | 'uitspoelen'
  | 'stijltang' | 'stylen' | 'krullen' | 'wikkelen' | 'extensions' | 'advies';

export type Station = 'chair' | 'basin';

export const STEP_LABEL: Record<StepKind, string> = {
  wassen: 'Wassen',
  knippen: 'Knippen',
  föhnen: 'Föhnen',
  aanbrengen: 'Kleur aanbrengen',
  folies: 'Folies zetten',
  inwerken: 'Inwerken',
  uitspoelen: 'Uitspoelen & toner',
  stijltang: 'Verzegelen met stijltang',
  stylen: 'Stylen',
  krullen: 'Krullen',
  wikkelen: 'Rollers zetten',
  extensions: 'Extensions zetten',
  advies: 'Adviesgesprek',
};

export const STATION_OF: Record<StepKind, Station> = {
  wassen: 'basin',
  uitspoelen: 'basin',
  knippen: 'chair',
  föhnen: 'chair',
  aanbrengen: 'chair',
  folies: 'chair',
  inwerken: 'chair',
  stijltang: 'chair',
  stylen: 'chair',
  krullen: 'chair',
  wikkelen: 'chair',
  extensions: 'chair',
  advies: 'chair',
};

/** A step's share of the visit: fixed minutes (above 1), or a share (up to 1) of what is left after the fixed steps. */
type Part = [StepKind, number];

const PLANS: Record<ServiceId, Part[]> = {
  'dames-knippen': [['wassen', 10], ['knippen', 0.7], ['föhnen', 0.3]],
  pony: [['knippen', 1]],
  heren: [['wassen', 5], ['knippen', 1]],
  kinderen: [['knippen', 1]],
  uitgroei: [['aanbrengen', 15], ['inwerken', 30], ['uitspoelen', 10], ['föhnen', 1]],
  kleuren: [['aanbrengen', 15], ['inwerken', 30], ['uitspoelen', 10], ['föhnen', 1]],
  toner: [['wassen', 5], ['aanbrengen', 10], ['inwerken', 20], ['uitspoelen', 5], ['föhnen', 1]],
  blondering: [['aanbrengen', 0.25], ['inwerken', 0.4], ['uitspoelen', 0.2], ['föhnen', 0.15]],
  highlights: [['folies', 0.32], ['inwerken', 0.24], ['uitspoelen', 0.12], ['knippen', 0.17], ['föhnen', 0.15]],
  'balayage-refresh': [['aanbrengen', 0.3], ['inwerken', 0.3], ['uitspoelen', 0.15], ['föhnen', 0.25]],
  balayage: [['aanbrengen', 0.3], ['inwerken', 0.24], ['uitspoelen', 0.12], ['knippen', 0.18], ['föhnen', 0.16]],
  airtouch: [['aanbrengen', 0.32], ['inwerken', 0.24], ['uitspoelen', 0.12], ['knippen', 0.16], ['föhnen', 0.16]],
  babylights: [['folies', 0.36], ['inwerken', 0.22], ['uitspoelen', 0.12], ['knippen', 0.15], ['föhnen', 0.15]],
  lowlights: [['folies', 20], ['inwerken', 25], ['uitspoelen', 10], ['föhnen', 1]],
  olaplex: [['wassen', 5], ['aanbrengen', 5], ['inwerken', 10], ['uitspoelen', 5], ['föhnen', 1]],
  keratine: [['wassen', 10], ['aanbrengen', 15], ['inwerken', 15], ['stijltang', 1]],
  proteine: [['wassen', 10], ['aanbrengen', 15], ['inwerken', 15], ['stijltang', 1]],
  brazilian: [['wassen', 10], ['aanbrengen', 0.25], ['inwerken', 0.25], ['stijltang', 0.5]],
  fohnen: [['wassen', 10], ['föhnen', 1]],
  opsteken: [['stylen', 1]],
  krullen: [['krullen', 1]],
  permanent: [['wassen', 5], ['wikkelen', 25], ['inwerken', 20], ['uitspoelen', 5], ['föhnen', 1]],
  'ext-microring': [['extensions', 1]],
  'ext-nanoring': [['extensions', 1]],
  'ext-keratine': [['extensions', 1]],
  'ext-intake': [['extensions', 1]],
  'ext-verwijderen': [['extensions', 1]],
  advies: [['advies', 1]],
};

export type Step = { kind: StepKind; station: Station; minutes: number };

/** The steps of a visit of `minutes` minutes; the fixed parts first, the rest shared out, rounded to whole minutes. */
export function planSteps(serviceId: ServiceId, minutes: number): Step[] {
  const parts = PLANS[serviceId];
  const fixed = parts.filter(([, v]) => v > 1).reduce((s, [, v]) => s + v, 0);
  const shareTotal = parts.filter(([, v]) => v <= 1).reduce((s, [, v]) => s + v, 0) || 1;
  const left = Math.max(5, minutes - fixed);
  const steps = parts.map(([kind, v]) => ({
    kind,
    station: STATION_OF[kind],
    minutes: v > 1 ? v : Math.max(5, Math.round((left * v) / shareTotal / 5) * 5),
  }));
  // Rounding may leave a few minutes over or short; the last step takes the difference.
  const sum = steps.reduce((s, x) => s + x.minutes, 0);
  steps[steps.length - 1].minutes = Math.max(5, steps[steps.length - 1].minutes + (minutes - sum));
  return steps;
}
