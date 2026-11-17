import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ERAS, PLAYER_COLOR, TIER_COLORS } from '../eras.ts';
import { STAT_LABEL, type StatKind } from '../game/level.ts';
import { part, unitGeometry, unitMaterial } from './units.ts';

export type TargetKind = 'block' | 'cage' | 'capsule' | 'crystal' | 'stat';

const starMat = new MeshLambertMaterial({ color: 0xffd23f, emissive: new Color(0x8a6a00) });

const merge = (parts: BufferGeometry[]) => mergeGeometries(parts, false)!;
const vcMat = new MeshLambertMaterial({ vertexColors: true });
const idleRun = { value: 0 };
let idleUnitMat: MeshLambertMaterial | null = null;
function unitMat(): MeshLambertMaterial {
  idleUnitMat ??= unitMaterial(idleRun);
  return idleUnitMat;
}

function staticUnit(era: number, color: number, scale = 1): Mesh {
  const geo = unitGeometry(era, color).clone();
  geo.setAttribute('aPhase', new Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count), 1));
  const m = new Mesh(geo, unitMat());
  m.scale.setScalar(scale);
  return m;
}

/** เป้าที่ยิงได้ */
export abstract class Target {
  readonly group = new Group();
  abstract readonly kind: TargetKind;
  x: number;
  z: number;
  halfW = 1;
  halfD = 0.6;
  hp: number;
  maxHp: number;
  alive = true;
  /** ดาเมจสะสมรอแสดงเป็นตัวเลข */
  pending = 0;
  pendT = 0;
  label: HTMLElement | null = null;
  protected hitT = 0;

  constructor(x: number, z: number, hp: number) {
    this.x = x;
    this.z = z;
    this.hp = hp;
    this.maxHp = hp;
    this.group.position.set(x, 0, z);
  }

