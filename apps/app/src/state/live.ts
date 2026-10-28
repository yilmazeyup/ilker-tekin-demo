import { floorAt, phaseOf, stepAt, visitAppt, withVisit, type Appt, type Floor, type TimedStep } from '@ilker/shared';
import { useMemo } from 'react';

import { useClock } from './clock';
import { useDemo } from './demo';

/** Today in the salon with the member's own visit in it; recomputed only when the day or her visit changes. */
export function useSalonDay(): { appts: Appt[]; visit: Appt } {
  const { live } = useDemo();
  const { now } = useClock();
  const dayKey = now.toDateString();
  const plan = live.visit;
  return useMemo(() => {
    const day = new Date(now);
    const appts = withVisit(day, visitAppt(plan));
    const visit = appts.find((a) => a.member) ?? visitAppt(plan);
    return { appts, visit };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, plan]);
}

/** The salon floor right now, with the walk-ins who joined the queue from the app counted in. */
export function useFloor(): Floor & { now: Date; demo: boolean } {
  const { appts } = useSalonDay();
  const { live } = useDemo();
  const clock = useClock();
  const queue = live.walkIn ? 1 : 0;
  const floor = floorAt(appts, clock.now, queue);
  return { ...floor, now: clock.now, demo: clock.demo };
}

export type VisitState = {
  appt: Appt;
  phase: 'later' | 'waiting' | 'now' | 'done';
  checkedIn: boolean;
  step: TimedStep | null;
  /** Milliseconds left in the current step, and in the whole visit. */
  stepLeft: number;
  left: number;
  progress: number;
  /** Minutes her stylist runs late. */
  late: number;
  /** Milliseconds until her stylist starts. */
  until: number;
  now: Date;
};

export function useVisit(): VisitState {
  const { visit } = useSalonDay();
  const { live } = useDemo();
  const { now } = useClock();
  const checkedIn = !!live.checkedIn;
  const raw = phaseOf(visit, now);
  // Until she checks in she is not in the waiting area yet, even if the planned time has come.
  const phase = raw === 'waiting' && !checkedIn ? 'later' : raw;
  const step = phase === 'now' ? stepAt(visit, now) : null;
  return {
    appt: visit,
    phase,
    checkedIn,
    step,
    stepLeft: step ? step.end.getTime() - now.getTime() : 0,
    left: Math.max(0, visit.end.getTime() - now.getTime()),
    progress: Math.max(0, Math.min(1, (now.getTime() - visit.begin.getTime()) / (visit.end.getTime() - visit.begin.getTime()))),
    late: Math.max(0, Math.round((visit.begin.getTime() - visit.start.getTime()) / 60000)),
    until: visit.begin.getTime() - now.getTime(),
    now,
  };
}
