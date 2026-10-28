import { CATEGORIES, CHROMA, euro, PRODUCTS, serviceById, shortName, STEP_LABEL, stockOf, weekdayShort, type Appt, type BridgeEvent } from '@ilker/shared';
import { useEffect, useRef } from 'react';

import { ordersOn, teamToday, weekSales } from '../data';
import { Stage, type Vec } from '../three/stage';
import { SALES_VIEW, SalesScene, SHOP_VIEW, ShopScene, TEAM_VIEW, TeamScene, type Bag, type SalesDay, type ShelfItem, type TeamRow } from '../three/views';

// The team, the week's sales and the shop as rooms in 3D, above the plain overview; a switch turns them off.

export type ViewMode = '3d' | '2d';
const MODE_KEY = 'ilker-admin-view';

export function storedMode(): ViewMode {
  try {
    return localStorage.getItem(MODE_KEY) === '2d' ? '2d' : '3d';
  } catch {
    return '3d';
  }
}

export function keepMode(mode: ViewMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Private windows may refuse; the switch still works for this visit.
  }
}

export function ViewSwitch({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="view-switch" data-mode={mode} role="group" aria-label="Weergave">
      <i className="knob" />
      <button className={mode === '3d' ? 'on' : ''} aria-pressed={mode === '3d'} onClick={() => onChange('3d')}>
        3D
      </button>
      <button className={mode === '2d' ? 'on' : ''} aria-pressed={mode === '2d'} onClick={() => onChange('2d')}>
        2D
      </button>
    </div>
  );
}

type Updatable<T> = { update(data: T): void };
type Legend = { colour: string; label: string }[];

/** One WebGL room: made once when the tab opens, fed new data on every tick, cleaned up when the tab closes. */
function Room<T>({ data, view, make, caption, legend }: { data: T; view: { camera: Vec; target: Vec }; make: (stage: Stage, data: T) => Updatable<T>; caption: string; legend?: Legend }) {
  const host = useRef<HTMLDivElement | null>(null);
  const scene = useRef<Updatable<T> | null>(null);
  const first = useRef(data);
  useEffect(() => {
    if (!host.current) return;
    let stage: Stage;
    try {
      stage = new Stage(host.current, { camera: view.camera, target: view.target, intro: [view.camera[0] + 6, view.camera[1] + 5, view.camera[2] + 8], fov: 30, minDistance: 6, maxDistance: 30, maxPolarAngle: 1.4, fitAspect: 1.7, sway: 0.08 });
    } catch {
      return;
    }
    scene.current = make(stage, first.current);
    return () => {
      scene.current = null;
      stage.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    scene.current?.update(data);
  }, [data]);
  return (
    <div className="floor glass room" ref={host}>
      <div className="floor-head">
        <div className="kicker">{caption}</div>
        {legend ? (
          <div className="floor-legend">
            {legend.map((l) => (
              <span key={l.label}>
                <i style={{ background: l.colour }} /> {l.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const HAIR = ['#1C1416', '#6B3A22', '#D9B27C', '#2A1E18', '#4A2E1C'];

export function TeamRoom({ appts, now, events }: { appts: Appt[]; now: Date; events: BridgeEvent[] }) {
  const rows: TeamRow[] = teamToday(appts, now).map((t) => {
    const appTips = events.reduce((s, e) => s + (e.kind === 'tip' && e.stylist === t.stylist.id ? e.amount : 0), 0);
    const current = t.current;
    return {
      name: t.stylist.name,
      role: t.stylist.role,
      colour: CHROMA[t.stylist.chroma].stops[1],
      hair: HAIR[t.stylist.chair],
      working: t.working,
      load: Math.min(1, t.load),
      revenue: euro(t.revenue),
      tips: euro(t.tips + appTips),
      clients: t.appts.length,
      now: current ? `Nu: ${current.member ? 'Yara B.' : shortName(current.client.name)} · ${t.step ? STEP_LABEL[t.step.kind] : serviceById(current.service).short}` : 'Nu vrij',
      busy: !!current,
    };
  });
  return <Room data={rows} view={TEAM_VIEW} make={(stage, d) => new TeamScene(stage, d)} caption="Het team vandaag · hoe hoger het podium, hoe voller de dag" />;
}

const CATEGORY_LEGEND: Legend = [...CATEGORIES.map((c) => ({ colour: CHROMA[c.chroma].stops[1], label: c.name })), { colour: '#E9DCCB', label: 'Shop' }, { colour: 'rgba(39,65,214,0.25)', label: 'Nog geboekt' }];

export function SalesRoom({ appts, now }: { appts: Appt[]; now: Date }) {
  const days: SalesDay[] = weekSales(now, appts).map((d) => {
    const done = Object.values(d.byCategory).reduce((s, v) => s + v, 0) + d.shop;
    return {
      label: `${weekdayShort(d.date)} ${d.date.getDate()}`,
      today: d.today,
      later: d.later,
      total: euro(Math.round(done + (d.later ? d.booked : 0))),
      segments: CATEGORIES.map((c) => ({ colour: CHROMA[c.chroma].stops[1], value: d.byCategory[c.id] })),
      shop: d.shop,
      booked: d.today || d.later ? d.booked : 0,
    };
  });
  return <Room data={days} view={SALES_VIEW} make={(stage, d) => new SalesScene(stage, d, CATEGORIES.length)} caption="Deze week per dag" legend={CATEGORY_LEGEND} />;
}

export function ShopRoom({ now, events }: { now: Date; events: BridgeEvent[] }) {
  const items: ShelfItem[] = PRODUCTS.map((p) => {
    const s = stockOf(p.id, now);
    return { label: p.line.startsWith('No.') ? `${p.line} ${p.name}` : p.name, bottle: p.bottle, liquid: p.liquid, stock: s.stock, min: s.min };
  });
  const bags: Bag[] = [
    ...ordersOn(now)
      .filter((o) => o.at.getTime() <= now.getTime())
      .map((o) => ({ app: false, ready: o.ready })),
    ...events.filter((e) => e.kind === 'order').map(() => ({ app: true, ready: false })),
  ].slice(-7);
  return (
    <Room
      data={{ items, bags }}
      view={SHOP_VIEW}
      make={(stage, d) => {
        const scene = new ShopScene(stage, d.items, d.bags);
        return { update: (next) => scene.update(next.items, next.bags) };
      }}
      caption="De productwand en de toonbank"
      legend={[
        { colour: '#E0182D', label: 'Bijbestellen' },
        { colour: '#2741D6', label: 'Nieuw uit de app' },
        { colour: '#139E6A', label: 'Klaar om op te halen' },
      ]}
    />
  );
}
