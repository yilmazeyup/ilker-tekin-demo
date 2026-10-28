import { CLIENTS, formulaFor, type Client, type Formula } from './clients';
import { DRINKS, type DrinkId } from './drinks';
import { addMinutes, atMinute, dateKey, minuteOf, startOfDay } from './format';
import { LOOKS } from './looks';
import { planSteps, serviceById, type Option, type Service, type ServiceId, type Step } from './menu';
import { between, pick, rng, weighted, type Rng } from './random';
import { salonHours } from './salon';
import { BASINS, CHAIRS, STYLISTS, stylistById, worksOn, type Stylist, type StylistId } from './team';

/**
 * A day in the salon, the same on every load and in both the app and the panel: who comes when, with whom, for what,
 * and every step of the visit (wash, colour, processing, rinse, blow-dry) on the clock. `floorAt` turns it into the
 * floor at one moment: who sits in which chair, who is at the basin, who waits, and who is next.
 */

export type Source = 'app' | 'treatwell' | 'telefoon' | 'inloop';

export type TimedStep = Step & { start: Date; end: Date; /** Basin 0 or 1, or -1 while both are taken. */ basin: number };

export type Appt = {
  id: string;
  client: Client;
  stylist: StylistId;
  chair: number;
  service: ServiceId;
  option: Option;
  /** Planned start, as in the agenda. */
  start: Date;
  /** When the stylist actually starts: later when the client before ran over. */
  begin: Date;
  end: Date;
  minutes: number;
  price: number;
  strands?: number;
  steps: TimedStep[];
  source: Source;
  firstVisit: boolean;
  /** Arrives at the door. */
  arrive: Date;
  /** Booked in the app today: until then the slot is free in the agenda. */
  bookedAt?: Date;
  drink?: { id: DrinkId; at: Date };
  /** Sent photos of her hair now and of her dream look before the visit. */
  consult?: { look: string; at: Date };
  formula?: Formula;
  tip: number;
  pay: 'pin' | 'app' | 'contant';
  walkIn: boolean;
  /** The app's demo member. */
  member?: boolean;
};

const WEIGHTS: Record<StylistId, [ServiceId, number][]> = {
  ilker: [['dames-knippen', 5], ['heren', 4], ['uitgroei', 3], ['kleuren', 2], ['balayage', 2], ['keratine', 1], ['fohnen', 2], ['toner', 1], ['pony', 1], ['highlights', 1], ['olaplex', 1]],
  selin: [['uitgroei', 6], ['kleuren', 4], ['balayage', 3], ['balayage-refresh', 2], ['toner', 3], ['lowlights', 1], ['airtouch', 1], ['dames-knippen', 2], ['olaplex', 1]],
  noor: [['babylights', 3], ['highlights', 3], ['blondering', 2], ['toner', 4], ['airtouch', 2], ['olaplex', 2], ['uitgroei', 2], ['dames-knippen', 2], ['keratine', 1]],
  daan: [['heren', 8], ['dames-knippen', 6], ['kinderen', 2], ['pony', 2], ['fohnen', 2], ['krullen', 1]],
  lina: [['ext-microring', 2], ['ext-nanoring', 1], ['ext-keratine', 1], ['keratine', 2], ['brazilian', 1], ['opsteken', 2], ['krullen', 2], ['fohnen', 3], ['dames-knippen', 2], ['advies', 1], ['proteine', 1]],
};

const WALK_IN: [ServiceId, number][] = [['heren', 6], ['pony', 2], ['fohnen', 2], ['kinderen', 1]];

function pickOption(r: Rng, service: Service, client: Client): Option {
  if (service.options.length === 1) return service.options[0];
  return service.options.find((o) => o.length === client.length) ?? pick(r, service.options);
}