  /** คืนค่า true ถ้าเป้าถูกทำลายด้วยนัดนี้ */
  hit(dmg: number): boolean {
    if (!this.alive) return false;
    this.hp -= dmg;
    this.pending += dmg;
    this.hitT = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  update(dt: number, _t: number): void {
    if (this.hitT > 0) this.hitT -= dt;
    const sq = this.hitT > 0 ? 0.93 : 1;
    const hpK = 0.78 + 0.22 * (this.hp / this.maxHp);
    this.group.scale.set(2 - sq, sq * hpK, 2 - sq);
  }

  dispose(): void {
    this.group.removeFromParent();
  }
}

// ---------- สิ่งกีดขวาง ----------

const blockGeoCache = new Map<number, BufferGeometry>();
function blockGeometry(era: number): BufferGeometry {
  const c = blockGeoCache.get(era);
  if (c) return c;
  const E = ERAS[era];
  let g: BufferGeometry;
  switch (E.decor) {
    case 'stone':
      g = merge([
        part(new DodecahedronGeometry(0.85, 0), 0x8f8a80, 0, 0.6, 0, { sy: 0.8 }),
        part(new DodecahedronGeometry(0.62, 0), 0xa39d92, 0.1, 1.3, 0.05, { ry: 0.6 }),
        part(new DodecahedronGeometry(0.4, 0), 0x7d776d, -0.15, 1.8, 0, { ry: 1.2 }),
      ]);
      break;
    case 'ancient':
      g = merge([
        part(new BoxGeometry(1.9, 0.25, 1.4), 0xcfb27a, 0, 0.12, 0),
        part(new CylinderGeometry(0.75, 0.8, 1.4, 12), 0xe8d3a0, 0, 0.95, 0),
        part(new CylinderGeometry(0.82, 0.82, 0.12, 12), 0xc9a464, 0, 0.6, 0),
        part(new CylinderGeometry(0.82, 0.82, 0.12, 12), 0xc9a464, 0, 1.3, 0),
        part(new BoxGeometry(1.8, 0.25, 1.3), 0xcfb27a, 0, 1.75, 0),
      ]);
      break;
    case 'medieval':
      g = merge([
        part(new CylinderGeometry(0.9, 0.95, 1.6, 14), 0x9b9b98, 0, 0.8, 0),
        ...[0.35, 0.8, 1.25].map((y) => part(new CylinderGeometry(0.97, 0.97, 0.1, 14), 0x76767a, 0, y, 0)),
        part(new CylinderGeometry(1.0, 1.0, 0.22, 14), 0x8a6a4a, 0, 1.7, 0),
        part(new CylinderGeometry(0.75, 0.75, 0.05, 14), 0xc8a87a, 0, 1.82, 0),
      ]);
      break;
    case 'gunpowder':
      g = merge([
        part(new CylinderGeometry(0.7, 0.62, 0.95, 12), 0x9c6a3a, -0.45, 0.48, 0),
        part(new CylinderGeometry(0.7, 0.62, 0.95, 12), 0x8f5f33, 0.5, 0.48, 0.05),
        part(new CylinderGeometry(0.7, 0.62, 0.95, 12), 0xa97441, 0.02, 1.43, 0),
        ...[-0.45, 0.5].flatMap((x) => [0.2, 0.76].map((y) => part(new CylinderGeometry(0.71, 0.71, 0.07, 12), 0x3a3a3a, x, y, 0))),
        ...[1.15, 1.71].map((y) => part(new CylinderGeometry(0.71, 0.71, 0.07, 12), 0x3a3a3a, 0.02, y, 0)),
      ]);
      break;
    case 'modern':
      g = merge([
        part(new BoxGeometry(2.0, 1.3, 1.0), 0xb9bec4, 0, 0.65, 0),
        part(new BoxGeometry(2.02, 0.3, 1.02), 0xf0c419, 0, 0.95, 0),
        ...[-0.7, 0, 0.7].map((x) => part(new BoxGeometry(0.3, 0.31, 1.03), 0x2e3238, x, 0.95, 0, { rz: 0.5 })),
        part(new BoxGeometry(1.6, 0.4, 0.8), 0x8c7a5a, 0, 1.5, 0),
      ]);
      break;
    case 'future':
    default:
      g = merge([
        part(new BoxGeometry(1.7, 1.7, 1.2), 0x3a2a7a, 0, 0.85, 0),
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => part(new BoxGeometry(0.12, 0.12, 1.25), 0x38f2ff, sx * 0.85, 0.85 + sy * 0.85, 0))),
        part(new BoxGeometry(0.9, 0.9, 1.25), 0xff4fd8, 0, 0.85, 0),
      ]);
      break;
  }
  blockGeoCache.set(era, g);
  return g;
}

export class BlockTarget extends Target {
  readonly kind = 'block' as const;
  readonly coins: number;
  constructor(era: number, x: number, z: number, hp: number, coins: number) {
    super(x, z, hp);
    this.coins = coins;
    this.halfW = 1.0;
    this.group.add(new Mesh(blockGeometry(era), vcMat));
  }
}

// ---------- กรงเชลย ----------

const cageMetal = new MeshLambertMaterial({ color: 0x4a4f5a });
const cageGold = new MeshLambertMaterial({ color: 0xffc928 });
const barGeo = new CylinderGeometry(0.05, 0.05, 1.7, 5);
const ringGeo = new CylinderGeometry(1.0, 1.0, 0.16, 18);

