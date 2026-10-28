import { CHROMA, categoryById, clock as hhmm, phaseOf, salonHours, serviceById, shortName, STYLISTS, worksOn, type Appt } from '@ilker/shared';

const PX = 1.15;

/** The day per stylist, like the salon's book: every visit as a block in its colour, walk-ins hatched, now as a line. */
export function Agenda({ appts, now, day, onPick }: { appts: Appt[]; now: Date; day: Date; onPick: (id: string) => void }) {
  const hours = salonHours(day) ?? { open: 9, close: 18 };
  const start = hours.open * 60;
  const height = (hours.close * 60 - start) * PX;
  const staff = STYLISTS.filter((s) => worksOn(s, day));
  const today = day.toDateString() === now.toDateString();
  const nowY = (now.getHours() * 60 + now.getMinutes() - start) * PX;
  return (
    <div className="agenda glass panel">
      <div className="agenda-grid" style={{ gridTemplateColumns: `60px repeat(${staff.length}, minmax(150px, 1fr))` }}>
        <div className="agenda-hours" style={{ height: height + 54 }}>
          {Array.from({ length: hours.close - hours.open + 1 }, (_, i) => (
            <span key={i} style={{ top: 54 + i * 60 * PX }}>
              {String(hours.open + i).padStart(2, '0')}:00
            </span>
          ))}
        </div>
        {staff.map((s) => (
          <div key={s.id} className="agenda-col" style={{ height: height + 54 }}>
            <div className="head">
              <i style={{ background: CHROMA[s.chroma].stops[1] }} />
              {s.name}
              <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
                {s.role}
              </span>
            </div>
            {Array.from({ length: hours.close - hours.open }, (_, i) => (
              <div key={i} className="agenda-line" style={{ top: 54 + i * 60 * PX }} />
            ))}
            {appts
              .filter((a) => a.stylist === s.id && (!a.bookedAt || a.bookedAt.getTime() <= now.getTime() || !today))
              .map((a) => {
                const cat = categoryById(serviceById(a.service).category);
                const top = 54 + (a.start.getHours() * 60 + a.start.getMinutes() - start) * PX;
                const h = Math.max(22, a.minutes * PX - 3);
                const phase = today ? phaseOf(a, now) : 'later';
                return (
                  <button
                    key={a.id}
                    className={`appt ${phase === 'done' ? 'done' : ''} ${a.walkIn ? 'walkin' : ''} ${a.member ? 'member' : ''}`}
                    style={{ top, height: h, background: `linear-gradient(135deg, ${CHROMA[cat.chroma].stops[0]}, ${CHROMA[cat.chroma].stops[1]})` }}
                    onClick={() => onPick(a.id)}
                    title={`${a.client.name} · ${serviceById(a.service).name}`}
                  >
                    <b>
                      {a.member ? 'Yara B. · app' : shortName(a.client.name)}
                      {a.firstVisit ? ' · nieuw' : ''}
                    </b>
                    {h > 30 ? (
                      <span>
                        {hhmm(a.start)} · {serviceById(a.service).short}
                      </span>
                    ) : null}
                    {h > 52 && a.consult ? <span style={{ display: 'block', opacity: 0.75 }}>consult-foto's ✓</span> : null}
                  </button>
                );
              })}
          </div>
        ))}
        {today && nowY > 0 && nowY < height ? <div className="now-line" data-time={hhmm(now)} style={{ top: 54 + nowY, left: 60 }} /> : null}
      </div>
    </div>
  );
}
