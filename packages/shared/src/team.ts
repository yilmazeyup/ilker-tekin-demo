import type { CategoryId, ChromaId, ServiceId } from './menu';

export type StylistId = 'ilker' | 'selin' | 'noor' | 'daan' | 'lina';

export type Stylist = {
  id: StylistId;
  name: string;
  role: string;
  /** İlker is real (the salon carries his name); only what his own site says is shown about him. */
  real?: boolean;
  /** His or her styling chair on the floor, 0 to 4 from the window. */
  chair: number;
  chroma: ChromaId;
  /** Working days, like Date#getDay(). */
  days: number[];
  specialties: CategoryId[];
  /** Services this stylist does not do. */
  skips: ServiceId[];
  bio?: string;
  /** Years in the trade, demo values for the fictional team only. */
  years?: number;
  signature?: string;
};

export const STYLISTS: Stylist[] = [
  {
    id: 'ilker',
    name: 'İlker Tekin',
    role: 'Hairstylist & Academy',
    real: true,
    chair: 0,
    chroma: 'kers',
    days: [2, 3, 4, 5, 6],
    specialties: ['knippen', 'kleuren', 'highlights', 'verzorging', 'styling', 'extensions'],
    skips: [],
  },
  {
    id: 'selin',
    name: 'Selin',
    role: 'Kleurspecialist',
    chair: 1,
    chroma: 'koper',
    days: [2, 3, 4, 5, 6],
    specialties: ['kleuren', 'highlights'],
    skips: ['heren', 'kinderen', 'ext-microring', 'ext-nanoring', 'ext-keratine', 'ext-intake', 'ext-verwijderen'],
    bio: 'Warme koper- en chocoladetinten, balayage die mooi uitgroeit. Mengt elke formule zelf aan de kleurbar.',
    years: 9,
    signature: 'Copper Glow',
  },
  {
    id: 'noor',
    name: 'Noor',
    role: 'Blond & babylights',
    chair: 2,
    chroma: 'honing',
    days: [3, 4, 5, 6],
    specialties: ['highlights', 'kleuren', 'verzorging'],
    skips: ['heren', 'kinderen', 'permanent', 'ext-microring', 'ext-nanoring', 'ext-keratine', 'ext-intake', 'ext-verwijderen'],
    bio: 'Van honing tot ijsblond, altijd met Olaplex. Toners op maat, zodat blond blond blijft.',
    years: 7,
    signature: 'Honey Babylights',
  },
  {
    id: 'daan',
    name: 'Daan',
    role: 'Knippen & heren',
    chair: 3,
    chroma: 'ijs',
    days: [2, 3, 4, 5],
    specialties: ['knippen', 'styling'],
    skips: ['blondering', 'highlights', 'balayage', 'balayage-refresh', 'airtouch', 'babylights', 'ext-microring', 'ext-nanoring', 'ext-keratine', 'ext-intake', 'ext-verwijderen', 'opsteken'],
    bio: 'Strakke fades, zachte laagjes en de perfecte bob. Snel, precies en altijd met een goed gesprek.',
    years: 6,
    signature: 'Glossy Bob',
  },
  {
    id: 'lina',
    name: 'Lina',
    role: 'Extensions & bruid',
    chair: 4,
    chroma: 'roze',
    days: [2, 3, 5, 6],
    specialties: ['extensions', 'styling', 'verzorging'],
    skips: ['heren', 'kinderen', 'blondering', 'highlights', 'babylights'],
    bio: 'Lengte en volume met micro en nano ring, keratine voor glashaar, en opsteken voor de mooiste dag.',
    years: 8,
    signature: 'Bridal Chignon',
  },
];

/** Not bookable: washes, helps at the colour bar and brings the drinks. */
export const ASSISTANT = { id: 'kim', name: 'Kim', role: 'Assistent · wasbak & kleurbar', chroma: 'violet' as ChromaId };

export const stylistById = (id: StylistId) => STYLISTS.find((s) => s.id === id)!;

export const worksOn = (s: Stylist, day: Date) => s.days.includes(day.getDay());

export function doesService(s: Stylist, service: { id: ServiceId; category: CategoryId }) {
  return s.specialties.includes(service.category) && !s.skips.includes(service.id);
}

export const CHAIRS = 5;
export const BASINS = 2;