function pickClient(r: Rng, stylist: StylistId, service: Service, used: Set<string>): Client {
  const kind = service.audience === 'men' ? 'man' : service.audience === 'kids' ? 'kid' : 'woman';
  const pool = CLIENTS.filter((c) => c.kind === kind && !used.has(c.id));
  const regulars = pool.filter((c) => c.favourite === stylist);
  const from = regulars.length && r() < 0.72 ? regulars : pool;
  const client = from.length ? pick(r, from) : pick(r, CLIENTS);
  used.add(client.id);
  return client;
}

function makeAppt(r: Rng, stylist: Stylist, serviceId: ServiceId, client: Client, startMinute: number, day: Date, source: Source): Appt {
  const service = serviceById(serviceId);
  const option = pickOption(r, service, client);
  let minutes = option.minutes;
  let price = option.price;
  let strands: number | undefined;
  if (service.perStrand) {
    strands = serviceId === 'ext-verwijderen' ? pick(r, [60, 80, 100, 120]) : pick(r, [50, 75, 100, 125, 150]);
    minutes = Math.max(60, Math.round((30 + strands * 0.9) / 15) * 15);
    price = strands * option.price;
  }
  const start = atMinute(day, startMinute);
  const id = `${stylist.id}-${dateKey(day)}-${startMinute}`;
  const early = r() < 0.1 ? -between(r, 2, 6) : between(r, 3, 14);
  return {
    id,
    client,
    stylist: stylist.id,
    chair: stylist.chair,
    service: serviceId,
    option,
    start,
    begin: start,
    end: addMinutes(start, minutes),
    minutes,
    price,
    strands,
    steps: [],
    source,
    firstVisit: r() < 0.12,
    arrive: addMinutes(start, -early),
    tip: r() < 0.3 ? pick(r, [2, 2.5, 5, 5, 10]) : 0,
    pay: weighted(r, [['pin', 5], ['app', 3], ['contant', 1]] as const),
    walkIn: source === 'inloop',
    formula: service.colour ? formulaFor(serviceId, client, r) : undefined,
  };
}

/** The stylist's own appointments of the day, back to back with small gaps and a lunch break. */
function stylistDay(stylist: Stylist, day: Date, used: Set<string>): Appt[] {
  const hours = salonHours(day);
  if (!hours || !worksOn(stylist, day)) return [];
  const r = rng(`ilker-${dateKey(day)}-${stylist.id}`);
  const out: Appt[] = [];
  let minute = hours.open * 60 + pick(r, [0, 0, 15, 30]);
  let lunch = false;
  for (let guard = 0; guard < 40; guard++) {
    if (!lunch && minute >= 12 * 60 + 15) {
      minute = Math.max(minute, 12 * 60 + 45) + pick(r, [0, 15]);
      lunch = true;
    }
    const serviceId = weighted(r, WEIGHTS[stylist.id]);
    const service = serviceById(serviceId);
    const longest = Math.max(...service.options.map((o) => o.minutes));
    if (minute + Math.min(longest, 60) > hours.close * 60 - 15) break;
    if (r() < 0.87) {
      const source: Source = weighted(r, [['app', 4], ['treatwell', 3], ['telefoon', 2]] as const);
      const appt = makeAppt(r, stylist, serviceId, pickClient(r, stylist.id, service, used), minute, day, source);
      if (minuteOf(appt.end) > hours.close * 60) {
        used.delete(appt.client.id);
        minute += 15;
        continue;
      }
      out.push(appt);
      minute += appt.minutes + pick(r, [0, 0, 0, 15, 15, 30]);
    } else {
      minute += pick(r, [30, 45, 60]);
    }
  }
  return out;
}

