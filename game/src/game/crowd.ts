import { MAX_VISIBLE_UNITS, TRACK_WIDTH, UNIT_SPACING } from '../config.ts';

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export interface Member {
  /** ตำแหน่งปัจจุบันเทียบกับศูนย์กลางฝูง */
  ox: number;
  oz: number;
  /** ขนาด (ใช้ทำเอฟเฟกต์ตอนเกิด) */
  s: number;
}

export function formationOffset(i: number, spacing = UNIT_SPACING): [number, number] {
  const r = spacing * Math.sqrt(i + 0.5);
  const a = i * GOLDEN;
  return [Math.cos(a) * r, Math.sin(a) * r];
}

export function formationRadius(n: number, spacing = UNIT_SPACING): number {
  return spacing * Math.sqrt(Math.max(1, n)) + 0.3;
}

/** ตำแหน่งยืนล้อมบอสเป็นวงๆ (วงในเต็มก่อน) */
const ringCache = new Map<number, [number, number][]>();
function ringSlots(inner: number): [number, number][] {
  const cached = ringCache.get(inner);
  if (cached) return cached;
  const slots: [number, number][] = [];
  for (let ring = 0; slots.length < MAX_VISIBLE_UNITS + 10; ring++) {
    const r = inner + ring * 0.5;
    const cap = Math.max(6, Math.floor((Math.PI * 2 * r) / 0.48));
    for (let k = 0; k < cap; k++) {
      // เริ่มจากด้านที่ฝูงวิ่งเข้ามา (+z) แล้วไล่ไปสองข้าง
      const step = Math.ceil(k / 2) * (k % 2 ? 1 : -1);
      const a = Math.PI / 2 + (step / cap) * Math.PI * 2 + ring * 0.2;
      slots.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  ringCache.set(inner, slots);
  return slots;
}

/** ฝูงของผู้เล่น: เก็บจำนวนจริง (count) และตัวที่วาดจริง (members) */
export class Crowd {
  count = 0;
  members: Member[] = [];
  x = 0;
  z = 0;
  targetX = 0;
  /** 'march' = วิ่งเป็นวงกลม, 'ring' = ล้อมบอส */
  mode: 'march' | 'ring' = 'march';
  ringInner = 2;

  reset(count: number): void {
    this.count = count;
    this.members = [];
    this.x = 0;
    this.targetX = 0;
    this.mode = 'march';
    this.sync('center');
    for (let i = 0; i < this.members.length; i++) {
      const [tx, tz] = formationOffset(i);
      this.members[i].ox = tx;
      this.members[i].oz = tz;
      this.members[i].s = 1;
    }
  }

  get visible(): number {
    return this.members.length;
  }

  radius(): number {
    return formationRadius(this.members.length);
  }

  /** ระยะที่ศูนย์กลางฝูงเลื่อนได้ไกลสุด (ฝูงใหญ่ขยับได้น้อย) */
  maxX(): number {
    return Math.max(0.6, TRACK_WIDTH / 2 - 0.35 - this.radius() * 0.8);
  }

  /** ปรับจำนวนตัวที่วาดให้ตรงกับจำนวนจริง */
  sync(spawn: 'center' | 'back'): void {
    const want = Math.min(Math.max(0, Math.round(this.count)), MAX_VISIBLE_UNITS);
    while (this.members.length < want) {
      if (spawn === 'center') {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.6;
        this.members.push({ ox: Math.cos(a) * r, oz: Math.sin(a) * r, s: 0.2 });
      } else {
        const r = this.radius();
        this.members.push({ ox: (Math.random() - 0.5) * r * 1.6, oz: r + 0.5, s: 0.4 });
      }
    }
    if (this.members.length > want) this.members.length = want;
  }

  setCount(n: number): void {
    const grew = n > this.count;
    this.count = Math.max(0, n);
    this.sync(grew ? 'center' : 'back');
  }

  /** น้ำหนักของตัวที่วาด 1 ตัว (เมื่อจำนวนจริงเกินกว่าที่วาด) */
  weight(): number {
    return this.members.length ? Math.max(1, this.count / this.members.length) : 1;
  }

  /** ฆ่าตัวที่ index; คืนค่าจำนวนคนที่เสียไปจริง */
  killMember(i: number): number {
    const lost = Math.min(this.count, Math.max(1, Math.round(this.weight())));
    this.members.splice(i, 1);
    this.count -= lost;
    this.sync('back');
    return lost;
  }

  /**
   * ลบคนออก n คน โดยเลือกตัวที่วาดตาม picker
   * คืนค่าตำแหน่งตัวที่หายไป (สำหรับเอฟเฟกต์)
   */
  removePeople(n: number, pick: 'front' | 'random'): { x: number; z: number }[] {
    n = Math.min(n, this.count);
    if (n <= 0) return [];
    const vis = this.members.length;
    const visKill = Math.min(vis, Math.max(1, Math.round((n * vis) / Math.max(1, this.count))));
    const out: { x: number; z: number }[] = [];
    for (let k = 0; k < visKill && this.members.length; k++) {
      let idx = 0;
      if (pick === 'front') {
        let best = Infinity;
        for (let i = 0; i < this.members.length; i++) {
          if (this.members[i].oz < best) {
            best = this.members[i].oz;
            idx = i;
          }
        }
      } else {
        idx = Math.floor(Math.random() * this.members.length);
      }
      const m = this.members[idx];
      out.push({ x: this.x + m.ox, z: this.z + m.oz });
      this.members.splice(idx, 1);
    }
    this.count = Math.max(0, this.count - n);
    this.sync('back');
    return out;
  }

  target(i: number): [number, number] {
    return this.mode === 'ring' ? ringSlots(this.ringInner)[i] : formationOffset(i);
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-dt * 7);
    const maxStep = dt * 9;
    for (let i = 0; i < this.members.length; i++) {
      const m = this.members[i];
      const [tx, tz] = this.target(i);
      if (this.mode === 'ring') {
        // วิ่งเข้าหาตำแหน่งด้วยความเร็วคงที่ (ดูเป็นการวิ่งจริง)
        const dx = tx - m.ox;
        const dz = tz - m.oz;
        const d = Math.hypot(dx, dz);
        if (d > maxStep) {
          m.ox += (dx / d) * maxStep;
          m.oz += (dz / d) * maxStep;
        } else {
          m.ox = tx;
          m.oz = tz;
        }
      } else {
        m.ox += (tx - m.ox) * k;
        m.oz += (tz - m.oz) * k;
      }
      if (m.s < 1) m.s = Math.min(1, m.s + dt * 3);
    }
  }

  /** เปลี่ยนจุดศูนย์กลางโดยตัวละครไม่ขยับในโลก */
  rebase(x: number, z: number): void {
    for (const m of this.members) {
      m.ox += this.x - x;
      m.oz += this.z - z;
    }
    this.x = x;
    this.z = z;
  }
}
