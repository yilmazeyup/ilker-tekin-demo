import type { ChromaId } from './menu';

/**
 * The twenty things the app adds to what the salon's site offers today (services, prices, "Book now" via Treatwell,
 * hours, address, contact). The start page lists them and links straight to each screen in the app.
 */
export type Feature = { no: number; id: string; title: string; line: string; path: string; chroma: ChromaId };

export const FEATURES: Feature[] = [
  { no: 1, id: 'nu', title: 'Nu in de salon', line: 'Hoe druk, hoe lang wachten, de eerstvolgende stoel, en meteen in de inloopwachtrij.', path: '/salon', chroma: 'kers' },
  { no: 2, id: 'kleurstudio', title: 'Kleur passen', line: 'Probeer koper, honing of ijsblond op je eigen foto.', path: '/kleurstudio', chroma: 'koper' },
  { no: 3, id: 'looks', title: 'Look-deck', line: 'Swipe door looks en bewaar je favorieten voor je stylist.', path: '/looks', chroma: 'roze' },
  { no: 4, id: 'consult', title: 'Consult vooraf', line: 'Foto van je haar nu en je droomlook: je stylist ziet ze voor je komt.', path: '/consult', chroma: 'violet' },
  { no: 5, id: 'paspoort', title: 'Haarpaspoort', line: 'Al je bezoeken, je kleurformule en de producten die we gebruikten.', path: '/paspoort', chroma: 'mocha' },
  { no: 6, id: 'uitgroei', title: 'Uitgroeiwekker', line: 'Weet hoeveel je uitgroei is, en wanneer je moet boeken.', path: '/uitgroei', chroma: 'honing' },
  { no: 7, id: 'quiz', title: 'Haarquiz', line: 'Zes vragen, jouw routine en de producten die erbij passen.', path: '/quiz', chroma: 'ijs' },
  { no: 8, id: 'wachtlijst', title: 'Wachtlijst', line: 'Eerder terecht? Je krijgt een seintje als er een plek vrijkomt.', path: '/wachtlijst', chroma: 'violet' },
  { no: 9, id: 'live', title: 'Live afspraak', line: 'Inchecken met QR, de inwerktijd live en een seintje als je stylist uitloopt.', path: '/live', chroma: 'kers' },
  { no: 10, id: 'drankje', title: 'Drankje aan je stoel', line: 'Bestel je cappuccino vanuit de stoel.', path: '/drankje', chroma: 'mocha' },
  { no: 11, id: 'club', title: 'Club', line: 'Niveaus, beloningen, cadeaukaarten en vriendinnen uitnodigen.', path: '/club', chroma: 'koper' },
  { no: 12, id: 'shop', title: 'Shop & ophalen', line: 'Olaplex en L’Oréal Professionnel, klaar om op te halen in de salon.', path: '/shop', chroma: 'honing' },
  { no: 13, id: 'nazorg', title: 'Nazorg', line: 'Per behandeling wat wel en niet, met herinneringen.', path: '/nazorg', chroma: 'ijs' },
  { no: 14, id: 'bruid', title: 'Bruid & events', line: 'Pakketten met proefkapsel, gepland vanaf je trouwdatum.', path: '/bruid', chroma: 'roze' },
  { no: 15, id: 'duo', title: 'Samen in de stoel', line: 'Twee stoelen naast elkaar, voor jou en je vriendin.', path: '/duo', chroma: 'violet' },
  { no: 16, id: 'review', title: 'Review met foto', line: 'Laat je nieuwe look zien na je bezoek.', path: '/review', chroma: 'roze' },
  { no: 17, id: 'betalen', title: 'Betalen & fooi', line: 'Afrekenen in de app, met een fooi voor je stylist.', path: '/betalen', chroma: 'kers' },
  { no: 18, id: 'frizz', title: 'Frizz-voorspelling', line: 'De luchtvochtigheid in Eindhoven vandaag, en wat je haar nodig heeft.', path: '/frizz', chroma: 'ijs' },
  { no: 19, id: 'team', title: 'Portfolio’s', line: 'Bekijk het werk van elke stylist en boek direct.', path: '/team', chroma: 'koper' },
  { no: 20, id: 'extensions', title: 'Extensions-planner', line: 'Kies lengte en volume: zoveel strengen, deze prijs.', path: '/extensions', chroma: 'honing' },
];
