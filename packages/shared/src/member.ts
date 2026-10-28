import { formulaFor, type Client, type Formula } from './clients';
import { addDays, addMinutes, atMinute, dateKey, minuteOf, startOfDay } from './format';
import { optionOf, serviceById, type ServiceId } from './menu';
import { rng } from './random';
import { salonHours } from './salon';
import type { Appt } from './day';
import type { StylistId } from './team';

/** The app's demo member: a fictional client with two years of history at the salon. */
export const MEMBER: Client & { first: string; points: number; code: string; email: string } = {
  id: 'member',
  name: 'Yara Bakker',
  first: 'Yara',
  kind: 'woman',
  phone: '06 •• •• 48 21',
  email: 'yara@voorbeeld.nl',
  sinceYear: 2024,
  length: 'halflang',
  level: 6,
  grey: 0,
  texture: 'golvend',
  state: 'highlights',
  favourite: 'selin',
  formula: null,
  allergy: null,
  note: 'Kleur liever iets te warm dan te koel. Cappuccino met havermelk.',
  drink: 'cappuccino',
  looks: ['copper-glow', 'mocha-balayage'],
  points: 1240,
  code: 'YARA-GLOW',
};

export type Visit = {
  id: string;
  date: Date;
  service: ServiceId;
  optionId?: string;
  stylist: StylistId;
  price: number;
  formula?: Formula;
  /** Products used in the chair. */
  used: string[];
  /** Product ids bought to take home. */
  bought: string[];
  note?: string;
};

/** Yara's past visits, newest first, relative to today. */
export function memberHistory(today: Date): Visit[] {
  const r = rng('ilker-member-history');
  const at = (daysAgo: number, time: number) => atMinute(addDays(startOfDay(today), -daysAgo), time);
  return [
    {
      id: 'v-uitgroei-2',
      date: at(36, 10 * 60 + 30),
      service: 'uitgroei',
      stylist: 'selin',
      price: 50,
      formula: { mix: 'Majirel 6.34 (30 g) + 7.4 (15 g)', developer: 'Oxydant Crème 6% · 1:1,5', minutes: 35, extra: 'Olaplex No.1 in de kleur' },
      used: ['Olaplex No.1', 'Olaplex No.2', 'Vitamino Color'],
      bought: ['loreal-vitamino-shampoo'],
      note: 'Iets warmer gemaakt dan vorige keer, op verzoek.',
    },
    {
      id: 'v-balayage',
      date: at(92, 11 * 60),
      service: 'balayage',
      optionId: 'halflang',
      stylist: 'selin',
      price: 215,
      formula: formulaFor('balayage', { level: 6, grey: 0 }, r),
      used: ['Blond Studio', 'Olaplex No.1', 'Olaplex No.2', 'Dia Light'],
      bought: ['olaplex-3'],
      note: 'Karamel in de lengtes, wortel 6.34 laten staan.',
    },
    { id: 'v-olaplex', date: at(128, 15 * 60), service: 'olaplex', stylist: 'noor', price: 40, used: ['Olaplex No.1', 'Olaplex No.2'], bought: [] },
    {
      id: 'v-knippen',
      date: at(168, 9 * 60 + 30),
      service: 'dames-knippen',
      optionId: 'halflang',
      stylist: 'daan',
      price: 50,
      used: ['Absolut Repair'],
      bought: [],
      note: 'Laagjes rond het gezicht, 3 cm eraf.',
    },
    {
      id: 'v-uitgroei-1',
      date: at(205, 14 * 60),
      service: 'uitgroei',
      stylist: 'selin',
      price: 50,
      formula: { mix: 'Majirel 6.34 (30 g) + 6.0 (10 g)', developer: 'Oxydant Crème 6% · 1:1,5', minutes: 35 },
      used: ['Majirel', 'Olaplex No.1'],
      bought: ['olaplex-4'],
    },
    { id: 'v-keratine', date: at(262, 13 * 60), service: 'keratine', optionId: 'kort', stylist: 'lina', price: 100, used: ['Keratine', 'Stijltang'], bought: [] },
  ];
}

/** The member's visit today, as the app and the panel share it. */
export type VisitPlan = {
  id: string;
  day: string;
  service: ServiceId;
  stylist: StylistId;
  chair: number;
  /** Planned start, ms. */
  start: number;
  /** Her stylist runs this many minutes late. */
  late: number;
  checkedIn?: number;
  /** Started earlier than planned in the demo ("speed up"). */
  begin?: number;
};

/**
 * Today's visit: her regrowth, with Selin, at the next quarter hour that is at least twenty minutes away and still
 * fits the day; otherwise the next open morning.
 */
export function planVisit(now: Date): VisitPlan {
  const service = serviceById('uitgroei');
  const minutes = optionOf(service).minutes;
  let day = startOfDay(now);
  let start = Math.ceil((minuteOf(now) + 20) / 15) * 15;
  const hours = salonHours(day);
  if (!hours || start + minutes > hours.close * 60) {
    do day = addDays(day, 1);
    while (!salonHours(day));
    start = 10 * 60 + 15;
  }
  const at = atMinute(day, start);
  return { id: `visit-${dateKey(day)}-${start}`, day: dateKey(day), service: 'uitgroei', stylist: 'selin', chair: 1, start: at.getTime(), late: 10 };
}

/** The visit as an appointment in the salon's day. */
export function visitAppt(plan: VisitPlan): Appt {
  const service = serviceById(plan.service);
  const option = optionOf(service);
  const start = new Date(plan.start);
  const begin = plan.begin ? new Date(plan.begin) : addMinutes(start, plan.late);
  return {
    id: plan.id,
    client: MEMBER,
    stylist: plan.stylist,
    chair: plan.chair,
    service: plan.service,
    option,
    start,
    begin,
    end: addMinutes(begin, option.minutes),
    minutes: option.minutes,
    price: option.price,
    steps: [],
    source: 'app',
    firstVisit: false,
    arrive: plan.checkedIn ? new Date(plan.checkedIn) : addMinutes(start, 30 * 24 * 60),
    tip: 0,
    pay: 'app',
    walkIn: false,
    member: true,
    formula: { mix: 'Majirel 6.34 (30 g) + 7.4 (15 g)', developer: 'Oxydant Crème 6% · 1:1,5', minutes: 35, extra: 'Olaplex No.1 in de kleur' },
  };
}