/** Walk-ins fill gaps of half an hour or more with İlker, Daan and Lina. */
function addWalkIns(day: Date, appts: Appt[], used: Set<string>) {
  const hours = salonHours(day)!;
  const r = rng(`ilker-walkins-${dateKey(day)}`);
  const takers = STYLISTS.filter((s) => ['ilker', 'daan', 'lina'].includes(s.id) && worksOn(s, day));
  const count = between(r, 3, 6);
  for (let i = 0; i < count && takers.length; i++) {
    const stylist = pick(r, takers);
    const own = appts.filter((a) => a.stylist === stylist.id).sort((a, b) => a.start.getTime() - b.start.getTime());
    const gaps: number[] = [];
    let cursor = hours.open * 60 + 30;
    for (const a of own) {
      const s = minuteOf(a.start);
      if (s - cursor >= 35) gaps.push(cursor);
      cursor = Math.max(cursor, minuteOf(a.end));
    }
    if (hours.close * 60 - 30 - cursor >= 35) gaps.push(cursor);
    const open = gaps.filter((g) => g < hours.close * 60 - 45);
    if (!open.length) continue;
    const at = pick(r, open) + pick(r, [0, 5, 10]);
    let serviceId = weighted(r, WALK_IN);
    if (stylist.skips.includes(serviceId)) serviceId = 'fohnen';
    const service = serviceById(serviceId);
    const appt = makeAppt(r, stylist, serviceId, pickClient(r, stylist.id, service, used), at, day, 'inloop');
    appt.arrive = addMinutes(appt.start, -between(r, 6, 30));
    appt.walkIn = true;
    appt.id = `walkin-${appt.id}`;
    appts.push(appt);
  }
}

/** Running over: a client who takes longer pushes the next one back; the steps follow the real start. */
function schedule(day: Date, appts: Appt[]) {
  const r = rng(`ilker-overrun-${dateKey(day)}`);
  for (const stylist of STYLISTS) {
    const own = appts.filter((a) => a.stylist === stylist.id).sort((a, b) => a.start.getTime() - b.start.getTime());
    let free = 0;
    for (const a of own) {
      const overrun = a.member ? 0 : r() < 0.2 ? pick(r, [5, 10, 10, 15]) : 0;
      const begin = Math.max(a.start.getTime(), free, a.member ? a.begin.getTime() : 0);
      a.begin = new Date(begin);
      a.end = new Date(begin + (a.minutes + overrun) * 60000);
      free = a.end.getTime();
      const steps = planSteps(a.service, a.minutes + overrun);
      let t = begin;
      a.steps = steps.map((s) => {
        const start = new Date(t);
        t += s.minutes * 60000;
        return { ...s, start, end: new Date(t), basin: -1 };
      });
    }
  }
  // The two basins: first come, first served; whoever finds both taken is washed a moment later at the chair.
  const free = Array.from({ length: BASINS }, () => 0);
  const basinSteps = appts.flatMap((a) => a.steps.filter((s) => s.station === 'basin')).sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const step of basinSteps) {
    const b = free.findIndex((until) => until <= step.start.getTime());
    if (b >= 0) {
      step.basin = b;
      free[b] = step.end.getTime();
    }
  }
}

/** Drinks, consult photos and app bookings made today: the extras the live day plays. */
function decorate(day: Date, appts: Appt[]) {
  const r = rng(`ilker-extras-${dateKey(day)}`);
  const hours = salonHours(day)!;
  for (const a of appts) {
    if (r() < 0.48) {
      const at = a.minutes >= 90 ? addMinutes(a.begin, between(r, 15, 50)) : addMinutes(a.arrive, between(r, 1, 4));
      a.drink = { id: r() < 0.7 ? a.client.drink : pick(r, DRINKS).id, at };
    }
    if (serviceById(a.service).colour && r() < 0.45) {
      const looks = LOOKS.filter((l) => l.service !== 'heren');
      a.consult = { look: pick(r, looks).id, at: addMinutes(a.start, -between(r, 60 * 20, 60 * 72)) };
    }
    if (a.source === 'app' && minuteOf(a.start) - hours.open * 60 >= 120 && r() < 0.35) {
      a.bookedAt = addMinutes(a.start, -between(r, 60, 6 * 60));
      if (minuteOf(a.bookedAt) < 7 * 60) a.bookedAt = atMinute(day, 7 * 60 + between(r, 5, 50));
    }
  }
}

