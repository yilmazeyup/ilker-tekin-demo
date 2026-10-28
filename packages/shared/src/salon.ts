import { addDays, startOfDay } from './format';

/**
 * The salon's own facts, as on ilkertekinhairstylist.nl and its Treatwell page (October 2026): address, phone, hours,
 * socials and the brands it works with. Everything else in the demo (team besides İlker, clients, club) is made up.
 */
export const SALON = {
  name: 'İlker Tekin',
  title: 'Hairstylist & Academy',
  fullName: 'İlker Tekin Hairstylist & Academy',
  street: 'Poeijersstraat 37',
  postcode: '5642 GA',
  city: 'Eindhoven',
  phone: '06 48 393 214',
  phoneIntl: '+31648393214',
  email: 'info@ilkertekinhairstylist.nl',
  site: 'https://www.ilkertekinhairstylist.nl',
  instagram: 'https://www.instagram.com/ilkertekin_hairstylist/',
  instagramHandle: '@ilkertekin_hairstylist',
  tiktok: 'https://www.tiktok.com/@ilkertekin_hair_stylist',
  tiktokHandle: '@ilkertekin_hair_stylist',
  facebook: 'https://www.facebook.com/p/%C4%B0lker-Tekin-100070238133319/',
  /** The nearest bus stop, from the salon's Treatwell page. */
  stop: 'Hercules Segherslaan',
  geo: { lat: 51.4402086, lon: 5.5080989 },
  brands: ["L'Oréal Professionnel", 'Olaplex'],
  maps: 'https://www.google.com/maps/search/?api=1&query=Poeijersstraat+37+5642+GA+Eindhoven',
} as const;

export type Hours = { open: number; close: number };

/** Indexed like Date#getDay(): closed on Sunday and Monday, Tuesday to Saturday 09:00 to 18:00. */
const WEEK: (Hours | null)[] = [null, null, { open: 9, close: 18 }, { open: 9, close: 18 }, { open: 9, close: 18 }, { open: 9, close: 18 }, { open: 9, close: 18 }];

export const salonHours = (day: Date): Hours | null => WEEK[day.getDay()];

export function isOpenAt(moment: Date): boolean {
  const hours = salonHours(moment);
  if (!hours) return false;
  const h = moment.getHours() + moment.getMinutes() / 60;
  return h >= hours.open && h < hours.close;
}

/** The next moment the doors open, from `moment` on (today if it is still before nine on an open day). */
export function nextOpening(moment: Date): Date {
  for (let d = 0; d < 8; d++) {
    const day = addDays(startOfDay(moment), d);
    const hours = salonHours(day);
    if (!hours) continue;
    const open = new Date(day);
    open.setHours(hours.open, 0, 0, 0);
    if (open.getTime() > moment.getTime()) return open;
  }
  return moment;
}

/** The opening hours as the site writes them. */
export const HOURS_TEXT = [
  { days: 'Dinsdag – zaterdag', hours: '09:00 – 18:00' },
  { days: 'Zondag en maandag', hours: 'Gesloten' },
];

/** Olaplex as the salon explains it on its homepage, in short. */
export const OLAPLEX = {
  title: 'Wat is Olaplex?',
  intro:
    'Olaplex herstelt het haar van binnenuit. Het werkzame bestanddeel zoekt gebroken verbindingen in het haar op, die ontstaan door kleuren, hitte en borstelen, en zet ze weer vast. Zonder siliconen of olie, voor elk haartype, en vooral goed voor gekleurd en geblondeerd haar.',
  steps: [
    { no: 'No.1', name: 'Bond Multiplier', text: 'Gaat in de salon door de kleuring, blondering of permanent, of verdund als losse behandeling.' },
    { no: 'No.2', name: 'Bond Perfector', text: 'Brengen we aan direct nadat de kleur of blondering is uitgespoeld.' },
    { no: 'No.3+', name: 'Thuis', text: 'Met de producten voor thuis houd je de verbindingen sterk tot je volgende afspraak.' },
  ],
};

/** "Welkom": how the salon describes itself on its "Over ons" page, in short. */
export const ABOUT = [
  { title: 'Kwaliteit voorop', text: 'Een ervaren, vriendelijk team dat eerst luistert: haarontwerp, kleurverandering, knippen, permanent en meer.' },
  { title: 'Modern en comfortabel', text: 'Een moderne salon met comfortabele stoelen, zodat je tijd bij ons ontspannen is.' },
  { title: 'De beste merken', text: "We werken met L'Oréal Professionnel en Olaplex, en met goede apparatuur." },
  { title: 'Er voor jou', text: 'Mooi haar gaat ook over zelfvertrouwen. Ontdek jouw schoonheid.' },
];
