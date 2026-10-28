import { trHtml } from '@ilker/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { lookFor, Person, peopleKit } from './people';
import { damp, el, type Stage, type Vec } from './stage';

// The panel's other rooms in 3D, in the same light, soft style as the salon floor: the team on podiums, the week's
// sales as columns, and the product wall with the pick-up counter.

const mat = (color: string, roughness = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function box(w: number, h: number, d: number, material: THREE.Material, r = 0.05) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Takes everything out of a group and frees its geometry and materials; labels remove their own HTML. */
function empty(group: THREE.Group) {
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
  });
  group.clear();
}

/** A light studio: a soft floor plate, daylight from the front and a cool fill from behind. */
function studio(stage: Stage, width: number, depth: number): THREE.Group {
  const root = new THREE.Group();
  const plate = box(width, 0.16, depth, mat('#FFFFFF', 0.9), 0.06);
  plate.position.y = -0.08;
  const floor = box(width - 0.4, 0.04, depth - 0.4, mat('#EEF1F8', 0.95), 0.03);
  floor.position.y = 0.01;
  root.add(plate, floor);
  const hemi = new THREE.HemisphereLight('#FFFFFF', '#C9D2EE', 1.3);
  const key = new THREE.DirectionalLight('#FFF4E8', 1.5);
  key.position.set(4, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -width / 2 - 1;
  key.shadow.camera.right = width / 2 + 1;
  key.shadow.camera.top = depth;
  key.shadow.camera.bottom = -depth;
  key.shadow.bias = -0.0004;
  const fill = new THREE.DirectionalLight('#C9D4FF', 0.5);
  fill.position.set(-5, 5, -6);
  root.add(hemi, key, fill);
  stage.scene.add(root);
  return root;
}

// ----------------------------------------------------------------------------------------------------- team

export type TeamRow = {
  name: string;
  role: string;
  colour: string;
  hair: string;
  working: boolean;
  /** Share of today's open hours booked, 0 to 1. */
  load: number;
  revenue: string;
  tips: string;
  clients: number;
  now: string;
  busy: boolean;
};

export const TEAM_VIEW = { camera: [0, 4.3, 14.2] as Vec, target: [0, 2.2, 0] as Vec };

/** Every stylist on a podium as tall as their day is full, with today's numbers above their head. */
export class TeamScene {
  private readonly root: THREE.Group;
  private readonly kit = peopleKit();
  private readonly slots: { podium: THREE.Mesh; top: THREE.MeshStandardMaterial; person: Person; tag: HTMLDivElement; label: THREE.Object3D; html: string; height: number; target: number; fade: number; on: number; busy: boolean }[] = [];

  constructor(stage: Stage, rows: TeamRow[]) {
    this.root = studio(stage, rows.length * 3 + 1, 5);
    rows.forEach((row, i) => {
      const x = (i - (rows.length - 1) / 2) * 3;
      const top = mat(row.colour, 0.45);
      const podium = new THREE.Mesh(new RoundedBoxGeometry(1.45, 1, 1.45, 3, 0.08), [mat('#FFFFFF', 0.6), mat('#FFFFFF', 0.6), top, mat('#FFFFFF', 0.6), mat('#FFFFFF', 0.6), mat('#FFFFFF', 0.6)]);
      podium.castShadow = podium.receiveShadow = true;
      podium.position.set(x, 0.1, 0);
      const person = new Person(this.kit, { ...lookFor(row.name, row.hair), hair: row.hair, style: i === 3 ? 'short' : 'bun', top: '#111426', bottom: '#111426' }, '#111426');
      person.group.position.set(x, 0.2, 0);
      person.group.scale.setScalar(1.15);
      this.root.add(podium, person.group);
      const tag = el('team-tag');
      const label = stage.label(tag, this.root, [x, 2.4, 0]);
      // Anchored by its bottom edge, so the card sits above the head instead of over it.
      label.center.set(0.5, 1);
      this.slots.push({ podium, top, person, tag, label, html: '', height: 0.2, target: 0.2, fade: 1, on: 1, busy: false });
    });
    this.update(rows);
    stage.onFrame((time, delta) => this.frame(time, delta));
  }

  update(rows: TeamRow[]) {
    rows.forEach((row, i) => {
      const s = this.slots[i];
      if (!s) return;
      s.target = row.working ? 0.2 + row.load * 1.15 : 0.12;
      s.on = row.working ? 1 : 0.28;
      s.busy = row.busy;
      s.top.color.set(row.colour);
      const html = `<b>${row.name}</b><span>${row.role}</span><div class="team-nums"><em>${Math.round(row.load * 100)}%</em><em>${row.revenue}</em><em>${row.clients} klanten</em></div><small>${row.working ? row.now : 'Vrij vandaag'}</small>${row.working ? `<small class="tip">Fooi ${row.tips}</small>` : ''}`;
      if (html !== s.html) {
        s.html = html;
        s.tag.innerHTML = trHtml(html);
        s.tag.dataset.on = row.working ? '1' : '0';
      }
    });
  }

  private frame(time: number, delta: number) {
    for (const s of this.slots) {
      s.height = damp(s.height, s.target, 3, delta);
      s.podium.scale.y = s.height;
      s.podium.position.y = s.height / 2 - 0.02;
      s.person.group.position.y = s.height - 0.02;
      s.fade = damp(s.fade, s.on, 4, delta);
      s.person.opacity = s.fade;
      s.person.work(s.busy ? 0.55 : 0, time);
      // The card rides above the head as the podium grows.
      s.label.position.y = s.height + 2.2;
    }
  }
}

// ----------------------------------------------------------------------------------------------------- sales

export type SalesDay = { label: string; today: boolean; later: boolean; total: string; segments: { colour: string; value: number }[]; shop: number; booked: number };

export const SALES_VIEW = { camera: [0, 6.2, 14.5] as Vec, target: [0, 2.0, 0] as Vec };
const COL = 1.25;

/** The week as columns, Monday to Saturday: what each kind of treatment brought in, the shop on top, and what is still booked as a light outline. */
export class SalesScene {
  private readonly root: THREE.Group;
  private readonly columns: { group: THREE.Group; parts: THREE.Mesh[]; shop: THREE.Mesh; booked: THREE.Mesh; tag: HTMLDivElement; html: string; target: number[]; current: number[] }[] = [];
  private readonly marker: THREE.Mesh;

  constructor(stage: Stage, days: SalesDay[], categories: number) {
    this.root = studio(stage, days.length * 2.1 + 1.2, 4.2);
    this.marker = box(COL + 0.5, 0.03, COL + 0.5, mat('#2741D6', 0.4, { emissive: new THREE.Color('#3B57F0'), emissiveIntensity: 0.6 }), 0.02);
    this.marker.position.y = 0.04;
    this.root.add(this.marker);
    days.forEach((_, i) => {
      const x = (i - (days.length - 1) / 2) * 2.1;
      const group = new THREE.Group();
      group.position.x = x;
      const parts = Array.from({ length: categories }, () => {
        const m = box(COL, 1, COL, mat('#FFFFFF', 0.5), 0.04);
        group.add(m);
        return m;
      });
      const shop = box(COL, 1, COL, mat('#E9DCCB', 0.55), 0.04);
      const booked = new THREE.Mesh(new RoundedBoxGeometry(COL, 1, COL, 2, 0.04), mat('#2741D6', 0.4, { transparent: true, opacity: 0.14, depthWrite: false }));
      // A thin outline, so what is still booked reads as planned rather than done.
      booked.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(COL, 1, COL)), new THREE.LineBasicMaterial({ color: '#2741D6', transparent: true, opacity: 0.45 })));
      group.add(shop, booked);
      this.root.add(group);
      const tag = el('sales-tag');
      // Every other label can step down on narrow screens, where the columns stand close together.
      tag.dataset.i = String(i % 2);
      stage.label(tag, group, [0, 0, 1.1]);
      this.columns.push({ group, parts, shop, booked, tag, html: '', target: new Array(categories + 2).fill(0), current: new Array(categories + 2).fill(0) });
    });
    this.update(days);
    stage.onFrame((_t, delta) => this.frame(delta));
  }

  update(days: SalesDay[]) {
    const max = Math.max(1, ...days.map((d) => d.segments.reduce((s, x) => s + x.value, 0) + d.shop + d.booked));
    days.forEach((d, i) => {
      const c = this.columns[i];
      if (!c) return;
      d.segments.forEach((seg, k) => {
        (c.parts[k].material as THREE.MeshStandardMaterial).color.set(seg.colour);
        c.target[k] = (seg.value / max) * 4.6;
      });
      c.target[d.segments.length] = (d.shop / max) * 4.6;
      c.target[d.segments.length + 1] = (d.booked / max) * 4.6;
      if (d.today) this.marker.position.x = c.group.position.x;
      const html = `<b>${d.total}</b><span class="${d.today ? 'today' : ''}">${d.label}</span>`;
      if (html !== c.html) {
        c.html = html;
        c.tag.innerHTML = trHtml(html);
      }
    });
  }

  private frame(delta: number) {
    for (const c of this.columns) {
      let y = 0.03;
      const stack = [...c.parts, c.shop, c.booked];
      stack.forEach((mesh, k) => {
        c.current[k] = damp(c.current[k], c.target[k], 4, delta);
        const h = Math.max(0.001, c.current[k]);
        mesh.scale.y = h;
        mesh.position.y = y + h / 2;
        mesh.visible = c.current[k] > 0.01;
        y += h;
      });
    }
  }
}

