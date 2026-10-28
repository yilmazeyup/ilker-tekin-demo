import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { lookFor, Person, peopleKit, type PeopleKit } from './people';
import { damp, el, type Stage, type Vec } from './stage';

/** One styling chair as the floor shows it right now. */
export type ChairView = {
  chair: number;
  stylist: { name: string; colour: string } | null;
  appt: {
    id: string;
    name: string;
    hair: string;
    man: boolean;
    service: string;
    step: string;
    kind: string;
    atBasin: number;
    progress: number;
    stepLeft: number;
    left: number;
    member: boolean;
    late: number;
    drink: boolean;
  } | null;
  /** The stylist is at the colour bar (mixing, or while a colour takes). */
  mixing: boolean;
};

export type FloorView = {
  chairs: ChairView[];
  waiting: { id: string; name: string; hair: string; man: boolean; member: boolean; walkIn: boolean; app: boolean }[];
  paying: { id: string; name: string; hair: string; man: boolean }[];
  washing: boolean;
};

/** Where the camera looks from for the whole floor. */
export const OVERVIEW = { camera: [5.2, 10.8, 13.8] as Vec, target: [0.35, 0.2, -0.3] as Vec };

const STATION_X = [-4.9, -2.75, -0.6, 1.55, 3.7];
const STATION_Z = -3.05;
const BASINS = [
  [-5.95, -0.55],
  [-5.95, 0.95],
] as const;
const BAR = new THREE.Vector3(0.2, 0, -0.35);
const SOFA = [
  [3.1, 2.75],
  [3.75, 2.75],
  [4.4, 2.75],
  [5.05, 2.75],
  [5.55, 2.1],
  [5.55, 1.45],
] as const;
const DESK = new THREE.Vector3(-3.9, 0, 2.45);