export class CageTarget extends Target {
  readonly kind = 'cage' as const;
  readonly prisoners: number;
  private readonly inmates: Mesh[] = [];
  constructor(era: number, x: number, z: number, hp: number, prisoners: number) {
    super(x, z, hp);
    this.prisoners = prisoners;
    this.halfW = 1.0;
    const base = new Mesh(ringGeo, cageMetal);
    base.position.y = 0.08;
    this.group.add(base);
    const top = new Mesh(ringGeo, cageMetal);
    top.position.y = 1.85;
    this.group.add(top);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const b = new Mesh(barGeo, cageMetal);
      b.position.set(Math.cos(a) * 0.92, 1.0, Math.sin(a) * 0.92);
      this.group.add(b);
    }
    const lock = new Mesh(new BoxGeometry(0.34, 0.34, 0.12), cageGold);
    lock.position.set(0, 0.9, 1.0);
    this.group.add(lock);
    const show = Math.min(3, prisoners);
    for (let i = 0; i < show; i++) {
      const u = staticUnit(era, PLAYER_COLOR, 0.95);
      u.position.set((i - (show - 1) / 2) * 0.45, 0.16, (i % 2) * 0.2 - 0.1);
      this.group.add(u);
      this.inmates.push(u);
    }
  }

  /** ตำแหน่งในโลกของเชลยแต่ละตัว (ใช้ตอนปล่อยตัว) */
  prisonerSpots(): { x: number; z: number }[] {
    const out = [];
    for (let i = 0; i < this.prisoners; i++) out.push({ x: this.x + (i - (this.prisoners - 1) / 2) * 0.4, z: this.z });
    return out;
  }

  update(dt: number, t: number): void {
    super.update(dt, t);
    this.inmates.forEach((m, i) => (m.position.y = 0.16 + Math.abs(Math.sin(t * 5 + i)) * 0.12));
  }

  dispose(): void {
    super.dispose();
    for (const m of this.inmates) m.geometry.dispose();
  }
}

// ---------- แท่นทหารพิเศษ ----------

const padMat = new MeshLambertMaterial({ color: 0x2ec4b6 });
const padEdgeMat = new MeshLambertMaterial({ color: 0x1b8f85 });
const glassMat = new MeshLambertMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.38, depthWrite: false });
const capGeo = new CylinderGeometry(0.46, 0.46, 0.14, 14);
const glassGeo = new CylinderGeometry(0.44, 0.44, 1.35, 14, 1, true);

export class CapsuleTarget extends Target {
  readonly kind = 'capsule' as const;
  readonly unit: Mesh;
  private readonly glass: Mesh;
  private readonly cap: Mesh;
  readonly tier: number;
  constructor(era: number, x: number, z: number, hp: number, tier: number) {
    super(x, z, hp);
    this.tier = tier;
    this.halfW = 0.5;
    this.halfD = 0.5;
    const ring = new Mesh(capGeo, padEdgeMat);
    ring.position.y = 0.2;
    this.group.add(ring);
    this.glass = new Mesh(glassGeo, glassMat);
    this.glass.position.y = 0.95;
    this.glass.renderOrder = 3;
    this.group.add(this.glass);
    this.cap = new Mesh(capGeo, padEdgeMat);
    this.cap.position.y = 1.66;
    this.group.add(this.cap);
    this.unit = staticUnit(era, TIER_COLORS[tier - 1], 1 + (tier - 1) * 0.05);
    this.unit.position.y = 0.27;
    this.group.add(this.unit);
  }

  /** แตกแล้ว: เหลือแต่ทหารยืนรอ */
  shatter(): void {
    this.glass.visible = false;
    this.cap.visible = false;
  }

  update(dt: number, t: number): void {
    if (this.alive) super.update(dt, t);
    else {
      this.group.scale.setScalar(1);
      this.unit.position.y = 0.27 + Math.abs(Math.sin(t * 6 + this.x)) * 0.15;
    }
  }

  dispose(): void {
    super.dispose();
    this.unit.geometry.dispose();
  }
}

