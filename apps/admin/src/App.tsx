import {
  addDays,
  CHROMA,
  clientById,
  clock as hhmm,
  dayLong,
  euro,
  greeting,
  MEMBER,
  occupancy,
  phaseOf,
  salonDay,
  salonHours,
  serviceById,
  shortName,
  STEP_LABEL,
  stepAt,
  stylistById,
  type Client,
} from '@ilker/shared';
import { useEffect, useMemo, useState } from 'react';

import { useSalonClock } from './clock';
import { Agenda } from './components/Agenda';
import { Floor } from './components/Floor';
import { Clients, ClientDrawer, Sales, Shop, Team } from './components/Panels';
import { eventsToday, feedFor, floorView, ordersOn, revenueUntil, useBridge, useDay } from './data';

/** Where the member app lives on the demo site, next to this panel. */
const APP_URL = '../app/';

const TABS = [
  { id: 'vandaag', label: 'Vandaag' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'klanten', label: 'Klanten' },
  { id: 'team', label: 'Team' },
  { id: 'verkoop', label: 'Verkoop' },
  { id: 'shop', label: 'Shop & voorraad' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const fromHash = (): TabId => (TABS.find((t) => `#${t.id}` === window.location.hash)?.id ?? 'vandaag') as TabId;

function Bars({ values, current, tone }: { values: number[]; current: number; tone: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars" style={{ ['--tone' as string]: tone }}>
      {values.map((v, i) => (
        <i key={i} className={i === current ? 'on' : ''} style={{ height: `${10 + (v / max) * 90}%` }} />
      ))}
    </div>
  );
}

export function App() {
  const clock = useSalonClock();
  const now = clock.now;
  const bridge = useBridge();
  const appts = useDay(now, bridge);
  const [tab, setTab] = useState<TabId>(fromHash);
  const [open, setOpen] = useState<{ appt: string | null; client: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [agendaDay, setAgendaDay] = useState(0);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const events = eventsToday(bridge, now);
  const appEventCount = events.length;
  // A fresh event from the app: say so, so the link between the two is seen.
  const last = bridge.events[bridge.events.length - 1];
  useEffect(() => {
    if (last && Date.now() - Number(last.id.split('-')[1] ?? 0) < 4000) setToast(`Uit de app: ${last.name} · ${last.kind === 'drink' ? 'drankje besteld' : last.kind === 'walkin' ? 'in de inloopwachtrij' : last.kind === 'checkin' ? 'ingecheckt' : last.kind === 'consult' ? "consult-foto's gestuurd" : last.kind === 'booking' ? 'nieuwe afspraak' : last.kind === 'order' ? 'shopbestelling' : last.kind === 'tip' ? 'fooi gegeven' : last.kind === 'review' ? 'review geplaatst' : 'bijgewerkt'}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last?.id]);

  const view = useMemo(() => floorView(appts, now, bridge), [appts, now, bridge]);
  const feed = useMemo(() => feedFor(appts, now, bridge), [appts, now, bridge]);
  const minute = now.getHours() * 60 + now.getMinutes();
  const orders = ordersOn(now);
  const appOrders = events.filter((e) => e.kind === 'order').reduce((s, e) => s + (e.kind === 'order' ? e.total : 0), 0);
  const revenue = revenueUntil(appts, orders, minute) + appOrders;
  const usual = [7, 14, 21, 28].reduce((s, d) => s + revenueUntil(salonDay(addDays(now, -d)), ordersOn(addDays(now, -d)), minute), 0) / 4;
  const delta = usual > 0 ? revenue / usual - 1 : 0;
  const perHour = Array.from({ length: 9 }, (_, i) => appts.filter((a) => a.start.getHours() === 9 + i).length);
  const running = appts.filter((a) => phaseOf(a, now) === 'now').length;
  const drinks = appts.filter((a) => a.drink && a.drink.at.getTime() <= now.getTime()).length + events.filter((e) => e.kind === 'drink').length;
  const walkWait = useMemo(() => {
    const free = view.chairs.filter((c) => c.stylist && !c.appt).length;
    return free ? 'nu' : `± ${Math.max(5, Math.round(Math.min(...view.chairs.filter((c) => c.appt).map((c) => c.appt!.left)) / 60000))} min`;
  }, [view]);

  const openAppt = (id: string) => {
    const a = appts.find((x) => x.id === id);
    if (a) setOpen({ appt: a.id, client: a.client.id });
  };
  const openClient = (clientId: string) => setOpen({ appt: appts.find((a) => a.client.id === clientId)?.id ?? null, client: clientId });
  const drawerClient: Client | undefined = open ? (open.client === MEMBER.id ? MEMBER : clientById(open.client)) : undefined;
  const hours = salonHours(now);
  const waitingList = appts.filter((a) => phaseOf(a, now) === 'waiting');
  const next = appts.filter((a) => phaseOf(a, now) === 'later' && (!a.bookedAt || a.bookedAt.getTime() <= now.getTime())).slice(0, 5);
  const demoLabel = clock.playing ? 'dag afspelen' : clock.reason === 'closed' ? 'demotijd: de salon is nu dicht' : clock.reason === 'set' ? 'ingestelde tijd' : null;

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="name">İlker Tekin</span>
          <span className="sub">Salon · Eindhoven</span>
        </div>
        <div className="clock">
          <span className="time">{hhmm(now)}</span>
          <span className="day">{dayLong(now)}</span>
          <span className={`mode ${clock.demo ? 'demo' : ''}`}>{clock.playing ? 'afspelen' : clock.demo ? 'demo' : 'live'}</span>
          {clock.playing ? (
            <button className="btn sm dye" onClick={clock.stop}>
              ■ Stop
              <span className="play-bar">
                <i style={{ width: `${clock.progress * 100}%` }} />
              </span>
            </button>
          ) : (
            <button className="btn sm dye" onClick={clock.play}>
              ▶ Speel de dag af
            </button>
          )}
        </div>
        <span className="chip-demo">Demo · fictieve klanten</span>
        <a className="btn sm cream" href={APP_URL} target="_blank" rel="noopener">
          Open de app ↗
        </a>
      </header>

      <nav className="tabs" aria-label="Onderdelen">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'on' : ''}`}
            onClick={() => {
              window.location.hash = t.id;
              setTab(t.id);
            }}
          >
            {t.label}
            {t.id === 'vandaag' && appEventCount ? <span className="count">{appEventCount} uit de app</span> : null}
          </button>
        ))}
      </nav>

      {tab === 'vandaag' ? (
        <>
          <section className="hello">
            <div>
              <div className="kicker">{hours ? `Open tot ${hours.close}:00` : 'Vandaag gesloten'}</div>
              <h1>
                {greeting(now)}, <span className="ink">İlker</span>
              </h1>
              <p>De salon live: wie in welke stoel zit, wie wacht en wie er komt. De dag loopt vanzelf; wat klanten in de app doen, zie je hier meteen.</p>
            </div>
          </section>
          <div className="kpis">
            <div className="kpi glass" style={{ ['--tone' as string]: '#FFC24B' }}>
              <span className="kicker">Omzet vandaag</span>
              <b>{euro(Math.round(revenue))}</b>
              <div className="foot">
                <span>
                  <em className={delta >= 0 ? 'up' : 'down'}>
                    {delta >= 0 ? '▲' : '▼'} {Math.round(Math.abs(delta) * 100)}%
                  </em>{' '}
                  t.o.v. een gewone {dayLong(now).split(' ')[0]}
                </span>
              </div>
            </div>
            <div className="kpi glass" style={{ ['--tone' as string]: '#FF5C93' }}>
              <span className="kicker">Afspraken</span>
              <b>{appts.filter((a) => !a.bookedAt || a.bookedAt.getTime() <= now.getTime()).length}</b>
              <div className="foot">
                <span>{running} nu in de stoel</span>
                <Bars values={perHour} current={now.getHours() - 9} tone="#FF5C93" />
              </div>
            </div>
            <div className="kpi glass" style={{ ['--tone' as string]: '#8F6BFF' }}>
              <span className="kicker">Bezetting</span>
              <b>{Math.round(occupancy(appts, now) * 100)}%</b>
              <div className="foot">
                <span>Inloop: {walkWait}</span>
              </div>
            </div>
            <div className="kpi glass" style={{ ['--tone' as string]: '#A9C6FF' }}>
              <span className="kicker">Wachtruimte</span>
              <b>{view.waiting.length}</b>
              <div className="foot">
                <span>{drinks} drankjes geserveerd vandaag</span>
              </div>
            </div>
          </div>
          <div className="grid-floor">
            <Floor view={view} onPick={openAppt} demoLabel={demoLabel} />
            <div className="side">
              <div className="glass panel">
                <div className="panel-head">
                  <div>
                    <div className="kicker">Wacht & volgende</div>
                    <h2>Wie er komt</h2>
                  </div>
                </div>
                <div className="rows">
                  {view.waiting.map((w) => (
                    <button key={w.id} className={`row ${w.member ? 'me' : ''}`} onClick={() => (w.member ? openClient(MEMBER.id) : openAppt(w.id))}>
                      <div className="swatch" style={{ background: w.hair, color: '#fff' }}>
                        {w.name[0]}
                      </div>
                      <div className="grow">
                        <b>{w.name}</b>
                        <small>In de wachtruimte{w.walkIn ? ' · inloop' : ''}</small>
                      </div>
                      {w.app ? <span className="pill app">app</span> : <span className="pill warn">wacht</span>}
                    </button>
                  ))}
                  {next.map((a) => {
                    const late = Math.round((a.begin.getTime() - a.start.getTime()) / 60000);
                    return (
                      <button key={a.id} className={`row ${a.member ? 'me' : ''}`} onClick={() => openAppt(a.id)}>
                        <div className="swatch" style={{ background: CHROMA[stylistById(a.stylist).chroma].stops[1] }}>
                          {hhmm(a.start).slice(0, 2)}
                        </div>
                        <div className="grow">
                          <b>{a.member ? 'Yara B.' : shortName(a.client.name)}</b>
                          <small>
                            {hhmm(a.start)} · {serviceById(a.service).short} · {stylistById(a.stylist).name.split(' ')[0]}
                          </small>
                        </div>
                        {late > 0 ? <span className="pill red">+{late} min</span> : a.source === 'app' ? <span className="pill app">app</span> : null}
                      </button>
                    );
                  })}
                  {!view.waiting.length && !next.length ? <div className="muted">Niemand meer vandaag.</div> : null}
                </div>
              </div>
              <div className="glass panel">
                <div className="panel-head">
                  <div>
                    <div className="kicker">Live</div>
                    <h2>Wat er gebeurt</h2>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {waitingList.length} wachtend
                  </span>
                </div>
                <div className="feed">
                  {feed.map((f) => (
                    <div key={f.id} className={`feed-item ${f.app ? 'app' : ''}`}>
                      <div className="icon" style={{ background: f.tone }}>
                        {f.icon}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <b>{f.title}</b>
                        <small>{f.text}</small>
                        {f.photos?.length ? (
                          <div className="consult-thumbs">
                            {f.photos.map((src, i) => (
                              <img key={i} src={src} alt="" />
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <time>{hhmm(f.at)}</time>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="glass panel" style={{ marginTop: 16 }}>
            <div className="panel-head">
              <div>
                <div className="kicker">In de stoelen</div>
                <h2>Per stoel</h2>
              </div>
            </div>
            <div className="grid-3">
              {view.chairs.map((c) => {
                const a = c.appt ? appts.find((x) => x.id === c.appt!.id) : null;
                const step = a ? stepAt(a, now) : null;
                return (
                  <button key={c.chair} className={`row ${c.appt?.member ? 'me' : ''}`} onClick={() => a && openAppt(a.id)} style={{ opacity: c.stylist ? 1 : 0.5 }}>
                    <div className="swatch" style={{ background: c.stylist?.colour ?? '#5E6796' }}>
                      {c.chair + 1}
                    </div>
                    <div className="grow">
                      <b>{c.stylist ? c.stylist.name : 'Vrij vandaag'}</b>
                      <small>{c.appt ? `${c.appt.name} · ${c.appt.service} · ${step ? STEP_LABEL[step.kind] : ''}` : c.stylist ? 'Stoel vrij' : '—'}</small>
                    </div>
                    {c.appt ? <span className="pill">{Math.ceil(c.appt.left / 60000)} min</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {tab === 'agenda' ? (
        <>
          <section className="hello">
            <div>
              <div className="kicker">Agenda</div>
              <h1>{dayLong(addDays(now, agendaDay))}</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm" onClick={() => setAgendaDay((d) => d - 1)}>
                ← Vorige
              </button>
              <button className="btn sm cream" onClick={() => setAgendaDay(0)}>
                Vandaag
              </button>
              <button className="btn sm" onClick={() => setAgendaDay((d) => d + 1)}>
                Volgende →
              </button>
            </div>
          </section>
          <Agenda appts={agendaDay === 0 ? appts : salonDay(addDays(now, agendaDay))} now={now} day={addDays(now, agendaDay)} onPick={(id) => {
            const list = agendaDay === 0 ? appts : salonDay(addDays(now, agendaDay));
            const a = list.find((x) => x.id === id);
            if (a) setOpen({ appt: agendaDay === 0 ? a.id : null, client: a.client.id });
          }} />
          {!salonHours(addDays(now, agendaDay)) ? <p className="muted">Gesloten op zondag en maandag.</p> : null}
        </>
      ) : null}

      {tab === 'klanten' ? <Clients appts={appts} now={now} onOpen={openClient} /> : null}
      {tab === 'team' ? <Team appts={appts} now={now} events={events} /> : null}
      {tab === 'verkoop' ? <Sales appts={appts} now={now} events={events} /> : null}
      {tab === 'shop' ? <Shop now={now} events={events} toast={setToast} /> : null}

      <footer className="foot">
        Demo met fictieve klanten en een fictief team naast İlker. Menu, prijzen, adres en openingstijden zijn van İlker Tekin Hairstylist & Academy. Er wordt niets echt geboekt of betaald.
      </footer>

      {open && drawerClient ? (
        <ClientDrawer appt={open.appt ? appts.find((a) => a.id === open.appt) ?? null : null} client={drawerClient} now={now} events={events} onClose={() => setOpen(null)} />
      ) : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