const mat = (color: string, roughness = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function box(w: number, h: number, d: number, material: THREE.Material, r = 0.04) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cylinder(radius: number, height: number, material: THREE.Material, top = radius, segments = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, segments), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Terrazzo for the floor: midnight blue with flecks of brass, rose and white, drawn once. */
function terrazzo(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ECEFF6';
  ctx.fillRect(0, 0, 512, 512);
  const colours = ['#C9A46A', '#9AA8D8', '#FFFFFF', '#B9A7F0', '#5A6FC6', '#F2B8C9'];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = colours[Math.floor(rand() * colours.length)];
    ctx.globalAlpha = 0.3 + rand() * 0.45;
    const s = 1 + rand() * 4;
    ctx.beginPath();
    ctx.ellipse(rand() * 512, rand() * 512, s, s * (0.5 + rand() * 0.6), rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 3.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The salon's name in neon on the back wall, drawn with the web font once it is ready. */
function neonSign(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 300;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic 500 170px "Bodoni Moda", Didot, serif';
    ctx.shadowColor = 'rgba(39,65,214,0.45)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#2741D6';
    ctx.fillText('İlker Tekin', 700, 130);
    ctx.shadowBlur = 0;
    ctx.font = '500 40px "DM Mono", monospace';
    ctx.fillStyle = '#0E1630';
    ctx.fillText('H A I R S T Y L I S T   &   A C A D E M Y', 700, 258);
    texture.needsUpdate = true;
  };
  draw();
  Promise.all([document.fonts.load('italic 500 170px "Bodoni Moda"'), document.fonts.load('40px "DM Mono"')])
    .then(draw)
    .catch(() => {});
  return new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.98), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
}

type Station = {
  chair: number;
  stylist: Person;
  client: Person;
  cup: THREE.Mesh;
  light: THREE.MeshStandardMaterial;
  tag: HTMLDivElement;
  html: string;
  clientAt: THREE.Vector3;
  stylistAt: THREE.Vector3;
  pose: 'chair' | 'basin' | 'none';
  clientId: string | null;
  fade: number;
  staff: number;
};

type Seat = { person: Person; id: string | null; fade: number; tag: HTMLDivElement; html: string };

const ring = (value: number, colour: string) => {
  const r = 13;
  const c = 2 * Math.PI * r;
  return `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="${r}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="4"/><circle cx="17" cy="17" r="${r}" fill="none" stroke="${colour}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, value)))}" transform="rotate(-90 17 17)"/></svg>`;
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * İlker Tekin's salon as a model on the table: five styling chairs with mirrors along the back wall, two wash basins,
 * the colour bar in the middle, the reception desk with the product wall by the door, and the waiting sofa. Clients
 * move between chair, basin, sofa and desk as their visit goes; each chair carries a live card.
 */
export class SalonScene {
  private readonly root = new THREE.Group();
  private readonly kit: PeopleKit = peopleKit();
  private readonly stations: Station[] = [];
  private readonly seats: Seat[] = [];
  private readonly payers: Seat[] = [];
  private readonly kim: Person;
  private readonly waitTag: HTMLDivElement;
  private readonly waitHtml = { value: '' };
  private view: FloorView | null = null;

  constructor(
    private readonly stage: Stage,
    private readonly select: (apptId: string | null) => void,
  ) {
    stage.scene.add(this.root);
    this.buildRoom();
    this.buildStations();
    this.buildBasinsAndBar();
    this.buildFront();
    this.kim = new Person(this.kit, { skin: '#D9A988', hair: '#1C1416', style: 'bun', top: '#111426', bottom: '#111426' }, '#8F6BFF');
    this.kim.group.position.set(BAR.x - 1.3, 0, BAR.z + 0.7);
    this.root.add(this.kim.group);
    this.waitTag = el('area-tag wait-tag');
    this.stage.label(this.waitTag, this.root, [4.3, 2.05, 2.75]);
    const targets = [...this.stations.flatMap((s) => [s.client.group]), ...this.seats.map((s) => s.person.group)];
    stage.setHoverTargets(targets, () => {});
    stage.onSelect(
      (object) => {
        const station = this.stations.find((s) => s.client.group === object);
        const seat = this.seats.find((s) => s.person.group === object);
        this.select(station?.clientId ?? seat?.id ?? null);
      },
      (object) => this.stations.some((s) => s.client.group === object && s.clientId) || this.seats.some((s) => s.person.group === object && s.id),
    );
    stage.onFrame((time, delta) => this.frame(time, delta));
  }

  private buildRoom() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 9.4), mat('#FFFFFF', 0.35, { map: terrazzo(), metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.root.add(floor);
    const wallMat = mat('#F6F3EE', 0.9);
    const back = box(13.4, 3.2, 0.2, wallMat, 0.02);
    back.position.set(0, 1.6, -4.6);
    const left = box(0.2, 3.2, 9.4, wallMat, 0.02);
    left.position.set(-6.7, 1.6, 0);
    const right = box(0.2, 3.2, 9.4, mat('#EEF1F8', 0.9), 0.02);
    right.position.set(6.7, 1.6, 0);
    this.root.add(back, left, right);
    // Low front wall with the door gap, so the camera looks straight in.
    const frontMat = mat('#DCE2F2', 0.7);
    const frontL = box(4.6, 0.5, 0.18, frontMat, 0.02);
    frontL.position.set(-4.4, 0.25, 4.6);
    const frontR = box(7.0, 0.5, 0.18, frontMat, 0.02);
    frontR.position.set(3.2, 0.25, 4.6);
    this.root.add(frontL, frontR);
    const sign = neonSign();
    sign.position.set(-0.6, 2.75, -4.48);
    this.root.add(sign);
    const strip = box(13.2, 0.04, 0.04, mat('#2741D6', 0.3, { emissive: new THREE.Color('#3B57F0'), emissiveIntensity: 0.8 }), 0.01);
    strip.position.set(0, 0.04, -4.48);
    this.root.add(strip);

    const hemi = new THREE.HemisphereLight('#FFFFFF', '#C9D2EE', 1.25);
    const key = new THREE.DirectionalLight('#FFF2E2', 1.6);
    key.position.set(4, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.0004;
    const rim = new THREE.DirectionalLight('#C9D4FF', 0.5);
    rim.position.set(-6, 5, -6);
    this.root.add(hemi, key, rim);
  }

  private buildStations() {
    const brass = mat('#C9A46A', 0.32, { metalness: 0.85 });
    const mirror = mat('#C8D4FF', 0.04, { metalness: 1, envMapIntensity: 1.2 });
    const leather = mat('#1B2550', 0.42);
    const chrome = mat('#D9DEE8', 0.18, { metalness: 0.9 });
    const shelf = mat('#E9E1D6', 0.4);
    const bottles = ['#FF6A2C', '#8F6BFF', '#F4F1EC', '#FFC24B', '#FF5C93', '#A9C6FF'];
    STATION_X.forEach((x, chair) => {
      const g = new THREE.Group();
      const frame = box(1.08, 1.82, 0.06, brass, 0.03);
      frame.position.set(x, 1.62, -4.47);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.72), mirror);
      glass.position.set(x, 1.62, -4.435);
      const console = box(1.25, 0.07, 0.42, shelf, 0.02);
      console.position.set(x, 0.92, -4.24);
      g.add(frame, glass, console);
      for (let b = 0; b < 3; b++) {
        const bottle = cylinder(0.035, 0.18, mat(bottles[(chair + b) % bottles.length], 0.35));
        bottle.position.set(x - 0.42 + b * 0.09, 1.05, -4.26);
        g.add(bottle);
      }
      const cup = cylinder(0.045, 0.09, mat('#F6EEE6', 0.3), 0.055);
      cup.position.set(x + 0.4, 1.0, -4.18);
      cup.visible = false;
      g.add(cup);
      // The chair, facing the mirror.
      const base = cylinder(0.26, 0.04, chrome);
      base.position.set(x, 0.02, STATION_Z);
      const post = cylinder(0.05, 0.36, chrome);
      post.position.set(x, 0.22, STATION_Z);
      const seat = box(0.56, 0.12, 0.52, leather, 0.06);
      seat.position.set(x, 0.46, STATION_Z);
      const backrest = box(0.54, 0.62, 0.1, leather, 0.05);
      backrest.position.set(x, 0.82, STATION_Z + 0.27);
      const arm1 = box(0.08, 0.08, 0.46, chrome, 0.03);
      arm1.position.set(x - 0.3, 0.64, STATION_Z);
      const arm2 = arm1.clone();
      arm2.position.x = x + 0.3;
      g.add(base, post, seat, backrest, arm1, arm2);
      // A warm pendant over each chair.
      const light = mat('#FFE2B8', 0.4, { emissive: new THREE.Color('#FFD8A0'), emissiveIntensity: 1.4 });
      const cord = cylinder(0.006, 0.7, mat('#111111', 0.5));
      cord.position.set(x, 2.85, STATION_Z - 0.3);
      const shade = cylinder(0.16, 0.2, light, 0.04);
      shade.position.set(x, 2.42, STATION_Z - 0.3);
      g.add(cord, shade);
      this.root.add(g);

      const stylist = new Person(this.kit, { skin: ['#D9A988', '#EBC7AE', '#BC8762', '#F3DCCB', '#8E6044'][chair], hair: ['#1C1416', '#6B3A22', '#D9B27C', '#2A1E18', '#4A2E1C'][chair], style: chair === 3 ? 'short' : 'bun', top: '#111426', bottom: '#111426' }, '#111426');
      stylist.group.position.set(x + 0.55, 0, STATION_Z + 0.35);
      stylist.group.rotation.y = Math.PI * 0.85;
      const client = new Person(this.kit, lookFor(`chair-${chair}`, '#3E2A22'));
      client.group.position.set(x, 0, STATION_Z);
      client.group.rotation.y = Math.PI;
      client.sit(0.46);
      client.opacity = 0;
      this.root.add(stylist.group, client.group);

      const tag = el('chair-tag');
      tag.tabIndex = 0;
      // Alternate heights, so neighbouring cards do not cover each other.
      this.stage.label(tag, this.root, [x, chair % 2 ? 2.85 : 2.2, STATION_Z + 0.2]);
      const station: Station = {
        chair,
        stylist,
        client,
        cup,
        light,
        tag,
        html: '',
        clientAt: new THREE.Vector3(x, 0, STATION_Z),
        stylistAt: new THREE.Vector3(x + 0.55, 0, STATION_Z + 0.35),
        pose: 'none',
        clientId: null,
        fade: 0,
        staff: 1,
      };
      tag.addEventListener('click', () => station.clientId && this.select(station.clientId));
      this.stations.push(station);
    });
  }

  private buildBasinsAndBar() {
    const black = mat('#1B2550', 0.3, { metalness: 0.2 });
    const leather = mat('#1B2550', 0.42);
    const marble = mat('#F2ECE4', 0.25);
    const brass = mat('#C9A46A', 0.3, { metalness: 0.85 });
    for (const [x, z] of BASINS) {
      const unit = box(0.7, 0.9, 0.8, black, 0.06);
      unit.position.set(x - 0.35, 0.45, z);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#F4F4F4', 0.2));
      bowl.position.set(x - 0.35, 0.95, z);
      bowl.scale.set(1, 0.55, 1);
      const seat = box(0.6, 0.12, 0.6, leather, 0.06);
      seat.position.set(x + 0.45, 0.48, z);
      const back = box(0.12, 0.7, 0.58, leather, 0.05);
      back.position.set(x + 0.1, 0.8, z);
      back.rotation.z = -0.7;
      this.root.add(unit, bowl, seat, back);
    }
    this.areaLabel('Wasbakken', [-5.6, 1.9, 0.2]);
    // The colour bar: a marble island with bowls, brushes and tubes.
    const island = box(3.0, 0.92, 0.82, mat('#2741D6', 0.45), 0.05);
    island.position.set(BAR.x, 0.46, BAR.z);
    const top = box(3.12, 0.06, 0.92, marble, 0.03);
    top.position.set(BAR.x, 0.95, BAR.z);
    const rail = box(3.0, 0.03, 0.03, brass, 0.01);
    rail.position.set(BAR.x, 0.7, BAR.z + 0.43);
    this.root.add(island, top, rail);
    const tubes = ['#8A0A1E', '#B83A12', '#C98316', '#4A2E1C', '#4A23C9', '#5A7FE6', '#F2243C', '#FFC24B'];
    tubes.forEach((c, i) => {
      const tube = cylinder(0.03, 0.2, mat(c, 0.35));
      tube.position.set(BAR.x - 1.3 + i * 0.13, 1.08, BAR.z - 0.25);
      this.root.add(tube);
    });
    for (let i = 0; i < 4; i++) {
      const bowl = cylinder(0.11, 0.07, mat(['#0B0D18', '#F6EEE6', '#0B0D18', '#F6EEE6'][i], 0.4), 0.13);
      bowl.position.set(BAR.x - 0.2 + i * 0.36, 1.02, BAR.z + 0.12);
      const dye = cylinder(0.1, 0.01, mat(['#B83A12', '#E8C996', '#4A2E1C', '#C98316'][i], 0.6), 0.1);
      dye.position.set(bowl.position.x, 1.06, bowl.position.z);
      this.root.add(bowl, dye);
    }
    this.areaLabel('Kleurbar', [BAR.x, 1.75, BAR.z]);
    // Coffee for the chairs, in the back corner.
    const counter = box(1.1, 0.95, 0.6, mat('#DCE2F2', 0.5), 0.04);
    counter.position.set(5.95, 0.47, -3.9);
    const machine = box(0.42, 0.42, 0.36, mat('#C9A46A', 0.3, { metalness: 0.8 }), 0.05);
    machine.position.set(5.85, 1.17, -3.95);
    this.root.add(counter, machine);
    this.areaLabel('Koffie', [5.95, 1.95, -3.9]);
  }

  private buildFront() {
    // Reception with the product wall behind it.
    const desk = box(2.1, 1.02, 0.7, mat('#F2ECE4', 0.3), 0.08);
    desk.position.set(DESK.x, 0.51, DESK.z);
    const front = box(2.12, 0.86, 0.04, mat('#C9A46A', 0.35, { metalness: 0.7 }), 0.02);
    front.position.set(DESK.x, 0.45, DESK.z + 0.37);
    const tablet = box(0.32, 0.02, 0.24, mat('#0B0D18', 0.2), 0.01);
    tablet.position.set(DESK.x + 0.4, 1.04, DESK.z);
    this.root.add(desk, front, tablet);
    const shelf = mat('#E9E1D6', 0.4);
    const products = ['#F4F1EC', '#1B1410', '#3A0D10', '#0E2A2B', '#2A1238', '#151515', '#F4F1EC', '#2B2015'];
    for (let row = 0; row < 3; row++) {
      const plank = box(0.36, 0.04, 2.4, shelf, 0.01);
      plank.position.set(-6.45, 0.9 + row * 0.55, 2.4);
      this.root.add(plank);
      for (let i = 0; i < 9; i++) {
        const bottle = cylinder(0.05, 0.24, mat(products[(i + row * 3) % products.length], 0.35));
        bottle.position.set(-6.45, 1.04 + row * 0.55, 1.3 + i * 0.27);
        this.root.add(bottle);
      }
    }
    this.areaLabel('Balie & shop', [DESK.x, 1.75, DESK.z]);
    // The waiting sofa, facing into the salon.
    const velvet = mat('#3550D8', 0.85);
    const sofa = box(2.6, 0.42, 0.8, velvet, 0.12);
    sofa.position.set(4.1, 0.24, 3.05);
    const back = box(2.6, 0.6, 0.2, velvet, 0.08);
    back.position.set(4.1, 0.62, 3.4);
    const side = box(0.8, 0.42, 1.6, velvet, 0.12);
    side.position.set(5.75, 0.24, 1.95);
    const sideBack = box(0.2, 0.6, 1.6, velvet, 0.08);
    sideBack.position.set(6.1, 0.62, 1.95);
    const table = cylinder(0.38, 0.38, mat('#C9A46A', 0.3, { metalness: 0.8 }), 0.38, 32);
    table.position.set(4.3, 0.19, 1.85);
    const plant = cylinder(0.2, 0.42, mat('#E9E1D6', 0.5), 0.24);
    plant.position.set(2.35, 0.21, 3.6);
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat('#2F7D5B', 0.7, { flatShading: true }));
    leaves.position.set(2.35, 0.85, 3.6);
    leaves.castShadow = true;
    this.root.add(sofa, back, side, sideBack, table, plant, leaves);
    // Seats on the sofa and a spot at the desk for paying.
    SOFA.forEach(([x, z], i) => {
      const person = new Person(this.kit, lookFor(`sofa-${i}`, '#3E2A22'));
      person.group.position.set(x, 0, z);
      person.group.rotation.y = i >= 4 ? -Math.PI / 2 : Math.PI;
      person.sit(0.46);
      person.opacity = 0;
      this.root.add(person.group);
      this.seats.push({ person, id: null, fade: 0, tag: el('seat-tag'), html: '' });
    });
    for (let i = 0; i < 2; i++) {
      const person = new Person(this.kit, lookFor(`pay-${i}`, '#3E2A22'));
      person.group.position.set(DESK.x - 0.4 + i * 0.75, 0, DESK.z + 0.85);
      person.group.rotation.y = Math.PI;
      person.opacity = 0;
      this.root.add(person.group);
      this.payers.push({ person, id: null, fade: 0, tag: el('seat-tag'), html: '' });
    }
  }

  private areaLabel(text: string, at: Vec) {
    const object = new CSS2DObject(el('area-tag', text));
    object.position.set(...at);
    this.root.add(object);
  }

  update(view: FloorView) {
    this.view = view;
    for (const station of this.stations) {
      const v = view.chairs[station.chair];
      const appt = v.appt;
      station.staff = v.stylist ? 1 : 0;
      if (appt) {
        if (station.clientId !== appt.id) {
          station.client.look = lookFor(appt.name, appt.hair, appt.man);
          station.clientId = appt.id;
        }
        const basin = appt.atBasin >= 0 ? BASINS[appt.atBasin] : null;
        station.pose = basin ? 'basin' : 'chair';
        station.clientAt.set(basin ? basin[0] + 0.42 : STATION_X[station.chair], 0, basin ? basin[1] : STATION_Z);
        const foils = appt.kind === 'folies' || (appt.kind === 'inwerken' && /light|Highlights|Balayage|Ombre|Babylights|Blond/i.test(appt.service));
        const dye = appt.kind === 'aanbrengen' || (appt.kind === 'inwerken' && !foils) ? '#2A1712' : null;
        station.client.dress({ cape: !basin, towel: appt.kind === 'uitspoelen' && !basin ? true : false, foils, dye });
        station.cup.visible = appt.drink;
      } else {
        station.clientId = null;
        station.pose = 'none';
        station.cup.visible = false;
      }
      station.stylistAt.set(v.mixing ? BAR.x - 0.8 + station.chair * 0.4 : STATION_X[station.chair] + 0.55, 0, v.mixing ? BAR.z + 0.75 : STATION_Z + 0.35);
      const html = this.chairHtml(v);
      if (html !== station.html) {
        station.html = html;
        station.tag.innerHTML = html;
        station.tag.dataset.state = appt ? (appt.member ? 'member' : 'busy') : v.stylist ? 'free' : 'off';
      }
    }
    // Waiting on the sofa, and paying at the desk.
    this.seats.forEach((seat, i) => {
      const w = view.waiting[i];
      if (w && seat.id !== w.id) seat.person.look = lookFor(w.name, w.hair, w.man);
      seat.id = w ? w.id : null;
    });
    this.payers.forEach((p, i) => {
      const w = view.paying[i];
      if (w && p.id !== w.id) p.person.look = lookFor(w.name, w.hair, w.man);
      p.id = w ? w.id : null;
    });
    const waitHtml = view.waiting.length
      ? `<b>Wachtruimte</b>${view.waiting
          .slice(0, 6)
          .map((w) => `<span class="${w.member ? 'me' : ''}">${w.name}${w.walkIn ? ' · inloop' : ''}${w.app ? ' · app' : ''}</span>`)
          .join('')}`
      : '<b>Wachtruimte</b><span>Niemand wacht</span>';
    if (waitHtml !== this.waitHtml.value) {
      this.waitHtml.value = waitHtml;
      this.waitTag.innerHTML = waitHtml;
    }
  }

  private chairHtml(v: ChairView): string {
    const head = `<div class="chair-head"><i style="background:${v.stylist?.colour ?? '#555'}"></i><b>Stoel ${v.chair + 1}</b><span>${v.stylist ? v.stylist.name : 'Vrij vandaag'}</span></div>`;
    if (!v.appt) return `${head}<div class="chair-empty">${v.stylist ? 'Stoel vrij' : '—'}</div>`;
    const a = v.appt;
    const timer = a.kind === 'inwerken' ? `<em class="timer">${mmss(a.stepLeft)}</em>` : `<em>${Math.ceil(a.left / 60000)} min</em>`;
    return `${head}<div class="chair-body">${ring(a.progress, v.stylist?.colour ?? '#FF5C93')}<div><strong>${a.name}${a.member ? ' <u>app</u>' : ''}</strong><small>${a.service}</small><small class="step">${a.step}${a.atBasin >= 0 ? ' · wasbak' : ''} ${timer}</small>${a.late ? `<small class="late">+${a.late} min uit</small>` : ''}${a.drink ? '<small class="drink">☕ drankje</small>' : ''}</div></div>`;
  }

  private frame(time: number, delta: number) {
    const view = this.view;
    for (const s of this.stations) {
      const has = s.pose !== 'none';
      s.fade = damp(s.fade, has ? 1 : 0, 6, delta);
      s.client.opacity = s.fade;
      const p = s.client.group.position;
      p.x = damp(p.x, s.clientAt.x, 3.5, delta);
      p.z = damp(p.z, s.clientAt.z, 3.5, delta);
      if (s.pose === 'basin') {
        s.client.recline(0.5);
        s.client.group.rotation.y = -Math.PI / 2;
      } else {
        s.client.sit(0.46);
        s.client.group.rotation.y = Math.PI;
      }
      const sp = s.stylist.group.position;
      sp.x = damp(sp.x, s.stylistAt.x, 2.5, delta);
      sp.z = damp(sp.z, s.stylistAt.z, 2.5, delta);
      s.stylist.opacity = damp(s.stylist.group.visible ? 1 : 0, s.staff, 4, delta) || s.staff;
      s.stylist.group.visible = s.staff > 0;
      const working = s.pose === 'chair' && !view?.chairs[s.chair].mixing;
      s.stylist.work(working ? 1 : 0, time + s.chair);
      s.light.emissiveIntensity = damp(s.light.emissiveIntensity, has ? 1.8 : s.staff ? 0.9 : 0.25, 3, delta);
    }
    for (const seat of [...this.seats, ...this.payers]) {
      seat.fade = damp(seat.fade, seat.id ? 1 : 0, 5, delta);
      seat.person.opacity = seat.fade;
    }
    // Kim washes when someone is at a basin, otherwise she helps at the colour bar.
    const washing = this.view?.washing;
    const target = washing ? new THREE.Vector3(BASINS[0][0] - 0.1, 0, BASINS[0][1] - 0.75) : new THREE.Vector3(BAR.x - 1.3, 0, BAR.z + 0.7);
    this.kim.group.position.x = damp(this.kim.group.position.x, target.x, 2.2, delta);
    this.kim.group.position.z = damp(this.kim.group.position.z, target.z, 2.2, delta);
    this.kim.group.rotation.y = washing ? 0 : Math.PI;
    this.kim.work(washing ? 0.7 : 0.4, time);
  }

  dispose() {
    this.root.removeFromParent();
  }
}
