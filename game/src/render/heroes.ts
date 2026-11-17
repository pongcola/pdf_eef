import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HEROES } from '../heroes.ts';
import { part, unitMaterial } from './units.ts';

const merge = (p: BufferGeometry[]) => mergeGeometries(p, false)!;
const SKIN = 0xf2c6a0;
const DARK = 0x2a2420;

/** โมเดลฮีโร่ (หันไปทาง -Z) แต่ละตัวมีของประจำตัว */
function heroGeometry(id: number): BufferGeometry {
  const h = HEROES[id];
  const p: BufferGeometry[] = [];
  const legs = id === 4 ? 0x1f2937 : id === 3 ? 0x2f4f7f : 0x4a3a2c;
  p.push(part(new BoxGeometry(0.15, 0.42, 0.16), legs, -0.1, 0.21, 0, { swing: 1, pivot: 0.42 }));
  p.push(part(new BoxGeometry(0.15, 0.42, 0.16), legs, 0.1, 0.21, 0, { swing: -1, pivot: 0.42 }));
  p.push(part(new BoxGeometry(0.42, 0.46, 0.27), h.color, 0, 0.65, 0));
  p.push(part(new BoxGeometry(0.11, 0.38, 0.13), h.color, -0.28, 0.66, 0, { swing: -0.8, pivot: 0.84 }));
  p.push(part(new BoxGeometry(0.11, 0.38, 0.13), h.color, 0.28, 0.68, -0.06, { rx: -0.5 }));
  p.push(part(new SphereGeometry(0.2, 12, 10), SKIN, 0, 1.08, 0));
  switch (h.skill) {
    case 'flask':
      // เสื้อกาวน์ขาว แว่นกันสารเคมี ผมฟู ขวดยาเขียว
      p.push(part(new BoxGeometry(0.46, 0.5, 0.29), 0xf3f4f6, 0, 0.6, 0.01));
      p.push(part(new BoxGeometry(0.2, 0.42, 0.3), h.color, 0, 0.66, -0.01));
      for (const sx of [-1, 1]) p.push(part(new CylinderGeometry(0.075, 0.075, 0.06, 12), 0x7cf26b, sx * 0.08, 1.1, -0.18, { rx: Math.PI / 2 }));
      for (let i = 0; i < 6; i++) p.push(part(new ConeGeometry(0.08, 0.26, 5), 0x6d28d9, Math.cos(i) * 0.12, 1.3 + (i % 2) * 0.04, Math.sin(i) * 0.12, { rx: Math.sin(i) * 0.5, rz: Math.cos(i) * 0.5 }));
      p.push(part(new SphereGeometry(0.11, 10, 8), 0x7cf26b, 0.3, 0.62, -0.32));
      p.push(part(new CylinderGeometry(0.04, 0.04, 0.12, 8), 0xe5e7eb, 0.3, 0.75, -0.32));
      break;
    case 'punch':
      // ฮู้ดคลุมหัว นวมไฟ
      p.push(part(new SphereGeometry(0.235, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), 0x7f1d1d, 0, 1.1, 0.02));
      p.push(part(new BoxGeometry(0.3, 0.06, 0.05), 0xffb02e, 0, 1.0, -0.2));
      p.push(part(new SphereGeometry(0.14, 10, 8), 0xef4444, -0.3, 0.5, -0.04));
      p.push(part(new SphereGeometry(0.14, 10, 8), 0xef4444, 0.3, 0.6, -0.3));
      break;
    case 'axe':
      // เสื้อลายสก็อต เครา ขวานยักษ์
      p.push(part(new BoxGeometry(0.43, 0.08, 0.28), 0x1f3d26, 0, 0.55, 0));
      p.push(part(new BoxGeometry(0.43, 0.08, 0.28), 0x1f3d26, 0, 0.75, 0));
      p.push(part(new BoxGeometry(0.3, 0.16, 0.12), 0x8b5a2b, 0, 0.98, -0.15));
      p.push(part(new CylinderGeometry(0.21, 0.21, 0.08, 12), 0xb91c1c, 0, 1.24, 0));
      p.push(part(new CylinderGeometry(0.035, 0.035, 0.95, 6), 0x7a5230, 0.32, 0.95, -0.2, { rx: -0.35 }));
      p.push(part(new BoxGeometry(0.06, 0.32, 0.3), h.accent, 0.32, 1.35, -0.37, { rx: -0.35 }));
      break;
    case 'wind':
      // งอบกว้าง ผ้าคาดเอว ไม้เท้า
      p.push(part(new ConeGeometry(0.42, 0.2, 14), h.accent, 0, 1.3, 0));
      p.push(part(new BoxGeometry(0.44, 0.08, 0.29), 0xf5f5f4, 0, 0.5, 0));
      p.push(part(new CylinderGeometry(0.03, 0.03, 1.5, 6), 0x7a5230, 0.32, 0.85, -0.16));
      p.push(part(new TorusGeometry(0.1, 0.025, 6, 12), 0x93c5fd, 0.32, 1.62, -0.16));
      break;
    case 'missile':
      // หมวกแก๊ป หูฟัง ชุดดำ
      p.push(part(new SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf8fafc, 0, 1.1, 0));
      p.push(part(new BoxGeometry(0.3, 0.04, 0.2), 0x2563eb, 0, 1.12, -0.2));
      for (const sx of [-1, 1]) p.push(part(new CylinderGeometry(0.07, 0.07, 0.06, 10), h.accent, sx * 0.21, 1.06, 0, { rz: Math.PI / 2 }));
      p.push(part(new BoxGeometry(0.1, 0.1, 0.36), 0x111827, 0.3, 0.68, -0.25));
      break;
    case 'treasure':
      // หมวกสามมุม ปืนสองมือ ผ้าพันคอ
      p.push(part(new CylinderGeometry(0.3, 0.3, 0.06, 3), DARK, 0, 1.27, 0, { ry: Math.PI }));
      p.push(part(new CylinderGeometry(0.15, 0.18, 0.14, 8), DARK, 0, 1.34, 0));
      p.push(part(new BoxGeometry(0.06, 0.06, 0.2), 0xfacc15, 0, 1.36, -0.15));
      p.push(part(new BoxGeometry(0.44, 0.08, 0.29), 0xb91c1c, 0, 0.88, 0));
      p.push(part(new BoxGeometry(0.07, 0.1, 0.38), 0x374151, 0.3, 0.68, -0.26));
      p.push(part(new BoxGeometry(0.07, 0.1, 0.38), 0x374151, -0.3, 0.56, -0.2));
      break;
  }
  return merge(p);
}