const cache = new Map<string, Appt[]>();

/** The whole day, sorted by start. Closed days are empty. */
export function salonDay(day: Date): Appt[] {
  const key = dateKey(day);
  const hit = cache.get(key);
  if (hit) return hit;
  const date = startOfDay(day);
  if (!salonHours(date)) {
    cache.set(key, []);
    return [];
  }
  const used = new Set<string>();
  const appts = STYLISTS.flatMap((s) => stylistDay(s, date, used));
  addWalkIns(date, appts, used);
  schedule(date, appts);
  decorate(date, appts);
  appts.sort((a, b) => a.start.getTime() - b.start.getTime());
  cache.set(key, appts);
  return appts;
}

/**
 * Puts the member's own visit into the day: her stylist's appointments that overlap it move to another day, and the
 * steps are planned again from her (possibly later) start.
 */
export function withVisit(day: Date, visit: Appt | null): Appt[] {
  const base = salonDay(day);
  if (!visit || dateKey(visit.start) !== dateKey(day)) return base;
  const from = visit.start.getTime() - 15 * 60000;
  const to = visit.start.getTime() + (visit.minutes + 25) * 60000;
  const keep = base
    .filter((a) => !(a.stylist === visit.stylist && a.end.getTime() > from && a.start.getTime() < to))
    .map((a) => ({ ...a, steps: a.steps.map((s) => ({ ...s })) }));
  const out = [...keep, { ...visit, member: true }];
  schedule(startOfDay(day), out);
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// -----------------------------------------------------------------------------------------------------------------
// The floor at one moment.

export type ChairState = {
  chair: number;
  stylist: Stylist | null;
  appt: Appt | null;
  step: TimedStep | null;
  /** The client is at the basin right now; the chair waits for her. */
  away: boolean;
  /** Share of the whole visit done, 0 to 1. */
  progress: number;
  /** Milliseconds left in the current step. */
  stepLeft: number;
  /** Milliseconds until the end of the visit. */
  left: number;
  next: Appt | null;
  /** When this chair is free for someone new. */
  freeAt: Date | null;
};

export type Waiting = { appt: Appt; since: Date; late: number };

export type Floor = {
  chairs: ChairState[];
  basins: { appt: Appt; step: TimedStep }[];
  waiting: Waiting[];
  next: Appt[];
  done: Appt[];
  /** 0 is empty, 1 is every chair taken and people waiting. */
  busy: number;
  busyLabel: 'Rustig' | 'Gezellig druk' | 'Druk' | 'Vol';
  /** Minutes a walk-in would wait now. */
  walkInWait: number;
  nextFree: { chair: number; stylist: Stylist; at: Date } | null;
  staff: Stylist[];
};

export const phaseOf = (a: Appt, t: Date): 'later' | 'waiting' | 'now' | 'done' =>
  t.getTime() >= a.end.getTime() ? 'done' : t.getTime() >= a.begin.getTime() ? 'now' : t.getTime() >= a.arrive.getTime() ? 'waiting' : 'later';

export const stepAt = (a: Appt, t: Date) => a.steps.find((s) => t.getTime() >= s.start.getTime() && t.getTime() < s.end.getTime()) ?? null;

/** When a stylist can start someone new: after the current client and any back-to-back ones. */
export function freeFrom(appts: Appt[], stylist: StylistId, t: Date, minutes = 30): Date | null {
  const day = startOfDay(t);
  const hours = salonHours(day);
  if (!hours) return null;
  const own = appts.filter((a) => a.stylist === stylist && a.end.getTime() > t.getTime()).sort((a, b) => a.begin.getTime() - b.begin.getTime());
  let cursor = Math.max(t.getTime() + 5 * 60000, day.getTime() + hours.open * 3600000);
  for (const a of own) {
    if (a.begin.getTime() - cursor >= minutes * 60000) break;
    cursor = Math.max(cursor, a.end.getTime());
  }
  const close = day.getTime() + hours.close * 3600000;
  return cursor + minutes * 60000 <= close ? new Date(Math.ceil(cursor / 300000) * 300000) : null;
}

export function floorAt(appts: Appt[], t: Date, queue = 0): Floor {
  const day = startOfDay(t);
  const staff = STYLISTS.filter((s) => worksOn(s, day));
  const chairs: ChairState[] = Array.from({ length: CHAIRS }, (_, chair) => {
    const stylist = staff.find((s) => s.chair === chair) ?? null;
    const own = appts.filter((a) => a.chair === chair);
    const appt = own.find((a) => phaseOf(a, t) === 'now') ?? null;
    const step = appt ? stepAt(appt, t) : null;
    const next = own.filter((a) => a.begin.getTime() > t.getTime()).sort((a, b) => a.begin.getTime() - b.begin.getTime())[0] ?? null;
    return {
      chair,
      stylist,
      appt,
      step,
      away: !!step && step.station === 'basin' && step.basin >= 0,
      progress: appt ? Math.min(1, (t.getTime() - appt.begin.getTime()) / (appt.end.getTime() - appt.begin.getTime())) : 0,
      stepLeft: step ? step.end.getTime() - t.getTime() : 0,
      left: appt ? appt.end.getTime() - t.getTime() : 0,
      next,
      freeAt: stylist ? freeFrom(appts, stylist.id, t) : null,
    };
  });
  const basins = appts.flatMap((a) => {
    const step = phaseOf(a, t) === 'now' ? stepAt(a, t) : null;
    return step && step.station === 'basin' && step.basin >= 0 ? [{ appt: a, step }] : [];
  });
  const waiting = appts
    .filter((a) => phaseOf(a, t) === 'waiting')
    .map((a) => ({ appt: a, since: a.arrive, late: Math.max(0, Math.round((a.begin.getTime() - a.start.getTime()) / 60000)) }))
    .sort((a, b) => a.appt.begin.getTime() - b.appt.begin.getTime());
  const next = appts.filter((a) => phaseOf(a, t) === 'later').sort((a, b) => a.begin.getTime() - b.begin.getTime()).slice(0, 4);
  const done = appts.filter((a) => phaseOf(a, t) === 'done');
  const taken = chairs.filter((c) => c.appt).length;
  const busy = staff.length ? Math.min(1, (taken + waiting.length * 0.5 + queue * 0.5) / Math.max(1, staff.length)) : 0;
  const busyLabel = busy < 0.35 ? 'Rustig' : busy < 0.7 ? 'Gezellig druk' : busy < 0.95 ? 'Druk' : 'Vol';
  // A walk-in goes to whoever has half an hour first; everyone already in the queue goes before.
  const soonest = chairs.filter((c) => c.stylist && c.freeAt).sort((a, b) => a.freeAt!.getTime() - b.freeAt!.getTime())[0];
  const walkInWait = soonest ? Math.max(5, Math.round((soonest.freeAt!.getTime() - t.getTime()) / 60000) + queue * 20) : 0;
  return {
    chairs,
    basins,
    waiting,
    next,
    done,
    busy,
    busyLabel,
    walkInWait,
    nextFree: soonest ? { chair: soonest.chair, stylist: soonest.stylist!, at: soonest.freeAt! } : null,
    staff,
  };
}

/** Booked minutes against the open minutes of everyone who works that day. */
export function occupancy(appts: Appt[], day: Date): number {
  const hours = salonHours(day);
  if (!hours) return 0;
  const open = (hours.close - hours.open) * 60 * STYLISTS.filter((s) => worksOn(s, day)).length;
  return open ? appts.reduce((sum, a) => sum + a.minutes, 0) / open : 0;
}

export const revenueOf = (appts: Appt[]) => appts.reduce((sum, a) => sum + a.price, 0);

export { stylistById };
