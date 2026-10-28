import type { DrinkId } from './drinks';
import type { VisitPlan } from './member';
import type { ServiceId } from './menu';
import type { StylistId } from './team';

/**
 * The live link between the app and the panel. Both are served from the same site, so they share the browser's
 * storage: what the member does in the app (check in, order a drink, join the queue, send consult photos) is written
 * here and shows up in the panel at once, also when the two are open side by side on the start page.
 * Nothing leaves the browser.
 */

export type BridgeEvent = { id: string; /** Salon clock, ms. */ at: number; name: string } & (
  | { kind: 'walkin'; service: ServiceId; wait: number }
  | { kind: 'walkin-cancel' }
  | { kind: 'checkin'; visit: string }
  | { kind: 'drink'; drink: DrinkId; chair: number | null }
  | { kind: 'consult'; look: string | null; visit: string; now?: string; dream?: string; notes?: string; history?: string[] }
  | { kind: 'booking'; service: ServiceId; stylist: StylistId | null; start: number; duo?: boolean }
  | { kind: 'waitlist'; service: ServiceId; day: number }
  | { kind: 'review'; stars: number; text: string; stylist: StylistId }
  | { kind: 'tip'; amount: number; stylist: StylistId }
  | { kind: 'pay'; amount: number }
  | { kind: 'order'; total: number; items: number; number: string }
  | { kind: 'looks'; looks: string[] }
  | { kind: 'late-ok'; visit: string }
);

export type BridgeState = { visit: VisitPlan | null; events: BridgeEvent[] };

const KEY = 'ilker-tekin-demo-v1';
const CHANNEL = 'ilker-tekin-demo';
const EMPTY: BridgeState = { visit: null, events: [] };

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

let channel: BroadcastChannel | null = null;
const getChannel = () => {
  if (!channel && typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(CHANNEL);
  return channel;
};

export function readBridge(): BridgeState {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as BridgeState;
    return { visit: parsed.visit ?? null, events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return EMPTY;
  }
}

function write(state: BridgeState) {
  try {
    storage()?.setItem(KEY, JSON.stringify({ ...state, events: state.events.slice(-120) }));
  } catch {
    // Private mode or storage off: the demo still works on this screen.
  }
  getChannel()?.postMessage('changed');
}

export function updateBridge(update: (state: BridgeState) => BridgeState) {
  write(update(readBridge()));
}

let seq = 0;

/** Adds what the member just did; returns the event with its id. */
export function emit<E extends Omit<BridgeEvent, 'id'>>(event: E): BridgeEvent {
  const full = { ...event, id: `${event.kind}-${Date.now()}-${++seq}` } as unknown as BridgeEvent;
  updateBridge((s) => ({ ...s, events: [...s.events, full] }));
  return full;
}

export const setVisit = (visit: VisitPlan | null) => updateBridge((s) => ({ ...s, visit }));

export const resetBridge = () => write(EMPTY);

/** Calls back whenever the other screen changes something. */
export function onBridge(callback: (state: BridgeState) => void): () => void {
  const ch = getChannel();
  const onMessage = () => callback(readBridge());
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) callback(readBridge());
  };
  ch?.addEventListener('message', onMessage);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('storage', onStorage);
  return () => {
    ch?.removeEventListener('message', onMessage);
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('storage', onStorage);
  };
}
