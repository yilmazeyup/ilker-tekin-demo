import { SALON } from './salon';

/**
 * The frizz forecast: today's humidity and dew point in Eindhoven from Open-Meteo (free, no account; only the salon's
 * coordinates are sent), turned into a frizz score with advice. Without a connection the app shows a demo value.
 */

export type Weather = {
  temperature: number;
  humidity: number;
  dewPoint: number;
  rain: number;
  /** Humidity per hour today, 0 to 23. */
  hourly: number[];
  live: boolean;
};

export type Frizz = { score: number; level: 'Laag' | 'Middel' | 'Hoog' | 'Extreem'; title: string; advice: string[]; peak: number };

export function frizzFrom(w: Weather): Frizz {
  const score = Math.round(Math.max(0, Math.min(100, (w.dewPoint - 2) * 5 + (w.humidity - 60) * 0.6 + (w.rain > 0 ? 8 : 0))));
  const day = w.hourly.slice(7, 22);
  const peak = day.length ? 7 + day.indexOf(Math.max(...day)) : 14;
  if (score < 25)
    return {
      score,
      level: 'Laag',
      title: 'Droge lucht: gladde dag',
      advice: ['Een vleugje No.7 tegen statisch haar', 'Föhnen mag gewoon', 'Ideaal voor een strakke stijltang-look'],
      peak,
    };
  if (score < 50)
    return {
      score,
      level: 'Middel',
      title: 'Een beetje pluis in de lucht',
      advice: ['Koud naföhnen sluit de schubben', 'Een leave-in zoals No.6 in vochtig haar', 'Krullen houden het tot de avond'],
      peak,
    };
  if (score < 75)
    return {
      score,
      level: 'Hoog',
      title: 'Vochtig: frizz ligt op de loer',
      advice: ['Sla de stijltang over: kies golven of een knot', 'No.6 en een druppel No.7 in de lengtes', 'Haar niet aanraken als het droog is'],
      peak,
    };
  return {
    score,
    level: 'Extreem',
    title: 'Frizz-alarm',
    advice: ['Vandaag een vlecht of een sleek bun', 'Keratine houdt je haar maanden glad', 'Neem een zijden scrunchie mee'],
    peak,
  };
}

/** A believable October day, for when the weather can't be fetched. */
export const DEMO_WEATHER: Weather = {
  temperature: 12,
  humidity: 86,
  dewPoint: 9.6,
  rain: 0.2,
  hourly: [92, 92, 93, 93, 94, 94, 94, 93, 90, 86, 82, 79, 77, 76, 76, 78, 81, 84, 87, 89, 90, 91, 91, 92],
  live: false,
};

export async function fetchWeather(signal?: AbortSignal): Promise<Weather> {
  const { lat, lon } = SALON.geo;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
    '&current=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation&hourly=relative_humidity_2m&forecast_days=1&timezone=Europe%2FAmsterdam';
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`weather ${response.status}`);
  const data = (await response.json()) as {
    current: { temperature_2m: number; relative_humidity_2m: number; dew_point_2m: number; precipitation: number };
    hourly: { relative_humidity_2m: number[] };
  };
  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    dewPoint: data.current.dew_point_2m,
    rain: data.current.precipitation,
    hourly: data.hourly.relative_humidity_2m.slice(0, 24),
    live: true,
  };
}