export class RecruitPad {
  readonly group = new Group();
  readonly x: number;
  readonly z: number;
  readonly capsules: CapsuleTarget[] = [];
  readonly tier: number;
  collected = false;
  label: HTMLElement | null = null;
  constructor(era: number, x: number, z: number, count: number, hp: number, tier: number) {
    this.tier = tier;
    this.x = x;
    this.z = z;
    const pad = new Mesh(new CylinderGeometry(1.55, 1.65, 0.16, 24), padMat);
    pad.position.set(x, 0.08, z);
    this.group.add(pad);
    const edge = new Mesh(new TorusGeometry(1.55, 0.07, 6, 32), padEdgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(x, 0.17, z);
    this.group.add(edge);
    for (let i = 0; i < count; i++) {
      const c = new CapsuleTarget(era, x + (i - (count - 1) / 2) * 1.2, z, hp, tier);
      this.capsules.push(c);
      this.group.add(c.group);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const c of this.capsules) c.dispose();
    for (const ch of this.group.children) if (ch instanceof Mesh && ch.material === padMat) ch.geometry.dispose();
  }
}

// ---------- คริสตัลในทุ่งสมบัติ ----------

const CRYSTAL_COLORS = [0x4aa3ff, 0x36d1e0, 0x3ddc84, 0x9be22d, 0xffd23f, 0xff9f1c, 0xff5d5d, 0xff4fd8, 0xb46bff, 0xffffff];
const crystalMats = CRYSTAL_COLORS.map(
  (c) => new MeshLambertMaterial({ color: c, emissive: new Color(c).multiplyScalar(0.25), flatShading: true }),
);
const crystalBaseMat = new MeshLambertMaterial({ color: 0x3b3f4c });
const shardGeo = new OctahedronGeometry(0.6, 0);
const starGeo = new OctahedronGeometry(0.42, 0);
const crystalBaseGeo = new CylinderGeometry(1.0, 1.1, 0.3, 8);

export class CrystalTarget extends Target {
  readonly kind = 'crystal' as const;
  readonly coins: number;
  readonly tier: number;
  readonly color: number;
  readonly star: boolean;
  private starMesh: Mesh | null = null;
  constructor(x: number, z: number, hp: number, coins: number, tier: number, star: boolean) {
    super(x, z, hp);
    this.coins = coins;
    this.tier = tier;
    this.star = star;
    this.halfW = 1.2;
    this.halfD = 0.7;
    const ti = Math.min(CRYSTAL_COLORS.length - 1, tier);
    this.color = CRYSTAL_COLORS[ti];
    const mat = crystalMats[ti];
    const base = new Mesh(crystalBaseGeo, crystalBaseMat);
    base.position.y = 0.15;
    this.group.add(base);
    const big = new Mesh(shardGeo, mat);
    big.scale.set(1, 2.1, 1);
    big.position.y = 1.4;
    this.group.add(big);
    for (const s of [-1, 1]) {
      const small = new Mesh(shardGeo, mat);
      small.scale.set(0.55, 1.2, 0.55);
      small.position.set(s * 0.6, 0.85, 0.15);
      small.rotation.z = -s * 0.45;
      this.group.add(small);
    }
    if (star) {
      this.starMesh = new Mesh(starGeo, starMat);
      this.starMesh.position.y = 3.3;
      this.group.add(this.starMesh);
    }
  }

  update(dt: number, t: number): void {
    super.update(dt, t);
    if (this.starMesh) this.starMesh.rotation.y = t * 2.5;
  }
}

// ---------- กองเงินบนถนน ----------

const cashGeo = merge([
  ...[0, 1, 2].map((i) => part(new BoxGeometry(0.9, 0.22, 0.5), 0x3ea85a, (i - 1) * 0.15, 0.12 + i * 0.24, (i % 2) * 0.08)),
  ...[0, 1, 2].map((i) => part(new BoxGeometry(0.2, 0.23, 0.52), 0xf0f0e0, (i - 1) * 0.15, 0.12 + i * 0.24, (i % 2) * 0.08)),
]);

export class CashStack {
  readonly group = new Group();
  readonly x: number;
  readonly z: number;
  readonly value: number;
  taken = false;
  constructor(x: number, z: number, value: number) {
    this.x = x;
    this.z = z;
    this.value = value;
    for (const ox of [-0.5, 0.5]) {
      const m = new Mesh(cashGeo, vcMat);
      m.position.set(ox, 0, 0);
      m.rotation.y = ox * 0.6;
      this.group.add(m);
    }
    this.group.position.set(x, 0, z);
  }

