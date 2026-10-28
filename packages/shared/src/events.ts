import { addDays } from './format';
import type { ChromaId, ServiceId } from './menu';

/**
 * Bridal and event packages, put together from the salon's own menu; a package costs what its parts cost on the
 * menu, nothing is invented. The trial comes four to six weeks before the day.
 */

export type PackagePart = { service: ServiceId; optionId?: string; when: string; label: string; strands?: number };
export type EventPackage = { id: string; name: string; line: string; chroma: ChromaId; parts: PackagePart[]; perGuest?: boolean };

export const PACKAGES: EventPackage[] = [
  {
    id: 'bruid',
    name: 'Bruid · Signature',
    line: 'Proefkapsel, Olaplex een week ervoor en opsteken op de dag zelf.',
    chroma: 'honing',
    parts: [
      { service: 'advies', when: 'Na het boeken', label: 'Gratis adviesgesprek' },
      { service: 'opsteken', when: '4 à 6 weken ervoor', label: 'Proefkapsel (opsteken)' },
      { service: 'olaplex', when: '1 week ervoor', label: 'Olaplex-behandeling' },
      { service: 'opsteken', when: 'De dag zelf', label: 'Opsteken' },
    ],
  },
  {
    id: 'bruid-kleur',
    name: 'Bruid · Glow',
    line: 'Alles van Signature, plus een frisse kleur in de week ervoor.',
    chroma: 'koper',
    parts: [
      { service: 'advies', when: 'Na het boeken', label: 'Gratis adviesgesprek' },
      { service: 'opsteken', when: '4 à 6 weken ervoor', label: 'Proefkapsel (opsteken)' },
      { service: 'uitgroei', when: '1 week ervoor', label: 'Uitgroei kleuren' },
      { service: 'olaplex', when: '1 week ervoor', label: 'Olaplex-behandeling' },
      { service: 'opsteken', when: 'De dag zelf', label: 'Opsteken' },
    ],
  },
  {
    id: 'gasten',
    name: 'Bruidsmeisjes & gasten',
    line: 'Iedereen tegelijk klaar: per persoon krullen, föhnen of opsteken.',
    chroma: 'roze',
    perGuest: true,
    parts: [{ service: 'krullen', when: 'De dag zelf', label: 'Krullen per persoon' }],
  },
  {
    id: 'gala',
    name: 'Gala & feest',
    line: 'Hollywood waves of een strakke knot voor een avond om nooit te vergeten.',
    chroma: 'violet',
    parts: [{ service: 'krullen', when: 'Op de dag', label: 'Haar krullen' }],
  },
];

/** The trial date: five weeks before the day, never in the past. */
export function trialDate(event: Date, today: Date): Date {
  const trial = addDays(event, -35);
  return trial.getTime() < today.getTime() ? addDays(today, 3) : trial;
}
