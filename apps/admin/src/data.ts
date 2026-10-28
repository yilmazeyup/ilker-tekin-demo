import {
  addDays,
  type Appt,
  type BridgeEvent,
  type BridgeState,
  CATEGORIES,
  type CategoryId,
  CHROMA,
  type Client,
  clock as hhmm,
  dateKey,
  dayShort,
  drinkById,
  euro,
  floorAt,
  freeFrom,
  LOOKS,
  MEMBER,
  onBridge,
  phaseOf,
  readBridge,
  salonDay,
  salonHours,
  serviceById,
  type ShopOrder,
  shopOrders,
  shortName,
  startOfDay,
  startOfWeek,
  STEP_LABEL,
  stepAt,
  stylistById,
  STYLISTS,
  visitAppt,
  withVisit,
  worksOn,
} from '@ilker/shared';
import { useEffect, useMemo, useState } from 'react';

import type { FloorView } from './three/salon';

/** What the app wrote to the shared browser storage, kept up to date. */
export function useBridge(): BridgeState {
  const [state, setState] = useState(readBridge);
  useEffect(() => onBridge(setState), []);
  return state;
}

/** Today in the salon, with the app member's visit in it when she has one today. */
export function useDay(now: Date, bridge: BridgeState): Appt[] {
  const key = dateKey(now);
  const visitKey = bridge.visit ? JSON.stringify(bridge.visit) : '';
  return useMemo(() => {
    const visit = bridge.visit && bridge.visit.day === key ? visitAppt(bridge.visit) : null;
    return withVisit(startOfDay(now), visit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, visitKey]);
}

/** App events of the day so far. */
export function eventsToday(bridge: BridgeState, now: Date): BridgeEvent[] {
  const key = dateKey(now);
  return bridge.events.filter((e) => dateKey(new Date(e.at)) === key && e.at <= now.getTime());
}

const LEVEL = ['#120C0A', '#1A1210', '#2B1B12', '#3A2618', '#4E3422', '#6B4630', '#8C6040', '#B98A5E', '#D7B27C', '#E8D3A6', '#F1E4C2'];

/** The colour a client's hair shows in the 3D salon. */
export function hairOf(client: Client): string {
  if (client.id === MEMBER.id) return '#B4531F';
  if (client.state === 'blond') return '#E3C995';
  if (client.state === 'highlights') return '#A47A4E';
  if (client.state === 'gekleurd') return ['#7A2E10', '#5B2B1A', '#4A1A14', '#8A3B22'][client.level % 4];
  return LEVEL[Math.max(1, Math.min(10, client.level))];
}

/** The floor for the 3D scene: who sits where, who waits on the sofa, who pays at the desk. */
export function floorView(appts: Appt[], now: Date, bridge: BridgeState): FloorView {
  const events = eventsToday(bridge, now);
  const walkIns = new Map<string, BridgeEvent>();
  for (const e of events) {
    if (e.kind === 'walkin') walkIns.set(e.name, e);
    if (e.kind === 'walkin-cancel') walkIns.delete(e.name);
  }
  const drinks = events.filter((e) => e.kind === 'drink');
  const floor = floorAt(appts, now, walkIns.size);
  const chairs = floor.chairs.map((c) => {
    const stylist = c.stylist ? { name: c.stylist.name.split(' ')[0], colour: CHROMA[c.stylist.chroma].stops[1] } : null;
    if (!c.appt || !c.step) return { chair: c.chair, stylist, appt: null, mixing: false };
    const a = c.appt;
    const drinkFromApp = a.member && drinks.some((d) => d.kind === 'drink' && d.at >= a.arrive.getTime() - 10 * 60000);
    const drink = drinkFromApp || (!!a.drink && now.getTime() >= a.drink.at.getTime() && now.getTime() - a.drink.at.getTime() < 40 * 60000);
    return {
      chair: c.chair,
      stylist,
      mixing: c.step.kind === 'inwerken',
      appt: {
        id: a.id,
        name: a.member ? 'Yara B.' : shortName(a.client.name),
        hair: hairOf(a.client),
        man: a.client.kind !== 'woman',
        service: serviceById(a.service).short,
        step: STEP_LABEL[c.step.kind],
        kind: c.step.kind,
        atBasin: c.step.station === 'basin' ? c.step.basin : -1,
        progress: c.progress,
        stepLeft: c.stepLeft,
        left: c.left,
        member: !!a.member,
        late: Math.max(0, Math.round((a.begin.getTime() - a.start.getTime()) / 60000)),
        drink,
      },
    };
  });
  const waiting = [
    ...floor.waiting.map((w) => ({
      id: w.appt.id,
      name: w.appt.member ? 'Yara B.' : shortName(w.appt.client.name),
      hair: hairOf(w.appt.client),
      man: w.appt.client.kind !== 'woman',
      member: !!w.appt.member,
      walkIn: w.appt.walkIn,
      app: w.appt.source === 'app',
    })),
    ...[...walkIns.values()].map((e) => ({ id: e.id, name: 'Yara B.', hair: '#B4531F', man: false, member: true, walkIn: true, app: true })),
  ];
  const paying = floor.done
    .filter((a) => now.getTime() - a.end.getTime() < 3 * 60000)
    .slice(0, 2)
    .map((a) => ({ id: a.id, name: shortName(a.client.name), hair: hairOf(a.client), man: a.client.kind !== 'woman' }));
  return { chairs, waiting, paying, washing: floor.basins.length > 0 };
}

export type FeedItem = { id: string; at: Date; icon: string; tone: string; title: string; text: string; app?: boolean; photos?: string[] };

/** Everything that happened today, newest first: the salon's own day and what the member did in the app. */
export function feedFor(appts: Appt[], now: Date, bridge: BridgeState): FeedItem[] {
  const t = now.getTime();
  const items: FeedItem[] = [];
  for (const a of appts) {
    const name = a.member ? 'Yara B.' : shortName(a.client.name);
    const service = serviceById(a.service).short;
    if (a.bookedAt && a.bookedAt.getTime() <= t)
      items.push({ id: `bk-${a.id}`, at: a.bookedAt, icon: '＋', tone: CHROMA.roze.stops[1], title: 'Geboekt in de app', text: `${name} · ${service} om ${hhmm(a.start)} bij ${stylistById(a.stylist).name.split(' ')[0]}` });
    if (a.walkIn && a.arrive.getTime() <= t) items.push({ id: `wi-${a.id}`, at: a.arrive, icon: '→', tone: CHROMA.kers.stops[1], title: 'Inloop', text: `${name} wil ${service.toLowerCase()}` });
    if (a.drink && a.drink.at.getTime() <= t) items.push({ id: `dr-${a.id}`, at: a.drink.at, icon: '☕', tone: CHROMA.mocha.stops[1], title: `${drinkById(a.drink.id).name} besteld`, text: `${name}, stoel ${a.chair + 1}` });
    if (a.end.getTime() <= t && !a.member)
      items.push({ id: `pay-${a.id}`, at: a.end, icon: '€', tone: CHROMA.honing.stops[1], title: `Afgerekend · ${euro(a.price)}`, text: `${name} · ${service}${a.tip ? ` · ${euro(a.tip)} fooi` : ''} · ${a.pay === 'app' ? 'in de app' : a.pay === 'pin' ? 'pin' : 'contant'}` });
  }
  for (const e of eventsToday(bridge, now)) {
    const at = new Date(e.at);
    const base = { id: e.id, at, app: true };
    switch (e.kind) {
      case 'walkin':
        items.push({ ...base, icon: '→', tone: CHROMA.kers.stops[1], title: 'In de inloopwachtrij via de app', text: `${e.name} · ${serviceById(e.service).short} · ± ${e.wait} min` });
        break;
      case 'walkin-cancel':
        items.push({ ...base, icon: '←', tone: CHROMA.ijs.stops[1], title: 'Uit de wachtrij', text: e.name });
        break;
      case 'checkin':
        items.push({ ...base, icon: '✓', tone: '#5BE3A6', title: 'Ingecheckt met de app', text: `${e.name} zit in de wachtruimte` });
        break;
      case 'drink':
        items.push({ ...base, icon: '☕', tone: CHROMA.mocha.stops[1], title: `${drinkById(e.drink).name} besteld in de app`, text: e.chair !== null ? `${e.name}, stoel ${e.chair + 1}` : `${e.name}, wachtruimte` });
        break;
      case 'consult':
        items.push({
          ...base,
          icon: '◐',
          tone: CHROMA.violet.stops[1],
          title: "Consult-foto's ontvangen",
          text: `${e.name}${e.look ? ` · droomlook ${LOOKS.find((l) => l.id === e.look)?.name ?? ''}` : ''}${e.history?.length ? ` · ${e.history.join(', ')}` : ''}${e.notes ? ` · “${e.notes}”` : ''}`,
          photos: [e.now, e.dream].filter((x): x is string => !!x),
        });
        break;
      case 'booking':
        items.push({ ...base, icon: '＋', tone: CHROMA.roze.stops[1], title: e.duo ? 'Duo-afspraak geboekt in de app' : 'Geboekt in de app', text: `${e.name} · ${serviceById(e.service).short} · ${dayShort(new Date(e.start))} ${hhmm(new Date(e.start))}` });
        break;
      case 'waitlist':
        items.push({ ...base, icon: '≡', tone: CHROMA.violet.stops[1], title: 'Op de wachtlijst', text: `${e.name} · ${serviceById(e.service).short}` });
        break;
      case 'review':
        items.push({ ...base, icon: '★', tone: CHROMA.honing.stops[1], title: `Review ${'★'.repeat(e.stars)}`, text: `${e.name} over ${stylistById(e.stylist).name.split(' ')[0]}: “${e.text}”` });
        break;
      case 'tip':
        items.push({ ...base, icon: '♥', tone: CHROMA.roze.stops[1], title: `Fooi · ${euro(e.amount)}`, text: `Van ${e.name} voor ${stylistById(e.stylist).name.split(' ')[0]}` });
        break;
      case 'pay':
        items.push({ ...base, icon: '€', tone: CHROMA.honing.stops[1], title: `Betaald in de app · ${euro(e.amount)}`, text: e.name });
        break;
      case 'order':
        items.push({ ...base, icon: '▣', tone: CHROMA.honing.stops[1], title: `Shopbestelling ${e.number}`, text: `${e.name} · ${e.items} producten · ${euro(e.total)} · ophalen` });
        break;
      case 'looks':
        items.push({ ...base, icon: '♡', tone: CHROMA.roze.stops[1], title: 'Looks bewaard voor de stylist', text: `${e.name}: ${e.looks.map((id) => LOOKS.find((l) => l.id === id)?.name ?? id).join(', ')}` });
        break;
      default:
        break;
    }
  }
  return items.filter((i) => i.at.getTime() <= t).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 60);
}

