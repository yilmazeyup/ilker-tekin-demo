import { atMinute, offsetFrom, salonNow, startOfDay } from '@ilker/shared';
import { useEffect, useState } from 'react';

/** `?at=2026-10-28T14:20` (salon time) starts the clock at that moment and lets it run on from there. */
const OFFSET = offsetFrom(new URLSearchParams(window.location.search).get('at'));

const OPEN = 9 * 60;
const CLOSE = 18 * 60;
/** "Play the day": nine hours in a minute, a step every tenth of a second. */
const STEP_MIN = 0.9;
const TICK_MS = 100;

/**
 * The panel's clock. It runs on its own, every second: the real time in Eindhoven while the salon is open, otherwise a
 * replay of the busiest part of the last open day (the same clock as the app). "Speel de dag af" runs the whole day
 * from opening to closing in about a minute.
 */
export function useSalonClock() {
  const [clock, setClock] = useState(() => salonNow(new Date(), OFFSET));
  const [play, setPlay] = useState<Date | null>(null);

  useEffect(() => {
    if (play) return;
    const id = window.setInterval(() => setClock(salonNow(new Date(), OFFSET)), 1000);
    return () => window.clearInterval(id);
  }, [play]);

  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(() => {
      setPlay((p) => {
        if (!p) return p;
        const next = new Date(p.getTime() + STEP_MIN * 60000);
        return next.getHours() * 60 + next.getMinutes() >= CLOSE ? null : next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [play !== null]);

  const now = play ?? clock.now;
  const progress = play ? Math.min(1, (play.getHours() * 60 + play.getMinutes() - OPEN) / (CLOSE - OPEN)) : 0;
  return {
    now,
    demo: play ? true : clock.demo,
    reason: play ? ('play' as const) : clock.reason,
    playing: !!play,
    progress,
    play: () => setPlay(atMinute(startOfDay(clock.now), OPEN)),
    stop: () => setPlay(null),
  };
}
