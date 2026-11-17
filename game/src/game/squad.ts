import { TRACK_WIDTH, UNIT_SPACING } from '../config.ts';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** ฝูงเป็นวงรี: แคบด้านข้าง ยาวไปด้านหลัง จะได้ลอดช่องระหว่างสิ่งกีดขวางได้ */
const SX = 0.62;
const SZ = 1.45;

export function formationOffset(i: number, spacing = UNIT_SPACING): [number, number] {
  const r = spacing * Math.sqrt(i + 0.5);
  const a = i * GOLDEN + Math.PI / 2;
  return [Math.cos(a) * r * SX, Math.sin(a) * r * SZ];
}

function baseRadius(n: number, spacing = UNIT_SPACING): number {
  return spacing * Math.sqrt(Math.max(1, n));
}

export interface Troop {
  /** ตำแหน่งเทียบกับศูนย์กลางฝูง */
  ox: number;
  oz: number;
  /** ขนาด (เอฟเฟกต์ตอนเข้าฝูง) */
  s: number;
  /** ระดับทหาร 1–5 */
  tier: number;
  /** เวลาถึงนัดถัดไป */
  cool: number;
}

/** ฝูงทหารของผู้เล่น */
export class Squad {
  troops: Troop[] = [];
  x = 0;
  z = 0;
  targetX = 0;

  reset(n: number): void {
    this.troops = [];
    this.x = 0;
    this.targetX = 0;
    for (let i = 0; i < n; i++) {
      const [ox, oz] = formationOffset(i);
      this.troops.push({ ox, oz, s: 1, tier: 1, cool: Math.random() * 0.4 });
    }
  }

  get count(): number {
    return this.troops.length;
  }

  /** ครึ่งความกว้างของฝูง */
  radiusX(): number {
    return baseRadius(this.troops.length) * SX + 0.3;
  }

  /** ครึ่งความยาวของฝูง (หน้า-หลัง) */
  radiusZ(): number {
    return baseRadius(this.troops.length) * SZ + 0.3;
  }

  maxX(): number {
    return Math.max(0.5, TRACK_WIDTH / 2 - 0.4 - this.radiusX() * 0.9);
  }

  /** เพิ่มทหารที่วิ่งมาจากตำแหน่ง (wx, wz) ในโลก — ระดับสูงอยู่ด้านหน้า */
  add(tier: number, wx: number, wz: number): void {
    const t: Troop = { ox: wx - this.x, oz: wz - this.z, s: 1, tier, cool: Math.random() * 0.3 };
    let i = 0;
    while (i < this.troops.length && this.troops[i].tier >= tier) i++;
    this.troops.splice(i, 0, t);
  }

  /** ฝูงเต็ม: เปลี่ยนทหารระดับต่ำสุด 1 ตัวเป็นระดับ tier (ถ้าต่ำกว่า) */
  promote(tier: number): boolean {
    let low = -1;
    for (let i = 0; i < this.troops.length; i++) {
      if (this.troops[i].tier < tier && (low < 0 || this.troops[i].tier < this.troops[low].tier)) low = i;
    }
    if (low < 0) return false;
    const [t] = this.troops.splice(low, 1);
    t.s = 0.3;
    this.add(tier, this.x + t.ox, this.z + t.oz);
    return true;
  }

  remove(i: number): Troop {
    return this.troops.splice(i, 1)[0];
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-dt * 6);
    for (let i = 0; i < this.troops.length; i++) {
      const t = this.troops[i];
      const [tx, tz] = formationOffset(i);
      t.ox += (tx - t.ox) * k;
      t.oz += (tz - t.oz) * k;
      if (t.s < 1) t.s = Math.min(1, t.s + dt * 3);
    }
  }
}
