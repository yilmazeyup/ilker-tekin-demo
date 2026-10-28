import { salonDay } from './day';
import { addDays, dateKey, startOfDay } from './format';
import { optionOf, serviceById, type ServiceId } from './menu';
import { salonHours } from './salon';
import { STYLISTS, doesService, worksOn, type Stylist, type StylistId } from './team';

/** A booking the member makes in the app. */
export type Booking = {
  id: string;
  service: ServiceId;
  optionId: string;
  stylist: StylistId;
  start: Date;
  minutes: number;
  price: number;
  strands?: number;
  /** Olaplex added to a colour treatment. */
  olaplex?: boolean;
  look?: string;
  /** Booked side by side with a friend. */
  duo?: { name: string; service: ServiceId; optionId: string; stylist: StylistId; chair: number };
};

export type Slot = { start: Date; stylist: StylistId };

export const stylistsFor = (serviceId: ServiceId): Stylist[] => STYLISTS.filter((s) => doesService(s, serviceById(serviceId)));

type Block = { from: number; to: number };

/** Busy stretches for a stylist on a day: the salon's own agenda plus the member's bookings. */
function busy(stylist: StylistId, day: Date, extra: Booking[]): Block[] {
  const own = salonDay(day)
    .filter((a) => a.stylist === stylist)
    .map((a) => ({ from: a.start.getTime(), to: a.start.getTime() + a.minutes * 60000 }));
  const mine = extra
    .filter((b) => b.stylist === stylist && dateKey(b.start) === dateKey(day))
    .map((b) => ({ from: b.start.getTime(), to: b.start.getTime() + b.minutes * 60000 }));
  return [...own, ...mine];
}

/**
 * Start times on a day for a service: inside opening hours, on the stylist's days, clear of the agenda, at least an
 * hour from now, every quarter of an hour, one stylist per time.
 */
export function openSlots(serviceId: ServiceId, minutes: number, stylist: StylistId | 'any', day: Date, now: Date, extra: Booking[] = []): Slot[] {
  const hours = salonHours(day);
  if (!hours) return [];
  const base = startOfDay(day).getTime();
  const candidates = stylistsFor(serviceId).filter((s) => (stylist === 'any' || s.id === stylist) && worksOn(s, day));
  const found = new Map<number, StylistId>();
  for (const s of candidates) {
    const blocks = busy(s.id, day, extra);
    for (let m = hours.open * 60; m + minutes <= hours.close * 60; m += 15) {
      const from = base + m * 60000;
      const to = from + minutes * 60000;
      if (from < now.getTime() + 60 * 60000) continue;
      if (blocks.some((b) => from < b.to && to > b.from)) continue;
      if (!found.has(from)) found.set(from, s.id);
    }
  }
  return [...found.entries()].sort((a, b) => a[0] - b[0]).map(([t, id]) => ({ start: new Date(t), stylist: id }));
}

/** The first free moment within three weeks. */
export function firstSlot(serviceId: ServiceId, minutes: number, stylist: StylistId | 'any', now: Date, extra: Booking[] = []): Slot | null {
  for (let d = 0; d < 21; d++) {
    const slots = openSlots(serviceId, minutes, stylist, addDays(startOfDay(now), d), now, extra);
    if (slots.length) return slots[0];
  }
  return null;
}

/** Minutes for a service option, with strands for extensions. */
export function minutesFor(serviceId: ServiceId, optionId?: string, strands?: number): number {
  const service = serviceById(serviceId);
  if (service.perStrand && strands) return Math.max(60, Math.round((30 + strands * 0.9) / 15) * 15);
  return optionOf(service, optionId).minutes;
}

export function priceFor(serviceId: ServiceId, optionId?: string, strands?: number): number {
  const service = serviceById(serviceId);
  const option = optionOf(service, optionId);
  return service.perStrand && strands ? option.price * strands : option.price;
}

/** Side by side: two neighbouring chairs whose stylists are both free at the same time. */
export function duoSlots(
  a: { service: ServiceId; minutes: number },
  b: { service: ServiceId; minutes: number },
  day: Date,
  now: Date,
  extra: Booking[] = [],
): { start: Date; first: Stylist; second: Stylist }[] {
  const working = STYLISTS.filter((s) => worksOn(s, day));
  const out: { start: Date; first: Stylist; second: Stylist }[] = [];
  const seen = new Set<number>();
  for (const s1 of working) {
    for (const s2 of working) {
      if (s1.id === s2.id || Math.abs(s1.chair - s2.chair) !== 1) continue;
      if (!doesService(s1, serviceById(a.service)) || !doesService(s2, serviceById(b.service))) continue;
      const first = openSlots(a.service, a.minutes, s1.id, day, now, extra);
      const second = new Set(openSlots(b.service, b.minutes, s2.id, day, now, extra).map((x) => x.start.getTime()));
      for (const slot of first) {
        const t = slot.start.getTime();
        if (second.has(t) && !seen.has(t)) {
          seen.add(t);
          out.push({ start: slot.start, first: s1, second: s2 });
        }
      }
    }
  }
  return out.sort((x, y) => x.start.getTime() - y.start.getTime());
}
