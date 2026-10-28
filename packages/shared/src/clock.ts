import { addDays, atMinute, minuteOf, startOfDay } from './format';
import { isOpenAt, salonHours } from './salon';

export type SalonClock = {
  now: Date;
  /** False while the salon is really open and the demo follows the real clock. */
  demo: boolean;
  reason: 'live' | 'closed' | 'set';
};

const ZONE = 'Europe/Amsterdam';

/** Minutes the salon's time zone is ahead of UTC at `date`. */
function zoneOffset(date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch {
    return -date.getTimezoneOffset();
  }
}

/**
 * The time on the wall in Eindhoven, as a Date whose local hours and minutes read as the salon's: the demo can be
 * opened anywhere (Istanbul, Amsterdam) and still shows the salon's own clock.
 */
export function salonWallClock(real: Date = new Date()): Date {
  return new Date(real.getTime() + (zoneOffset(real) + real.getTimezoneOffset()) * 60000);
}

/** "2026-10-28T14:20" (seconds optional), in salon time, as an offset from the salon's wall clock; 0 when absent. */
export function offsetFrom(at: string | null | undefined, real: Date = new Date()): number {
  if (!at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(at)) return 0;
  const moment = new Date(at).getTime();
  return Number.isNaN(moment) ? 0 : moment - salonWallClock(real).getTime();
}

/**
 * The salon's clock for the demo, the same in the app and the panel. While the salon is open it is the real time in
 * Eindhoven. When it is closed (evenings, Sunday, Monday) the demo replays the busiest part of the last open day,
 * 10:30 to 16:30, at real speed, so the floor is always alive and both screens show the same moment.
 */
export function salonNow(real: Date = new Date(), offset = 0): SalonClock {
  const wall = salonWallClock(real);
  if (offset) return { now: new Date(wall.getTime() + offset), demo: true, reason: 'set' };
  if (isOpenAt(wall)) return { now: wall, demo: false, reason: 'live' };
  let day = startOfDay(wall);
  for (let i = 0; i < 7 && !salonHours(day); i++) day = addDays(day, -1);
  const minute = 10 * 60 + 30 + (minuteOf(wall) % 360);
  return { now: atMinute(day, minute), demo: true, reason: 'closed' };
}
