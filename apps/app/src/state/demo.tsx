import {

  dateKey,
  emit,
  firstSlot,
  MEMBER,
  minutesFor,
  onBridge,
  pickupReady,
  planVisit,
  priceFor,
  productById,
  readBridge,
  resetBridge,
  REWARDS,
  serviceById,
  setVisit,
  type BridgeEvent,
  type BridgeState,
  type Booking,
  type Concern,
  type DrinkId,
  type ServiceId,
  type StylistId,
  type VisitPlan,
} from '@ilker/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { readClock } from './clock';

export type CartLine = { id: string; qty: number };
export type Order = { number: string; lines: CartLine[]; total: number; discount: number; placed: Date; ready: Date };
export type GiftCard = { code: string; amount: number; design: string; to: string; message: string; at: Date };
export type WaitEntry = {
  id: string;
  service: ServiceId;
  stylist: StylistId | 'any';
  part: 'ochtend' | 'middag' | 'hele dag';
  status: 'wacht' | 'aanbod' | 'geboekt';
  offer?: { start: Date; stylist: StylistId };
  at: Date;
};
export type Review = { id: string; stars: number; text: string; stylist: StylistId; service: ServiceId; photo?: string; tags: string[]; at: Date };
export type Consult = { now?: string; dream?: string; look?: string; notes: string; history: string[]; sent?: Date };
export type Payment = { visit: string; amount: number; tip: number; method: string; at: Date };

type State = {
  bookings: Booking[];
  saved: string[];
  cart: CartLine[];
  orders: Order[];
  points: number;
  vouchers: string[];
  gifts: GiftCard[];
  waitlist: WaitEntry[];
  reviews: Review[];
  quiz: Concern[] | null;
  consult: Consult;
  payment: Payment | null;
  tryOn: { look: string; technique: string } | null;
  reminders: string[];
  invited: number;
};

/** What the member did today that the salon sees too; it lives in the shared browser storage (see bridge.ts). */
export type Live = {
  visit: VisitPlan;
  checkedIn: Date | null;
  walkIn: { at: Date; service: ServiceId; wait: number } | null;
  drink: { id: DrinkId; at: Date } | null;
  consultSent: boolean;
  events: BridgeEvent[];
};

