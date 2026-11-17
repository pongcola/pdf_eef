import { TRACK_WIDTH, UNIT_SPACING } from '../config.ts';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function formationOffset(i: number, spacing = UNIT_SPACING): [number, number] {
  const r = spacing * Math.sqrt(i + 0.5);
  const a = i * GOLDEN + Math.PI / 2;
  return [Math.cos(a) * r, Math.sin(a) * r];
}

export function formationRadius(n: number, spacing = UNIT_SPACING): number {
  return spacing * Math.sqrt(Math.max(1, n)) + 0.35;
}

export interface Troop {
  /** ตำแหน่งเทียบกับศูนย์กลางฝูง */
  ox: number;
  oz: number;
  /** ขนาด (เอฟเฟกต์ตอนเข้าฝูง) */
  s: number;
  elite: boolean;
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
      this.troops.push({ ox, oz, s: 1, elite: false, cool: Math.random() * 0.4 });
    }
  }

  get count(): number {
    return this.troops.length;
  }

  get elites(): number {
    let n = 0;
    for (const t of this.troops) if (t.elite) n++;
    return n;
  }

  radius(): number {
    return formationRadius(this.troops.length);
  }

  maxX(): number {
    return Math.max(0.5, TRACK_WIDTH / 2 - 0.45 - this.radius() * 0.85);
  }

  /** เพิ่มทหารที่วิ่งมาจากตำแหน่ง (wx, wz) ในโลก */
  add(elite: boolean, wx: number, wz: number): void {
    const t: Troop = { ox: wx - this.x, oz: wz - this.z, s: 1, elite, cool: Math.random() * 0.3 };
    // ทหารพิเศษอยู่ด้านหน้า
    if (elite) this.troops.unshift(t);
    else this.troops.push(t);
  }

  /** เปลี่ยนทหารธรรมดา 1 ตัวเป็นทหารพิเศษ (ตอนฝูงเต็ม) */
  promote(): boolean {
    for (let i = this.troops.length - 1; i >= 0; i--) {
      if (!this.troops[i].elite) {
        const [t] = this.troops.splice(i, 1);
        t.elite = true;
        t.s = 0.3;
        this.troops.unshift(t);
        return true;
      }
    }
    return false;
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
