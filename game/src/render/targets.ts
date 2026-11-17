import {
  type Material,
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
import { MAX_TIER } from '../config.ts';
import { ERAS, PLAYER_COLOR, TIER_COLORS, tierLook } from '../eras.ts';
import { STAT_LABEL, type StatKind } from '../game/level.ts';
import { part, unitGeometry, unitMaterial } from './units.ts';

export type TargetKind = 'block' | 'cage' | 'capsule' | 'pad' | 'crystal' | 'stat';

const starMat = new MeshLambertMaterial({ color: 0xffd23f, emissive: new Color(0x8a6a00) });

const merge = (parts: BufferGeometry[]) => mergeGeometries(parts, false)!;
const vcMat = new MeshLambertMaterial({ vertexColors: true });
const idleRun = { value: 0 };
let idleUnitMat: Material | null = null;
function unitMat(): Material {
  idleUnitMat ??= unitMaterial(idleRun);
  return idleUnitMat;
}

const runRun = { value: 1 };
let runUnitMat: Material | null = null;

function staticUnit(era: number, color: number, scale = 1, running = false): Mesh {
  const geo = unitGeometry(era, color).clone();
  const n = geo.getAttribute('position').count;
  geo.setAttribute('aPhase', new Float32BufferAttribute(new Float32Array(n).fill(Math.random() * 6), 1));
  const m = new Mesh(geo, running ? (runUnitMat ??= unitMaterial(runRun)) : unitMat());
  m.scale.setScalar(scale);
  return m;
}

/** ทหารระดับ tier ของยุค era (ทหารระดับสูงหน้าตาเป็นทหารยุคถัดไป) */
export function troopMesh(era: number, tier: number, running = false): Mesh {
  return staticUnit(tierLook(era, tier), TIER_COLORS[tier - 1], 1 + (tier - 1) * 0.05, running);
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

const coreGeo = merge([
  part(new CylinderGeometry(0.62, 0.66, 1.25, 12), 0xc8704e, 0, 0.62, 0),
  ...[0.3, 0.62, 0.94].map((y) => part(new CylinderGeometry(0.665, 0.665, 0.05, 12), 0x8e4a33, 0, y, 0)),
  part(new CylinderGeometry(0.7, 0.7, 0.16, 14), 0xb08458, 0, 1.3, 0),
  part(new CylinderGeometry(0.5, 0.5, 0.04, 14), 0xd8b98a, 0, 1.39, 0),
]);

/** สิ่งกีดขวาง 2 ชั้น: เปลือกนอกแตกเมื่อเลือดเหลือครึ่ง เหลือแกนข้างใน */
export class BlockTarget extends Target {
  readonly kind = 'block' as const;
  readonly coins: number;
  private readonly shell: Mesh;
  private readonly core: Mesh;
  cracked = false;
  /** เพิ่งแตกชั้นนอก (เกมใช้ทำเอฟเฟกต์) */
  justCracked = false;
  constructor(era: number, x: number, z: number, hp: number, coins: number) {
    super(x, z, hp);
    this.coins = coins;
    this.halfW = 1.0;
    this.shell = new Mesh(blockGeometry(era), vcMat);
    this.core = new Mesh(coreGeo, vcMat);
    this.core.visible = false;
    this.group.add(this.shell, this.core);
  }

  /** ก้อนหินยิงไม่แตก: นับแค่จำนวนครั้งที่โดน (ใช้เติมหลอด Level แคปซูล) */
  hits = 0;
  hit(dmg: number): boolean {
    this.hits++;
    this.pending += dmg;
    this.hitT = 0.08;
    return false;
  }

  update(dt: number, _t: number): void {
    if (this.hitT > 0) this.hitT -= dt;
    const sq = this.hitT > 0 ? 0.93 : 1;
    this.group.scale.set(2 - sq, sq, 2 - sq);
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
  readonly cashValue: number;
  /** จำนวนครั้งที่ปล่อยเงินไปแล้ว (ทุกๆ 25% ของเลือด) */
  drops = 0;
  private readonly inmates: Mesh[] = [];
  constructor(era: number, x: number, z: number, hp: number, prisoners: number, cashValue: number) {
    super(x, z, hp);
    this.prisoners = prisoners;
    this.cashValue = cashValue;
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

// ---------- แท่นทหาร (ยิงเพื่ออัปเลเวล) + Collect Area ----------

const padMat = new MeshLambertMaterial({ color: 0x3ccf6a });
const padEdgeMat = new MeshLambertMaterial({ color: 0x23a050 });
const padWallMat = new MeshLambertMaterial({ color: 0x2fb85a });
const glassMat = new MeshLambertMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.38, depthWrite: false });
const capGeo = new CylinderGeometry(0.46, 0.46, 0.14, 14);
const glassGeo = new CylinderGeometry(0.44, 0.44, 1.35, 14, 1, true);
const baseGeo = new CylinderGeometry(0.42, 0.48, 0.3, 8);

export class CapsuleTarget extends Target {
  readonly kind = 'capsule' as const;
  unit: Mesh;
  tier = 1;
  readonly pad: RecruitPad;
  private readonly glass: Mesh;
  private readonly cap: Mesh;
  private readonly era: number;
  constructor(pad: RecruitPad, era: number, x: number, z: number, hp: number) {
    super(x, z, hp);
    this.pad = pad;
    this.era = era;
    this.halfW = 0.5;
    this.halfD = 0.5;
    const base = new Mesh(baseGeo, padEdgeMat);
    base.position.y = 0.3;
    this.group.add(base);
    this.glass = new Mesh(glassGeo, glassMat);
    this.glass.position.y = 1.12;
    this.glass.renderOrder = 3;
    this.group.add(this.glass);
    this.cap = new Mesh(capGeo, padEdgeMat);
    this.cap.position.y = 1.83;
    this.group.add(this.cap);
    this.unit = troopMesh(era, 1);
    this.unit.position.y = 0.45;
    this.group.add(this.unit);
  }

  /** เปลี่ยนหน้าตาทหารข้างในตามเลเวลของแท่น */
  setTier(tier: number): void {
    if (tier === this.tier) return;
    this.tier = tier;
    this.group.remove(this.unit);
    this.unit.geometry.dispose();
    this.unit = troopMesh(this.era, tier);
    this.unit.position.y = 0.45;
    this.group.add(this.unit);
  }

  /** แตกแล้ว: ทหารวิ่งออกไป */
  shatter(): void {
    this.glass.visible = false;
    this.cap.visible = false;
    this.unit.visible = false;
  }

  update(dt: number, t: number): void {
    if (this.alive) super.update(dt, t);
    else this.group.scale.setScalar(1);
  }

  dispose(): void {
    super.dispose();
    this.unit.geometry.dispose();
  }
}

/** ตัวแท่น: รับกระสุนเพื่อเพิ่มเลเวล (ไม่มีวันแตก) */
export class PadBody extends Target {
  readonly kind = 'pad' as const;
  readonly pad: RecruitPad;
  constructor(pad: RecruitPad) {
    super(pad.x, pad.z - 0.05, Infinity);
    this.pad = pad;
    this.halfW = 1.6;
    this.halfD = 0.7;
    this.group.visible = false;
  }

  hit(dmg: number): boolean {
    this.pending += dmg;
    return false;
  }

  update(): void {}
}

/** ทหารที่ออกจากแคปซูล วิ่งไปรอที่ Collect Area */
export interface Walker {
  mesh: Mesh;
  tier: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
  arrived: boolean;
}

function collectTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.font = '800 64px Kanit, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 12;
  g.strokeStyle = '#1b5f8a';
  g.strokeText('Collect Area', 256, 52);
  g.fillStyle = '#e6fbff';
  g.fillText('Collect Area', 256, 52);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
let collectTex: CanvasTexture | null = null;
const stripMat = new MeshBasicMaterial({ color: 0x7fdcff, transparent: true, opacity: 0.55, depthWrite: false });

export class RecruitPad {
  readonly group = new Group();
  readonly x: number;
  readonly z: number;
  readonly capsules: CapsuleTarget[] = [];
  readonly body: PadBody;
  readonly era: number;
  /** Level ที่ได้เพิ่มจากการยิงแท่นนี้ (Level = 1 + own) */
  own = 0;
  /** Level สูงสุดของแท่น */
  readonly maxLevel: number;
  private readonly capsuleHp: number;
  /** ดาเมจสะสมในเลเวลปัจจุบัน */
  prog = 0;
  readonly levelHp: number;
  readonly walkers: Walker[] = [];
  readonly collectX: number;
  readonly collectZ: number;
  readonly collectHalfW: number;
  collected = false;
  label: HTMLElement | null = null;
  private readonly strip: Group;

  constructor(era: number, x: number, z: number, count: number, capsuleHp: number, levelHp: number, maxLevel: number, collect: { x: number; z: number; w: number }) {
    this.era = era;
    this.x = x;
    this.z = z;
    this.levelHp = levelHp;
    this.maxLevel = maxLevel;
    this.collectX = collect.x;
    this.collectZ = collect.z;
    this.collectHalfW = collect.w / 2;
    const pad = new Mesh(new CylinderGeometry(1.7, 1.8, 0.3, 28), padMat);
    pad.position.set(x, 0.15, z);
    this.group.add(pad);
    const edge = new Mesh(new TorusGeometry(1.72, 0.09, 6, 32), padEdgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(x, 0.3, z);
    this.group.add(edge);
    // ผนังโค้งด้านหลัง
    const wall = new Mesh(new CylinderGeometry(1.55, 1.55, 1.9, 20, 1, true, Math.PI * 0.62, Math.PI * 0.76), padWallMat);
    wall.position.set(x, 1.1, z);
    this.group.add(wall);
    this.body = new PadBody(this);
    this.capsuleHp = capsuleHp;
    this.setCount(count);
    // Collect Area: แถบสีฟ้าบนถนนข้างหน้า
    this.strip = new Group();
    const area = new Mesh(new PlaneGeometry(collect.w, 2.6), stripMat);
    area.rotation.x = -Math.PI / 2;
    area.position.y = 0.03;
    area.renderOrder = 1;
    this.strip.add(area);
    const text = new Mesh(new PlaneGeometry(Math.min(collect.w, 4.4), 0.85), new MeshBasicMaterial({ map: (collectTex ??= collectTexture()), transparent: true, depthWrite: false }));
    text.rotation.x = -Math.PI / 2;
    text.position.set(0, 0.05, 0.6);
    text.renderOrder = 2;
    this.strip.add(text);
    this.strip.position.set(collect.x, 0, collect.z);
    this.group.add(this.strip);
  }

  /** Level ที่ได้จากหลอดซ้าย (ยิงก้อนหิน) */
  bonus = 0;
  get level(): number {
    return Math.min(MAX_TIER, this.maxLevel, 1 + this.own + this.bonus);
  }

  /** หลอดซ้ายเต็ม → ทหารในแคปซูล Level +1 */
  addBonus(): void {
    if (this.maxed) return;
    this.bonus++;
    this.refreshTier();
  }

  get maxed(): boolean {
    return this.level >= Math.min(MAX_TIER, this.maxLevel);
  }

  /** ตั้งจำนวนแคปซูล (เกจซ้ายเต็มแล้ว +1, สูงสุด 5); คืนค่าแคปซูลที่เพิ่มใหม่ */
  setCount(n: number): CapsuleTarget[] {
    n = Math.min(5, n);
    const added: CapsuleTarget[] = [];
    while (this.capsules.length < n) {
      const c = new CapsuleTarget(this, this.era, this.x, this.z, this.capsuleHp);
      c.setTier(this.level);
      this.capsules.push(c);
      this.group.add(c.group);
      added.push(c);
    }
    // จัดวาง: แถวหน้าสูงสุด 3 ช่อง ที่เหลืออยู่แถวหลัง
    const front = Math.min(3, this.capsules.length);
    const back = this.capsules.length - front;
    this.capsules.forEach((c, i) => {
      const row = i < front ? 0 : 1;
      const k = row === 0 ? i : i - front;
      const cnt = row === 0 ? front : back;
      const gap = cnt >= 3 ? 1.0 : 1.15;
      c.x = this.x + (k - (cnt - 1) / 2) * gap;
      c.z = this.z + (back > 0 ? (row === 0 ? 0.5 : -0.5) : 0.1);
      c.group.position.set(c.x, 0, c.z);
    });
    return added;
  }

  /** เพิ่มดาเมจเข้าแท่น; คืนค่า true ถ้า Level ขึ้น */
  addProgress(dmg: number): boolean {
    if (this.maxed) return false;
    this.prog += dmg;
    const need = this.levelHp * Math.pow(1.3, this.own);
    if (this.prog < need) return false;
    this.prog -= need;
    this.own++;
    this.refreshTier();
    return true;
  }

  private refreshTier(): void {
    for (const c of this.capsules) if (c.alive) c.setTier(this.level);
  }

  levelFrac(): number {
    if (this.maxed) return 1;
    return Math.min(1, this.prog / (this.levelHp * Math.pow(1.3, this.own)));
  }

  /** แคปซูลแตก → ทหารวิ่งไปยืนรอใน Collect Area */
  release(c: CapsuleTarget): void {
    const i = this.walkers.length;
    const mesh = troopMesh(this.era, this.level, true);
    mesh.position.set(c.x, 0.3, c.z);
    this.group.add(mesh);
    const span = Math.min(this.collectHalfW * 2 - 0.8, 3.6);
    this.walkers.push({
      mesh,
      tier: this.level,
      x: c.x,
      z: c.z,
      tx: this.collectX - span / 2 + ((i * 0.9) % span),
      tz: this.collectZ - 0.4 - Math.floor((i * 0.9) / span) * 0.8,
      arrived: false,
    });
  }

  updateWalkers(dt: number): void {
    for (const w of this.walkers) {
      if (w.arrived) continue;
      const dx = w.tx - w.x;
      const dz = w.tz - w.z;
      const d = Math.hypot(dx, dz);
      const step = dt * 6;
      if (d <= step) {
        w.x = w.tx;
        w.z = w.tz;
        w.arrived = true;
        w.mesh.rotation.y = Math.PI;
        w.mesh.position.y = 0;
      } else {
        w.x += (dx / d) * step;
        w.z += (dz / d) * step;
        w.mesh.rotation.y = Math.atan2(-dx, -dz);
        w.mesh.position.y = 0.3;
      }
      w.mesh.position.x = w.x;
      w.mesh.position.z = w.z;
    }
  }

  /** เก็บแล้ว/ผ่านไปแล้ว: ซ่อนทหารที่รอ */
  clearWalkers(): void {
    for (const w of this.walkers) w.mesh.visible = false;
    this.strip.visible = false;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const c of this.capsules) c.dispose();
    for (const w of this.walkers) w.mesh.geometry.dispose();
  }
}

// ---------- ทุ่งสมบัติ: หอคอยหลากสี มีเงินบนยอด ----------

/** สีหอคอยไล่ตามความลึก: ฟ้า → เขียว → ม่วง → ทอง → แดง */
const TOWER_COLORS = [0x4a7fe0, 0x3fbf6a, 0xb04fd0, 0xe8b62a, 0xe0504a];
const towerGeoCache = new Map<number, BufferGeometry>();
function towerGeometry(color: number): BufferGeometry {
  const c = towerGeoCache.get(color);
  if (c) return c;
  const dark = new Color(color).multiplyScalar(0.72).getHex();
  const parts: BufferGeometry[] = [
    part(new CylinderGeometry(1.05, 1.2, 0.35, 10), dark, 0, 0.18, 0),
    part(new CylinderGeometry(0.82, 0.95, 1.7, 10), color, 0, 1.15, 0),
    part(new CylinderGeometry(1.08, 0.9, 0.32, 10), color, 0, 2.12, 0),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(part(new BoxGeometry(0.34, 0.32, 0.34), color, Math.cos(a) * 0.9, 2.42, Math.sin(a) * 0.9, { ry: -a }));
  }
  parts.push(part(new BoxGeometry(0.34, 0.5, 0.06), dark, 0, 1.1, 0.92));
  // กองเงินบนยอด
  for (let i = 0; i < 3; i++) {
    parts.push(part(new BoxGeometry(0.85, 0.2, 0.46), 0x3ea85a, (i - 1) * 0.12, 2.4 + i * 0.21, (i % 2) * 0.1 - 0.05, { ry: 0.3 }));
    parts.push(part(new BoxGeometry(0.2, 0.21, 0.48), 0xf0f0e0, (i - 1) * 0.12, 2.4 + i * 0.21, (i % 2) * 0.1 - 0.05, { ry: 0.3 }));
  }
  const g = merge(parts);
  towerGeoCache.set(color, g);
  return g;
}
const starGeo = new OctahedronGeometry(0.42, 0);

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
    this.halfW = 1.15;
    this.halfD = 0.8;
    this.color = TOWER_COLORS[Math.min(TOWER_COLORS.length - 1, Math.floor(tier / 3))];
    this.group.add(new Mesh(towerGeometry(this.color), vcMat));
    if (star) {
      this.starMesh = new Mesh(starGeo, starMat);
      this.starMesh.position.y = 3.6;
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

const postMat = new MeshLambertMaterial({ color: 0x5a5f6b });
const postGeo = new BoxGeometry(0.24, 2.9, 0.24);
const spikeTopGeo = new BoxGeometry(0.36, 0.36, 0.36);
const plankMat = new MeshLambertMaterial({ color: 0x9a6440 });
const plankGeo = new BoxGeometry(4.0, 0.34, 0.14);

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
  /** แผงไม้กั้นด้านหน้า: ต้องยิงให้พังก่อนถึงจะยิงเพิ่มค่าได้ */
  barrierHp: number;
  readonly barrierMax: number;
  private readonly barrier = new Group();
  /** เพิ่งพังแผงไม้ (เกมใช้ทำเอฟเฟกต์) */
  justBroke = false;

  constructor(x: number, z: number, stat: StatKind, value: number, barrierHp = 0) {
    super(x, z, Infinity);
    this.stat = stat;
    this.value = value;
    this.barrierHp = barrierHp;
    this.barrierMax = barrierHp;
    this.halfW = 2.15;
    this.halfD = 0.5;
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
      const top = new Mesh(spikeTopGeo, postMat);
      top.position.set(sx * 2.15, 3.0, 0);
      top.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      this.group.add(top);
    }
    if (barrierHp > 0) {
      for (const [y, rz] of [
        [0.45, 0],
        [1.05, 0],
        [1.65, 0],
        [1.05, 0.42],
        [1.05, -0.42],
      ]) {
        const pl = new Mesh(plankGeo, plankMat);
        pl.position.set(0, y, 0.38);
        pl.rotation.z = rz;
        this.barrier.add(pl);
      }
      this.group.add(this.barrier);
    }
    this.draw();
  }

  get blocked(): boolean {
    return this.barrierHp > 0;
  }

  /** gain = ค่าที่เพิ่มต่อนัด (ตามระดับทหาร) */
  shoot(dmg: number, gain: number): void {
    this.pending += dmg;
    this.hitT = 0.06;
    if (this.barrierHp > 0) {
      this.barrierHp -= dmg;
      if (this.barrierHp <= 0) {
        this.barrierHp = 0;
        this.barrier.visible = false;
        this.justBroke = true;
      }
      return;
    }
    this.value = Math.min(400, this.value + gain);
  }

  hit(dmg: number): boolean {
    this.shoot(dmg, 1);
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
    const txt = `${v > 0 ? '+' : ''}${v}`;
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