/** Revenue on a day up to a time of day: services finished plus shop orders. */
export function revenueUntil(appts: Appt[], orders: ShopOrder[], minute: number): number {
  return (
    appts.filter((a) => a.end.getHours() * 60 + a.end.getMinutes() <= minute).reduce((s, a) => s + a.price, 0) +
    orders.filter((o) => o.at.getHours() * 60 + o.at.getMinutes() <= minute).reduce((s, o) => s + o.total, 0)
  );
}

export const NAMES = ['Sophie V.', 'Elif K.', 'Emma B.', 'Salma B.', 'Lotte M.', 'Zeynep D.', 'Nora A.', 'Iris S.'];
export const ordersOn = (day: Date) => shopOrders(day, NAMES);

export type DaySales = { date: Date; byCategory: Record<CategoryId, number>; shop: number; booked: number; today: boolean; later: boolean };

/** This week, Monday to Saturday: earlier days as they ended, today up to now, later days with what is booked. */
export function weekSales(now: Date, today: Appt[]): DaySales[] {
  const monday = startOfWeek(now);
  return Array.from({ length: 6 }, (_, i) => {
    const date = addDays(monday, i);
    const isToday = dateKey(date) === dateKey(now);
    const later = date.getTime() > now.getTime() && !isToday;
    const appts = isToday ? today : salonDay(date);
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>;
    let booked = 0;
    for (const a of appts) {
      if (later || (isToday && a.end.getTime() > now.getTime())) booked += a.price;
      else byCategory[serviceById(a.service).category] += a.price;
    }
    const orders = ordersOn(date).filter((o) => !isToday || o.at.getTime() <= now.getTime());
    return { date, byCategory, shop: later ? 0 : orders.reduce((s, o) => s + o.total, 0), booked, today: isToday, later };
  });
}