  update(t: number): void {
    if (!this.taken) this.group.rotation.y = Math.sin(t * 2 + this.z) * 0.25;
  }
}

// ---------- ป้ายค่าพลัง ----------

const postMat = new MeshLambertMaterial({ color: 0xffffff });
const postGeo = new BoxGeometry(0.22, 2.9, 0.22);

export class StatGate extends Target {
  readonly kind = 'stat' as const;
  readonly stat: StatKind;
  value: number;
  applied = false;
  private shown = NaN;
  private redrawT = 0;
  private readonly canvas: HTMLCanvasElement;
  private readonly tex: CanvasTexture;
  private readonly mat: MeshBasicMaterial;
  private readonly panel: Mesh;

  constructor(x: number, z: number, stat: StatKind, value: number) {
    super(x, z, Infinity);
    this.stat = stat;
    this.value = value;
    this.halfW = 2.15;
    this.halfD = 0.3;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 160;
    this.tex = new CanvasTexture(this.canvas);
    this.tex.colorSpace = SRGBColorSpace;
    this.mat = new MeshBasicMaterial({ map: this.tex, transparent: true, side: DoubleSide, depthWrite: false });
    this.panel = new Mesh(new PlaneGeometry(4.1, 2.05), this.mat);
    this.panel.position.y = 1.55;
    this.panel.renderOrder = 2;
    this.group.add(this.panel);
    for (const sx of [-1, 1]) {
      const p = new Mesh(postGeo, postMat);
      p.position.set(sx * 2.15, 1.45, 0);
      this.group.add(p);
    }
    this.draw();
  }

  hit(dmg: number): boolean {
    this.value = Math.min(60, this.value + 1);
    this.pending += dmg;
    this.hitT = 0.06;
    return false;
  }

  private draw(): void {
    const v = Math.round(this.value);
    if (v === this.shown) return;
    this.shown = v;
    const g = this.canvas.getContext('2d')!;
    const W = this.canvas.width;
    const H = this.canvas.height;
    g.clearRect(0, 0, W, H);
    const good = v >= 0;
    g.beginPath();
    g.roundRect(6, 6, W - 12, H - 12, 20);
    const grd = g.createLinearGradient(0, 0, 0, H);
    if (good) {
      grd.addColorStop(0, 'rgba(90,230,140,0.88)');
      grd.addColorStop(1, 'rgba(25,160,80,0.82)');
    } else {
      grd.addColorStop(0, 'rgba(255,110,100,0.88)');
      grd.addColorStop(1, 'rgba(210,35,45,0.82)');
    }
    g.fillStyle = grd;
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.font = '600 38px Kanit, system-ui, sans-serif';
    g.fillText(STAT_LABEL[this.stat], W / 2, 44);
    g.font = '800 72px Kanit, system-ui, sans-serif';
    g.lineWidth = 10;
    g.strokeStyle = good ? 'rgba(10,80,40,0.85)' : 'rgba(120,10,20,0.85)';
    const txt = `${v > 0 ? '+' : ''}${v}%`;
    g.strokeText(txt, W / 2, 108);
    g.fillText(txt, W / 2, 108);
    this.tex.needsUpdate = true;
  }

  update(dt: number, _t: number): void {
    if (this.hitT > 0) this.hitT -= dt;
    this.panel.scale.setScalar(this.hitT > 0 ? 1.05 : 1);
    this.redrawT -= dt;
    if (this.redrawT <= 0) {
      this.redrawT = 0.08;
      this.draw();
    }
    if (this.applied) {
      this.mat.opacity = Math.max(0, this.mat.opacity - dt * 2.5);
      if (this.mat.opacity <= 0) this.group.visible = false;
    }
  }

  dispose(): void {
    super.dispose();
    this.tex.dispose();
    this.mat.dispose();
    this.panel.geometry.dispose();
  }
}