// ----------------------------------------------------------------------------------------------------- shop

export type ShelfItem = { label: string; bottle: string; liquid: string; stock: number; min: number };
export type Bag = { app: boolean; ready: boolean };

export const SHOP_VIEW = { camera: [0, 3.5, 12.6] as Vec, target: [0, 1.7, 0.4] as Vec };

/** The product wall: as many bottles on the shelf as there are in stock, a red light where it runs low; bags for pick-up on the counter. */
export class ShopScene {
  private readonly root: THREE.Group;
  private readonly bottles: THREE.Group;
  private readonly bags: THREE.Group;
  private key = '';

  constructor(private readonly stage: Stage, items: ShelfItem[], bags: Bag[]) {
    this.root = studio(stage, 11, 5.8);
    const wall = box(10.4, 4.6, 0.2, mat('#F6F3EE', 0.9), 0.04);
    wall.position.set(0, 2.3, -1.6);
    this.root.add(wall);
    for (let row = 0; row < 4; row++) {
      const plank = box(9.8, 0.08, 0.7, mat('#E9E1D6', 0.45), 0.02);
      plank.position.set(0, 0.7 + row * 1.0, -1.15);
      this.root.add(plank);
    }
    // A low pick-up counter up front, kept under the line of sight to the bottom shelf.
    const counter = box(5.4, 0.7, 0.8, mat('#2741D6', 0.45), 0.06);
    counter.position.set(0, 0.35, 2.3);
    const top = box(5.6, 0.06, 0.9, mat('#F2ECE4', 0.25), 0.03);
    top.position.set(0, 0.73, 2.3);
    this.root.add(counter, top);
    this.bottles = new THREE.Group();
    this.bags = new THREE.Group();
    this.root.add(this.bottles, this.bags);
    this.update(items, bags);
  }