export class HeroModel {
  readonly group = new Group();
  readonly run = { value: 1 };
  private readonly body: Mesh;
  private readonly drone: Group | null = null;
  private readonly rotors: Mesh[] = [];

  constructor(id: number) {
    const geo = heroGeometry(id);
    geo.setAttribute('aPhase', new Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count), 1));
    this.body = new Mesh(geo, unitMaterial(this.run));
    this.body.scale.setScalar(1.45);
    this.group.add(this.body);
    if (HEROES[id].skill === 'missile') {
      const d = new Group();
      const mat = new MeshLambertMaterial({ color: 0x334155 });
      d.add(new Mesh(new BoxGeometry(0.42, 0.12, 0.3), mat));
      const rmat = new MeshLambertMaterial({ color: 0x38f2ff });
      for (const [x, z] of [
        [-0.32, -0.24],
        [0.32, -0.24],
        [-0.32, 0.24],
        [0.32, 0.24],
      ]) {
        const r = new Mesh(new BoxGeometry(0.34, 0.02, 0.05), rmat);
        r.position.set(x, 0.09, z);
        d.add(r);
        this.rotors.push(r);
      }
      d.position.set(0.9, 2.6, -0.3);
      this.group.add(d);
      this.drone = d;
    }
  }

  update(t: number, moving: boolean): void {
    this.run.value = moving ? 1 : 0.2;
    this.body.position.y = moving ? Math.abs(Math.sin(t * 11)) * 0.06 : 0;
    if (this.drone) {
      this.drone.position.y = 2.6 + Math.sin(t * 2.4) * 0.15;
      for (const r of this.rotors) r.rotation.y += 0.9;
    }
  }

  /** ตำแหน่งปล่อยสกิล (เหนือหัว/มือ) */
  get launchY(): number {
    return this.drone ? 2.6 : 1.4;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.body.geometry.dispose();
  }
}

// ---------- วัตถุสกิล ----------

function mat(c: number, e = 0): MeshLambertMaterial {
  return new MeshLambertMaterial({ color: c, emissive: e });
}

export const SKILL_FX = {
  flask: () => {
    const g = new Group();
    g.add(new Mesh(new SphereGeometry(0.2, 10, 8), mat(0x7cf26b, 0x2a6b1c)));
    const neck = new Mesh(new CylinderGeometry(0.07, 0.07, 0.16, 8), mat(0xe5e7eb));
    neck.position.y = 0.2;
    g.add(neck);
    return g;
  },
  punch: () => new Mesh(new SphereGeometry(0.32, 12, 10), mat(0xff7a1a, 0xc0300a)),
  axe: () => {
    const g = new Group();
    const h = new Mesh(new BoxGeometry(0.08, 0.8, 0.08), mat(0x7a5230));
    g.add(h);
    const b = new Mesh(new BoxGeometry(0.08, 0.3, 0.42), mat(0xc0c6d0));
    b.position.set(0, 0.32, 0.15);
    g.add(b);
    return g;
  },
  wind: () => {
    const m = new Mesh(new TorusGeometry(0.42, 0.08, 6, 18), new MeshLambertMaterial({ color: 0xe0f2fe, emissive: 0x6aa8d8, transparent: true, opacity: 0.85 }));
    m.rotation.x = Math.PI / 2;
    const g = new Group();
    g.add(m);
    return g;
  },
  missile: () => {
    const g = new Group();
    const body = new Mesh(new CylinderGeometry(0.12, 0.12, 0.7, 8), mat(0xe5e7eb));
    g.add(body);
    const tip = new Mesh(new ConeGeometry(0.12, 0.24, 8), mat(0xef4444));
    tip.position.y = -0.47;
    tip.rotation.x = Math.PI;
    g.add(tip);
    return g;
  },
  treasure: () => new Mesh(new SphereGeometry(0.11, 8, 6), mat(0xfacc15, 0x8a6a00)),
} as const;
