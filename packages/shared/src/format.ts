// Dates, times and prices, written out in Dutch instead of Intl so they look the same in every JS engine.

const WEEKDAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const WEEKDAYS_LONG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export const weekdayShort = (date: Date) => WEEKDAYS_SHORT[date.getDay()];
export const weekdayLong = (date: Date) => WEEKDAYS_LONG[date.getDay()];
export const monthLong = (date: Date) => MONTHS_LONG[date.getMonth()];
export const monthShort = (date: Date) => MONTHS_SHORT[date.getMonth()];

/** "wo 28 okt" */
export const dayShort = (date: Date) => `${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

/** "woensdag 28 oktober" */
export const dayLong = (date: Date) => `${WEEKDAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS_LONG[date.getMonth()]}`;

/** "28 okt" */
export const dateShort = (date: Date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;

/** "28 oktober 2026" */
export const dateLong = (date: Date) => `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;

/** "14:05" */
export const clock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** "€ 40", "€ 3,50": cents only when there are any. */
export function euro(amount: number): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  const value = whole ? String(Math.round(amount)) : amount.toFixed(2).replace('.', ',');
  return `€ ${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** "45 min", "1 u", "2 u 30 min" */
export function duration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} u ${rest} min` : `${h} u`;
}

/** "12:04" for a countdown of minutes and seconds. */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monday of the week that contains `date`. */
export const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Minutes since midnight. */
export const minuteOf = (date: Date) => date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

/** A moment on `day`, `minutes` after midnight. */
export const atMinute = (day: Date, minutes: number) => new Date(startOfDay(day).getTime() + Math.round(minutes * 60) * 1000);

/** "vandaag", "morgen", "overmorgen", or "vr 30 okt". */
export function relativeDay(day: Date, now: Date): string {
  const diff = Math.round((startOfDay(day).getTime() - startOfDay(now).getTime()) / 86400000);
  if (diff === 0) return 'vandaag';
  if (diff === 1) return 'morgen';
  if (diff === 2) return 'overmorgen';
  if (diff === -1) return 'gisteren';
  return dayShort(day);
}

/** "3 weken geleden", "2 maanden geleden" */
export function ago(then: Date, now: Date): string {
  const days = Math.floor((startOfDay(now).getTime() - startOfDay(then).getTime()) / 86400000);
  if (days <= 0) return 'vandaag';
  if (days === 1) return 'gisteren';
  if (days < 14) return `${days} dagen geleden`;
  if (days < 61) return `${Math.round(days / 7)} weken geleden`;
  return `${Math.round(days / 30.4)} maanden geleden`;
}

/** "1 stoel", "3 stoelen" */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Goedemorgen", "Goedemiddag", "Goedenavond" */
export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}
