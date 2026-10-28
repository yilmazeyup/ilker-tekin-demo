import type { CareId } from './menu';

/** Aftercare per kind of treatment, with the reminders the app schedules after a visit. General hair-care advice. */

export type Reminder = { afterHours: number; title: string; text: string };
export type Care = { id: CareId; title: string; intro: string; dos: string[]; donts: string[]; reminders: Reminder[] };

export const CARE: Record<CareId, Care> = {
  knippen: {
    id: 'knippen',
    title: 'Na het knippen',
    intro: 'Een goede coupe blijft het mooist met regelmatig bijknippen en een beetje hittebescherming.',
    dos: ['Föhn met een hittebeschermer', 'Slaap op een zijden kussensloop tegen pluis', 'Elke 6 tot 8 weken bijknippen'],
    donts: ['Niet heet föhnen op natte punten', 'Geen elastiekjes met metaal'],
    reminders: [
      { afterHours: 24 * 7, title: 'Nog tevreden?', text: 'Laat een foto en een review achter voor je stylist.' },
      { afterHours: 24 * 42, title: 'Tijd om bij te knippen', text: 'Na zes weken blijven de punten mooi met een kleine knipbeurt.' },
    ],
  },
  kleur: {
    id: 'kleur',
    title: 'Je nieuwe kleur',
    intro: 'De eerste dagen sluit de schublaag van het haar zich: zo blijft de kleur het langst helder.',
    dos: ['Wacht 48 uur met wassen', 'Was lauw, met een shampoo voor gekleurd haar', 'Gebruik hittebescherming'],
    donts: ['Geen chloor of zout water de eerste week', 'Geen diepreinigende shampoo'],
    reminders: [
      { afterHours: 48, title: 'Je mag weer wassen', text: 'Lauw water en Vitamino Color houden je kleur helder.' },
      { afterHours: 24 * 14, title: 'Glans terug?', text: 'Een masker per week houdt de kleur diep en glanzend.' },
      { afterHours: 24 * 35, title: 'Uitgroei in zicht', text: 'Na vijf weken is je uitgroei ongeveer 1,5 cm. Plan je volgende afspraak.' },
    ],
  },
  blond: {
    id: 'blond',
    title: 'Blond en highlights',
    intro: 'Blond heeft extra zorg nodig: verbindingen herstellen en geel tegengaan.',
    dos: ['Eén keer per week Olaplex No.3', 'Eén keer per week een paarse shampoo', 'Altijd hittebescherming'],
    donts: ['Geen stijltang boven 185 °C', 'Niet elke dag wassen'],
    reminders: [
      { afterHours: 48, title: 'Eerste wasbeurt', text: 'Gebruik No.4 en No.5, lauw water.' },
      { afterHours: 24 * 7, title: 'No.3-avond', text: 'Tijd voor je wekelijkse Hair Perfector.' },
      { afterHours: 24 * 49, title: 'Toner verfrissen?', text: 'Na zeven weken vervaagt de toner. Een verfspoeling maakt je blond weer helder.' },
    ],
  },
  olaplex: {
    id: 'olaplex',
    title: 'Na je Olaplex',
    intro: 'De verbindingen in je haar zijn hersteld. Thuis houd je ze sterk.',
    dos: ['No.3 één keer per week', 'No.4 en No.5 bij het wassen', 'No.7 in de punten'],
    donts: ['Niet heet föhnen zonder bescherming'],
    reminders: [{ afterHours: 24 * 7, title: 'No.3-avond', text: 'Houd je haar sterk met je wekelijkse Hair Perfector.' }],
  },
  keratine: {
    id: 'keratine',
    title: 'Na je keratine',
    intro: 'De keratine moet drie dagen hechten. Daarna is je haar maandenlang glad en glanzend.',
    dos: ['Drie dagen niet wassen', 'Haar los dragen, achter je oren', 'Daarna een sulfaatvrije shampoo'],
    donts: ['Geen staart, klemmen of petten de eerste 72 uur', 'Niet zwemmen de eerste week'],
    reminders: [
      { afterHours: 72, title: 'Je mag weer wassen', text: 'Kies een sulfaatvrije shampoo, zoals Liss Unlimited.' },
      { afterHours: 24 * 100, title: 'Gladheid neemt af?', text: 'Na drie à vijf maanden is het tijd voor een nieuwe keratine.' },
    ],
  },
  styling: {
    id: 'styling',
    title: 'Je styling langer mooi',
    intro: 'Met een paar trucjes houd je je föhnbeurt of krullen langer.',
    dos: ['Slaap met een zijden scrunchie', 'Droogshampoo bij de wortel op dag twee'],
    donts: ['Niet met natte handen door je haar'],
    reminders: [{ afterHours: 24, title: 'Hoe zit het?', text: 'Deel een foto van je look in een review.' }],
  },
  permanent: {
    id: 'permanent',
    title: 'Na je permanent',
    intro: 'De krul zet zich de eerste twee dagen vast.',
    dos: ['48 uur niet wassen', 'Kneed met een krulcrème', 'Laat aan de lucht drogen of gebruik een diffuser'],
    donts: ['Niet borstelen als het droog is', 'Geen stijltang'],
    reminders: [{ afterHours: 48, title: 'Eerste wasbeurt', text: 'Zachte shampoo en Curl Expression in vochtig haar.' }],
  },
  extensions: {
    id: 'extensions',
    title: 'Je extensions',
    intro: 'Goed verzorgd blijven extensions maanden mooi en voel je ze niet.',
    dos: ['Twee keer per dag borstelen met een loop-borstel', "'s Nachts een losse vlecht", 'Conditioner alleen in de lengtes'],
    donts: ['Geen conditioner of olie op de bondjes', 'Niet met nat haar gaan slapen'],
    reminders: [
      { afterHours: 24 * 7, title: 'Zitten ze goed?', text: 'Voelt iets strak? Laat het weten, we kijken er gratis naar.' },
      { afterHours: 24 * 49, title: 'Tijd voor onderhoud', text: 'Na zes tot acht weken zetten we de ringetjes weer hoger.' },
    ],
  },
};
