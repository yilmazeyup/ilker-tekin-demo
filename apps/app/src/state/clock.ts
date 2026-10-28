import { offsetFrom, salonNow, type SalonClock } from '@ilker/shared';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * The salon clock (see @ilker/shared salonNow): real Eindhoven time while the salon is open, a replay of a busy
 * stretch while it is closed. `?at=2026-10-28T14:20` on the web starts it at a set moment. One tick a second, and
 * only the parts that show the time re-render.
 */
const OFFSET =
  Platform.OS === 'web' && typeof location !== 'undefined' ? offsetFrom(new URLSearchParams(location.search).get('at')) : 0;

let current: SalonClock = salonNow(new Date(), OFFSET);
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      current = salonNow(new Date(), OFFSET);
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export const readClock = () => salonNow(new Date(), OFFSET);

/** The salon clock, updated every second. */
export function useClock(): SalonClock {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