type Ctx = State & {
  live: Live;
  book: (b: Omit<Booking, 'id'>) => string;
  cancel: (id: string) => void;
  toggleSaved: (lookId: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  placeOrder: (useVoucher: boolean) => string;
  redeem: (rewardId: string) => boolean;
  buyGift: (g: Omit<GiftCard, 'code' | 'at'>) => string;
  joinWaitlist: (w: Pick<WaitEntry, 'service' | 'stylist' | 'part'>) => void;
  acceptOffer: (id: string) => string | null;
  addReview: (r: Omit<Review, 'id' | 'at'>) => void;
  setQuiz: (q: Concern[] | null) => void;
  setConsult: (c: Partial<Consult>) => void;
  sendConsult: () => void;
  checkIn: () => void;
  speedUp: (minutes: number) => void;
  orderDrink: (id: DrinkId) => void;
  joinWalkIn: (service: ServiceId, wait: number) => void;
  leaveWalkIn: () => void;
  pay: (amount: number, tip: number, method: string) => void;
  setTryOn: (t: State['tryOn']) => void;
  toggleReminder: (id: string) => void;
  invite: () => void;
  resetDemo: () => void;
};

function initial(): State {
  return {
    bookings: [],
    saved: [...MEMBER.looks],
    cart: [],
    orders: [],
    points: MEMBER.points,
    vouchers: [],
    gifts: [],
    waitlist: [],
    reviews: [],
    quiz: null,
    consult: { notes: '', history: [] },
    payment: null,
    tryOn: null,
    reminders: ['kleur'],
    invited: 0,
  };
}

/** Today's visit from the shared storage, or a fresh one when there is none for today (or it is long over). */
function ensureVisit(bridge: BridgeState): VisitPlan {
  const now = readClock().now;
  const v = bridge.visit;
  const end = v ? (v.begin ?? v.start + v.late * 60000) + minutesFor(v.service) * 60000 : 0;
  if (v && v.day === dateKey(now) && end > now.getTime() - 45 * 60000) return v;
  const plan = planVisit(now);
  setVisit(plan);
  return plan;
}

function deriveLive(bridge: BridgeState, visit: VisitPlan): Live {
  const today = visit.day;
  const events = bridge.events.filter((e) => dateKey(new Date(e.at)) === today);
  let walkIn: Live['walkIn'] = null;
  let drink: Live['drink'] = null;
  let consultSent = false;
  for (const e of events) {
    if (e.kind === 'walkin') walkIn = { at: new Date(e.at), service: e.service, wait: e.wait };
    if (e.kind === 'walkin-cancel') walkIn = null;
    if (e.kind === 'drink') drink = { id: e.drink, at: new Date(e.at) };
    if (e.kind === 'consult' && e.visit === visit.id) consultSent = true;
  }
  return { visit, checkedIn: visit.checkedIn ? new Date(visit.checkedIn) : null, walkIn, drink, consultSent, events };
}

const Context = createContext<Ctx | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>(initial);
  const [bridge, setBridge] = useState<BridgeState>(() => {
    const b = readBridge();
    const visit = ensureVisit(b);
    return { ...b, visit };
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => onBridge((b) => setBridge((prev) => ({ ...b, visit: b.visit ?? prev.visit }))), []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const visit = bridge.visit!;
  const live = useMemo(() => deriveLive(bridge, visit), [bridge, visit]);
  const now = () => readClock().now;
  const at = () => now().getTime();
  const name = MEMBER.name;

  const book = useCallback((b: Omit<Booking, 'id'>) => {
    const id = `bk-${b.start.getTime()}-${b.stylist}`;
    setState((s) => ({ ...s, bookings: [...s.bookings.filter((x) => x.id !== id), { ...b, id }].sort((x, y) => x.start.getTime() - y.start.getTime()) }));
    emit({ kind: 'booking', at: at(), name, service: b.service, stylist: b.stylist, start: b.start.getTime(), duo: !!b.duo });
    return id;
  }, []);

  const cancel = useCallback((id: string) => setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) })), []);

  const toggleSaved = useCallback((lookId: string) => {
    setState((s) => {
      const saved = s.saved.includes(lookId) ? s.saved.filter((x) => x !== lookId) : [...s.saved, lookId];
      emit({ kind: 'looks', at: at(), name, looks: saved });
      return { ...s, saved };
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setState((s) => {
      const rest = s.cart.filter((l) => l.id !== id);
      if (qty <= 0) return { ...s, cart: rest };
      const has = s.cart.some((l) => l.id === id);
      return { ...s, cart: has ? s.cart.map((l) => (l.id === id ? { id, qty } : l)) : [...s.cart, { id, qty }] };
    });
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    setState((s) => {
      const line = s.cart.find((l) => l.id === id);
      return { ...s, cart: line ? s.cart.map((l) => (l.id === id ? { id, qty: l.qty + qty } : l)) : [...s.cart, { id, qty }] };
    });
  }, []);

  const placeOrder = useCallback(
    (useVoucher: boolean) => {
      const placed = now();
      const number = `IT-${dateKey(placed).replace(/-/g, '').slice(2)}-${state.orders.length + 11}`;
      setState((s) => {
        const subtotal = s.cart.reduce((sum, l) => sum + (productById(l.id)?.price ?? 0) * l.qty, 0);
        const voucher = useVoucher && s.vouchers.includes('r-product');
        const discount = voucher ? Math.round(subtotal * 10) / 100 : 0;
        const total = subtotal - discount;
        const items = s.cart.reduce((n, l) => n + l.qty, 0);
        emit({ kind: 'order', at: placed.getTime(), name, total, items, number });
        return {
          ...s,
          cart: [],
          vouchers: voucher ? s.vouchers.filter((v, i) => i !== s.vouchers.indexOf('r-product')) : s.vouchers,
          points: s.points + Math.round(total),
          orders: [{ number, lines: s.cart, total, discount, placed, ready: pickupReady(placed) }, ...s.orders],
        };
      });
      return number;
    },
    [state.orders.length],
  );

  const redeem = useCallback(
    (rewardId: string) => {
      const reward = REWARDS.find((r) => r.id === rewardId);
      if (!reward || state.points < reward.points) return false;
      setState((s) => ({ ...s, points: s.points - reward.points, vouchers: [...s.vouchers, rewardId] }));
      return true;
    },
    [state.points],
  );

  const buyGift = useCallback((g: Omit<GiftCard, 'code' | 'at'>) => {
    const code = `IT${Math.floor(100000 + Math.random() * 899999)}`;
    setState((s) => ({ ...s, gifts: [{ ...g, code, at: now() }, ...s.gifts] }));
    return code;
  }, []);

  const joinWaitlist = useCallback((w: Pick<WaitEntry, 'service' | 'stylist' | 'part'>) => {
    const id = `wl-${Date.now()}`;
    const entry: WaitEntry = { ...w, id, status: 'wacht', at: now() };
    setState((s) => ({ ...s, waitlist: [entry, ...s.waitlist] }));
    emit({ kind: 'waitlist', at: at(), name, service: w.service, day: at() });
    // In the demo a place opens up a few seconds later: someone cancelled.
    const timer = setTimeout(() => {
      const minutes = minutesFor(w.service);
      const slot = firstSlot(w.service, minutes, w.stylist, now());
      if (!slot) return;
      setState((s) => ({ ...s, waitlist: s.waitlist.map((x) => (x.id === id ? { ...x, status: 'aanbod', offer: { start: slot.start, stylist: slot.stylist } } : x)) }));
    }, 7000);
    timers.current.push(timer);
  }, []);

  const acceptOffer = useCallback(
    (id: string) => {
      const entry = state.waitlist.find((w) => w.id === id);
      if (!entry?.offer) return null;
      const service = serviceById(entry.service);
      const bookingId = book({
        service: entry.service,
        optionId: service.options.find((o) => o.length === MEMBER.length)?.id ?? service.options[0].id,
        stylist: entry.offer.stylist,
        start: entry.offer.start,
        minutes: minutesFor(entry.service),
        price: priceFor(entry.service),
      });
      setState((s) => ({ ...s, waitlist: s.waitlist.map((w) => (w.id === id ? { ...w, status: 'geboekt' } : w)) }));
      return bookingId;
    },
    [state.waitlist, book],
  );

  const addReview = useCallback((r: Omit<Review, 'id' | 'at'>) => {
    setState((s) => ({ ...s, points: s.points + 25, reviews: [{ ...r, id: `rv-${Date.now()}`, at: now() }, ...s.reviews] }));
    emit({ kind: 'review', at: at(), name, stars: r.stars, text: r.text, stylist: r.stylist });
  }, []);

  const setQuiz = useCallback((quiz: Concern[] | null) => setState((s) => ({ ...s, quiz })), []);
  const setConsult = useCallback((c: Partial<Consult>) => setState((s) => ({ ...s, consult: { ...s.consult, ...c } })), []);
  const sendConsult = useCallback(() => {
    setState((s) => {
      emit({ kind: 'consult', at: at(), name, look: s.consult.look ?? null, visit: visit.id, now: s.consult.now, dream: s.consult.dream, notes: s.consult.notes, history: s.consult.history });
      return { ...s, consult: { ...s.consult, sent: now() } };
    });
  }, [visit.id]);

  const checkIn = useCallback(() => {
    const t = at();
    setVisit({ ...visit, checkedIn: t });
    emit({ kind: 'checkin', at: t, name, visit: visit.id });
  }, [visit]);

  const speedUp = useCallback(
    (minutes: number) => {
      const begin = (visit.begin ?? visit.start + visit.late * 60000) - minutes * 60000;
      setVisit({ ...visit, begin, checkedIn: visit.checkedIn ?? Math.min(at(), begin - 60000) });
    },
    [visit],
  );

  const orderDrink = useCallback(
    (id: DrinkId) => {
      emit({ kind: 'drink', at: at(), name, drink: id, chair: visit.checkedIn ? visit.chair : null });
    },
    [visit],
  );

  const joinWalkIn = useCallback((service: ServiceId, wait: number) => {
    emit({ kind: 'walkin', at: at(), name, service, wait });
  }, []);
  const leaveWalkIn = useCallback(() => {
    emit({ kind: 'walkin-cancel', at: at(), name });
  }, []);

  const pay = useCallback(
    (amount: number, tip: number, method: string) => {
      emit({ kind: 'pay', at: at(), name, amount });
      if (tip > 0) emit({ kind: 'tip', at: at(), name, amount: tip, stylist: visit.stylist });
      setState((s) => ({ ...s, points: s.points + Math.round(amount), payment: { visit: visit.id, amount, tip, method, at: now() } }));
    },
    [visit],
  );

  const setTryOn = useCallback((tryOn: State['tryOn']) => setState((s) => ({ ...s, tryOn })), []);
  const toggleReminder = useCallback(
    (id: string) => setState((s) => ({ ...s, reminders: s.reminders.includes(id) ? s.reminders.filter((x) => x !== id) : [...s.reminders, id] })),
    [],
  );
  const invite = useCallback(() => setState((s) => ({ ...s, invited: s.invited + 1 })), []);

  const resetDemo = useCallback(() => {
    resetBridge();
    const plan = planVisit(now());
    setVisit(plan);
    setBridge({ visit: plan, events: [] });
    setState(initial());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      live,
      book,
      cancel,
      toggleSaved,
      addToCart,
      setQty,
      placeOrder,
      redeem,
      buyGift,
      joinWaitlist,
      acceptOffer,
      addReview,
      setQuiz,
      setConsult,
      sendConsult,
      checkIn,
      speedUp,
      orderDrink,
      joinWalkIn,
      leaveWalkIn,
      pay,
      setTryOn,
      toggleReminder,
      invite,
      resetDemo,
    }),
    [state, live, book, cancel, toggleSaved, addToCart, setQty, placeOrder, redeem, buyGift, joinWaitlist, acceptOffer, addReview, setQuiz, setConsult, sendConsult, checkIn, speedUp, orderDrink, joinWalkIn, leaveWalkIn, pay, setTryOn, toggleReminder, invite, resetDemo],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}

