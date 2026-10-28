import {
  CATEGORIES,
  CHROMA,
  clientById,
  CLIENTS,
  clock as hhmm,
  dateShort,
  euro,
  LOOKS,
  MEMBER,
  memberHistory,
  PRODUCTS,
  productById,
  serviceById,
  stockOf,
  stylistById,
  weekdayShort,
  type Appt,
  type BridgeEvent,
  type Client,
  type ShopOrder,
} from '@ilker/shared';
import { useMemo, useState } from 'react';

import { hairOf, historyOf, ordersOn, teamToday, weekSales } from '../data';

const STATE: Record<Client['state'], string> = { natuurlijk: 'Natuurlijk', gekleurd: 'Gekleurd', blond: 'Blond', highlights: 'Highlights' };

/** The client card: hair, the colour formula the salon keeps, history, consult photos and looks from the app. */
export function ClientDrawer({ appt, client, now, events, onClose }: { appt: Appt | null; client: Client; now: Date; events: BridgeEvent[]; onClose: () => void }) {
  const member = client.id === MEMBER.id;
  const history = useMemo(() => (member ? [] : historyOf(client.id, now)), [client.id, member, now.toDateString()]);
  const memberVisits = member ? memberHistory(now) : [];
  const consult = [...events].reverse().find((e) => e.kind === 'consult');
  const looksEvent = [...events].reverse().find((e) => e.kind === 'looks');
  const looks = (member && looksEvent && looksEvent.kind === 'looks' ? looksEvent.looks : client.looks).map((id) => LOOKS.find((l) => l.id === id)).filter(Boolean);
  const formula = appt?.formula ?? (member ? memberVisits.find((v) => v.formula)?.formula : client.formula) ?? null;
  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={client.name}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="kicker">{member ? 'Klantkaart · via de app' : 'Klantkaart'}</div>
            <h2>{client.name}</h2>
            <div className="muted">
              {client.phone} · klant sinds {client.sinceYear}
            </div>
          </div>
          <button className="btn sm" onClick={onClose} aria-label="Sluiten">
            ✕
          </button>
        </div>
        {appt ? (
          <div className="glass panel" style={{ padding: 14 }}>
            <div className="kicker">Vandaag</div>
            <h3>
              {serviceById(appt.service).short} · {hhmm(appt.start)} bij {stylistById(appt.stylist).name}
            </h3>
            <div className="muted">
              Stoel {appt.chair + 1} · {appt.option.label} · {euro(appt.price)} · {appt.source === 'app' ? 'geboekt in de app' : appt.source === 'inloop' ? 'inloop' : appt.source}
            </div>
          </div>
        ) : null}
        <div className="facts">
          <div>
            <span>Lengte</span>
            {client.length}
          </div>
          <div>
            <span>Basis</span>
            niveau {client.level}
          </div>
          <div>
            <span>Haar</span>
            {STATE[client.state]}
          </div>
          <div>
            <span>Textuur</span>
            {client.texture}
          </div>
          <div>
            <span>Grijs</span>
            {client.grey ? `${client.grey}%` : '—'}
          </div>
          <div>
            <span>Kleur</span>
            <i style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: hairOf(client), verticalAlign: 'middle' }} />
          </div>
        </div>
        {formula ? (
          <div className="formula">
            <div className="kicker">Kleurformule</div>
            <div className="mix">{formula.mix}</div>
            <div className="soft">
              {formula.developer} · {formula.minutes} min
            </div>
            {formula.extra ? <div className="muted">{formula.extra}</div> : null}
          </div>
        ) : null}
        {client.allergy ? <div className="pill red">{client.allergy}</div> : null}
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>
            Notitie
          </div>
          <div className="soft">{client.note}</div>
        </div>
        {member && consult && consult.kind === 'consult' ? (
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>
              Consult uit de app
            </div>
            <div className="consult-thumbs">
              {[consult.now, consult.dream].filter(Boolean).map((src, i) => (
                <img key={i} src={src} alt={i ? 'Droomlook' : 'Haar nu'} style={{ width: 120, height: 150 }} />
              ))}
            </div>
            <div className="soft" style={{ marginTop: 8 }}>
              {consult.look ? `Droomlook: ${LOOKS.find((l) => l.id === consult.look)?.name}. ` : ''}
              {consult.history?.join(', ')} {consult.notes ? `“${consult.notes}”` : ''}
            </div>
          </div>
        ) : appt?.consult ? (
          <div className="pill ok">Consult-foto's ontvangen · droomlook {LOOKS.find((l) => l.id === appt.consult!.look)?.name}</div>
        ) : null}
        {looks.length ? (
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>
              Bewaarde looks
            </div>
            <div className="swatches">
              {looks.map((l) => (
                <span key={l!.id}>
                  <i style={{ background: `linear-gradient(160deg, ${l!.colours[2]}, ${l!.colours[1]}, ${l!.colours[0]})` }} />
                  {l!.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <div className="kicker" style={{ marginBottom: 8 }}>
            Geschiedenis
          </div>
          <div className="history">
            {member
              ? memberVisits.map((v) => (
                  <div key={v.id}>
                    <b>{serviceById(v.service).short}</b> · {dateShort(v.date)} · {stylistById(v.stylist).name} · {euro(v.price)}
                    {v.formula ? <div className="mono muted">{v.formula.mix}</div> : null}
                  </div>
                ))
              : history.slice(0, 8).map((a) => (
                  <div key={a.id}>
                    <b>{serviceById(a.service).short}</b> · {dateShort(a.start)} · {stylistById(a.stylist).name} · {euro(a.price)}
                    {a.formula ? <div className="mono muted">{a.formula.mix}</div> : null}
                  </div>
                ))}
            {!member && !history.length ? <div className="muted">Eerste bezoek in deze periode.</div> : null}
          </div>
        </div>
      </aside>
    </>
  );
}

/** Clients with a visit in the last months or today, searchable. */
export function Clients({ appts, now, onOpen }: { appts: Appt[]; now: Date; onOpen: (clientId: string) => void }) {
  const [q, setQ] = useState('');
  const today = new Set(appts.map((a) => a.client.id));
  const list = useMemo(() => [MEMBER as Client, ...CLIENTS.filter((c) => today.has(c.id) || c.sinceYear <= 2025).slice(0, 140)], [appts]);
  const shown = list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="glass panel">
      <div className="panel-head">
        <div>
          <div className="kicker">Klanten · {list.length}</div>
          <h2>Wie er komt</h2>
        </div>
        <span className="muted">Fictieve klanten · namen en nummers verzonnen</span>
      </div>
      <input className="search" placeholder="Zoek een klant…" value={q} onChange={(e) => setQ(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th>Klant</th>
            <th>Haar</th>
            <th>Formule</th>
            <th>Vaste stylist</th>
            <th>Vandaag</th>
          </tr>
        </thead>
        <tbody>
          {shown.slice(0, 60).map((c) => {
            const a = appts.find((x) => x.client.id === c.id);
            return (
              <tr key={c.id} onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <b>{c.name}</b>
                  {c.id === MEMBER.id ? <span className="pill app" style={{ marginLeft: 8 }}>app</span> : null}
                </td>
                <td>
                  <i style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: hairOf(c), marginRight: 8, verticalAlign: 'middle' }} />
                  {STATE[c.state]} · {c.length}
                </td>
                <td className="mono muted" style={{ fontSize: 12 }}>
                  {c.formula?.mix ?? '—'}
                </td>
                <td>{stylistById(c.favourite).name.split(' ')[0]}</td>
                <td>{a ? <span className="pill ok">{hhmm(a.start)}</span> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Team({ appts, now, events }: { appts: Appt[]; now: Date; events: BridgeEvent[] }) {
  const team = teamToday(appts, now);
  const appTips = events.filter((e) => e.kind === 'tip');
  return (
    <div className="grid-3">
      {team.map((t) => {
        const colour = CHROMA[t.stylist.chroma].stops[1];
        const tips = t.tips + appTips.filter((e) => e.kind === 'tip' && e.stylist === t.stylist.id).reduce((s, e) => s + (e.kind === 'tip' ? e.amount : 0), 0);
        return (
          <div key={t.stylist.id} className="glass team-card" style={{ opacity: t.working ? 1 : 0.55 }}>
            <div className="top-line">
              <div className="badge" style={{ background: colour }}>
                {t.stylist.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h3>{t.stylist.name}</h3>
                <div className="muted">{t.stylist.role}</div>
              </div>
              <span className={`pill ${t.working ? 'ok' : ''}`}>{t.working ? (t.current ? 'aan het werk' : 'beschikbaar') : 'vrij vandaag'}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }} className="soft">
                <span>Agenda vandaag</span>
                <span className="mono">{Math.round(t.load * 100)}%</span>
              </div>
              <div className="meter">
                <i style={{ width: `${Math.min(100, t.load * 100)}%`, background: colour }} />
              </div>
            </div>
            <div className="stats">
              <div>
                <span>Klanten</span>
                <b>{t.appts.length}</b>
              </div>
              <div>
                <span>Omzet</span>
                <b>{euro(t.revenue)}</b>
              </div>
              <div>
                <span>Fooi</span>
                <b>{euro(tips)}</b>
              </div>
            </div>
            <div className="soft" style={{ fontSize: 13 }}>
              {t.current ? `Nu: ${t.current.member ? 'Yara B.' : t.current.client.name.split(' ')[0]} · ${serviceById(t.current.service).short}` : t.working ? 'Nu vrij' : 'Werkt ' + t.stylist.days.map((d) => weekdayShort(new Date(2026, 9, 25 + d))).join(', ')}
              {t.working && t.free ? ` · inloop vanaf ${hhmm(t.free)}` : ''}
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              Vandaag in de agenda: {euro(t.booked)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CAT_COLOUR = (id: string) => CHROMA[CATEGORIES.find((c) => c.id === id)!.chroma].stops[1];

export function Sales({ appts, now, events }: { appts: Appt[]; now: Date; events: BridgeEvent[] }) {
  const week = weekSales(now, appts);
  const totals = week.map((d) => Object.values(d.byCategory).reduce((s, v) => s + v, 0) + d.shop);
  const max = Math.max(...week.map((d, i) => totals[i] + d.booked), 1);
  const done = appts.filter((a) => a.end.getTime() <= now.getTime());
  const pay = { pin: 0, app: 0, contant: 0 };
  for (const a of done) pay[a.pay] += a.price;
  const appPaid = events.filter((e) => e.kind === 'pay').reduce((s, e) => s + (e.kind === 'pay' ? e.amount : 0), 0);
  pay.app += appPaid;
  const payTotal = pay.pin + pay.app + pay.contant || 1;
  const services = new Map<string, { n: number; sum: number }>();
  for (const a of appts) {
    const k = serviceById(a.service).short;
    const v = services.get(k) ?? { n: 0, sum: 0 };
    services.set(k, { n: v.n + 1, sum: v.sum + a.price });
  }
  const top = [...services.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 7);
  const weekTotal = totals.reduce((s, v) => s + v, 0);
  return (
    <div className="grid-2">
      <div className="glass panel">
        <div className="panel-head">
          <div>
            <div className="kicker">Deze week · tot nu</div>
            <h2>{euro(weekTotal)}</h2>
          </div>
          <div className="legend">
            {CATEGORIES.map((c) => (
              <span key={c.id}>
                <i style={{ background: CAT_COLOUR(c.id) }} />
                {c.name}
              </span>
            ))}
            <span>
              <i style={{ background: '#F6EEE6' }} />
              Shop
            </span>
          </div>
        </div>
        <div className="week">
          {week.map((d, i) => (
            <div key={i} className={`day ${d.today ? 'today' : ''} ${d.later ? 'later' : ''}`}>
              <span className="total">{euro(totals[i] + (d.later ? d.booked : 0))}</span>
              <i style={{ height: `${(d.booked / max) * 85}%`, background: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.25) 0 5px, transparent 5px 10px)' }} />
              <i style={{ height: `${(d.shop / max) * 85}%`, background: '#F6EEE6' }} />
              {CATEGORIES.map((c) => (
                <i key={c.id} style={{ height: `${(d.byCategory[c.id] / max) * 85}%`, background: CAT_COLOUR(c.id) }} />
              ))}
              <span className="label">{weekdayShort(d.date)}</span>
            </div>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          Gestreept: al geboekt voor later vandaag en de rest van de week.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="glass panel">
          <div className="kicker" style={{ marginBottom: 10 }}>
            Betaalwijze vandaag
          </div>
          {(['pin', 'app', 'contant'] as const).map((k) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{k === 'app' ? 'In de app' : k === 'pin' ? 'Pin' : 'Contant'}</span>
                <span className="mono">{euro(pay[k])}</span>
              </div>
              <div className="meter">
                <i style={{ width: `${(pay[k] / payTotal) * 100}%`, background: k === 'app' ? '#FF5C93' : k === 'pin' ? '#A9C6FF' : '#FFC24B' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="glass panel">
          <div className="kicker" style={{ marginBottom: 6 }}>
            Vandaag in de agenda
          </div>
          <table>
            <tbody>
              {top.map(([name, v]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="num">{v.n}×</td>
                  <td className="num">{euro(v.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Shop({ now, events, toast }: { now: Date; events: BridgeEvent[]; toast: (text: string) => void }) {
  const [ready, setReady] = useState<Set<string>>(new Set());
  const orders: (ShopOrder & { app?: boolean })[] = [
    ...ordersOn(now).filter((o) => o.at.getTime() <= now.getTime()),
    ...events
      .filter((e) => e.kind === 'order')
      .map((e) => ({ id: e.kind === 'order' ? e.number : e.id, at: new Date(e.at), name: 'Yara B.', lines: [], total: e.kind === 'order' ? e.total : 0, ready: false, app: true })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <div className="grid-2">
      <div className="glass panel">
        <div className="panel-head">
          <div>
            <div className="kicker">Voorraad · demowaarden</div>
            <h2>De productwand</h2>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Op voorraad</th>
              <th style={{ textAlign: 'right' }}>Prijs</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const s = stockOf(p.id, now);
              const low = s.stock <= s.min;
              return (
                <tr key={p.id}>
                  <td>
                    <b>
                      {p.line} {p.name}
                    </b>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {p.brand} · {p.size}
                    </div>
                  </td>
                  <td style={{ width: 170 }}>
                    <div className="meter">
                      <i style={{ width: `${Math.min(100, (s.stock / 14) * 100)}%`, background: low ? '#F2243C' : '#5BE3A6' }} />
                    </div>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {s.stock} stuks · min {s.min}
                    </span>
                  </td>
                  <td className="num">{euro(p.price)}</td>
                  <td>
                    {low ? (
                      <button className="btn sm" onClick={() => toast(`${p.line} ${p.name}: 12 besteld bij de leverancier (demo)`)}>
                        Bestellen
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="glass panel">
        <div className="panel-head">
          <div>
            <div className="kicker">Ophalen in de salon · vandaag</div>
            <h2>{orders.length} bestellingen</h2>
          </div>
        </div>
        <div className="rows">
          {orders.map((o) => {
            const isReady = o.ready || ready.has(o.id);
            return (
              <div key={o.id} className={`row ${o.app ? 'me' : ''}`} style={{ cursor: 'default' }}>
                <div className="swatch" style={{ background: o.app ? '#FF5C93' : '#FFC24B' }}>
                  ▣
                </div>
                <div className="grow">
                  <b>
                    {o.id} · {o.name}
                  </b>
                  <small>
                    {hhmm(o.at)} · {o.lines.length ? o.lines.map((l) => `${l.qty}× ${productById(l.id)?.line ?? ''} ${productById(l.id)?.name ?? ''}`).join(', ') : 'via de app'} · {euro(o.total)}
                  </small>
                </div>
                {isReady ? (
                  <span className="pill ok">klaar</span>
                ) : (
                  <button className="btn sm" onClick={() => setReady((s) => new Set([...s, o.id]))}>
                    Klaarzetten
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          Bestellingen uit de app komen hier binnen; de klant krijgt een seintje zodra je ze klaarzet.
        </div>
      </div>
    </div>
  );
}

export { clientById };