/** A client's visits over the last months, newest first, from the salon's own days. */
export function historyOf(clientId: string, now: Date, days = 120): Appt[] {
  const out: Appt[] = [];
  for (let d = 1; d <= days; d++) {
    const day = addDays(startOfDay(now), -d);
    if (!salonHours(day)) continue;
    for (const a of salonDay(day)) if (a.client.id === clientId) out.push(a);
  }
  return out;
}

/** Per stylist today: how full, how much, and when they can take a walk-in. */
export function teamToday(appts: Appt[], now: Date) {
  const hours = salonHours(now);
  const open = hours ? (hours.close - hours.open) * 60 : 0;
  return STYLISTS.map((s) => {
    const own = appts.filter((a) => a.stylist === s.id);
    const minutes = own.reduce((sum, a) => sum + a.minutes, 0);
    const done = own.filter((a) => phaseOf(a, now) === 'done');
    const current = own.find((a) => phaseOf(a, now) === 'now') ?? null;
    return {
      stylist: s,
      working: worksOn(s, now),
      appts: own,
      load: open ? minutes / open : 0,
      revenue: done.reduce((sum, a) => sum + a.price, 0),
      booked: own.reduce((sum, a) => sum + a.price, 0),
      tips: done.reduce((sum, a) => sum + a.tip, 0),
      current,
      step: current ? stepAt(current, now) : null,
      free: freeFrom(appts, s.id, now),
    };
  });
}