  update(items: ShelfItem[], bags: Bag[]) {
    // Rebuilt only when stock or orders change; removing a label object also takes its HTML away.
    const key = JSON.stringify([items.map((i) => i.stock), bags]);
    if (key === this.key) return;
    this.key = key;
    empty(this.bottles);
    empty(this.bags);
    items.forEach((item, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x0 = -4.5 + col * 2.4;
      const y = 0.74 + row * 1.0;
      const shown = Math.min(8, item.stock);
      for (let b = 0; b < shown; b++) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.42, 18), mat(item.bottle, 0.35));
        body.position.y = 0.21;
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.097, 0.102, 0.22, 18), mat(item.liquid, 0.3));
        liquid.position.y = 0.12;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), mat('#1B1B1B', 0.4));
        cap.position.y = 0.47;
        body.castShadow = liquid.castShadow = cap.castShadow = true;
        g.add(body, liquid, cap);
        g.position.set(x0 + b * 0.24, y, -1.15 + (b % 2) * 0.12);
        this.bottles.add(g);
      }
      const low = item.stock <= item.min;
      const tag = el(`shelf-tag ${low ? 'low' : ''}`, trHtml(`<b>${item.label}</b><span>${item.stock} op voorraad${low ? ' · bijbestellen' : ''}</span>`));
      this.stage.label(tag, this.bottles, [x0 + 0.9, y - 0.12, -0.75]);
    });
    bags.forEach((bag, i) => {
      const b = box(0.5, 0.5, 0.28, mat(bag.app ? '#2741D6' : '#E9DCCB', 0.6), 0.04);
      b.position.set(-2.1 + i * 0.7, 1.01, 2.3);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI), mat('#0E1630', 0.5));
      handle.position.set(b.position.x, 1.26, 2.3);
      this.bags.add(b, handle);
      if (bag.ready) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), mat('#139E6A', 0.4, { emissive: new THREE.Color('#139E6A'), emissiveIntensity: 0.6 }));
        tick.position.set(b.position.x, 1.01, 2.45);
        this.bags.add(tick);
      }
    });
  }
}
