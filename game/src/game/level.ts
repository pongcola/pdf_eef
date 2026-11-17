import { BASE_FIRE_RATE, ELITE_DAMAGE, LANE_X, LEVELS_PER_CYCLE } from '../config.ts';
import { eraIndexForLevel, isEraBossLevel } from '../eras.ts';
import { makeRng, pick } from '../rng.ts';

export type ObstacleKind = 'saw' | 'wall' | 'hammer' | 'spinner';
export type StatKind = 'rate' | 'range' | 'power';

/** กับดักที่ทำลายไม่ได้ (ใบเลื่อย ค้อน คานหมุน) */
export interface ObstacleSection {
  type: 'obstacle';
  d: number;
  kind: ObstacleKind;
  speed: number;
  phase: number;
  param: number;
  width: number;
}

/** สิ่งกีดขวางที่มีเลือด ยิงให้แตกได้ ชนแล้วทหารตาย */
export interface BlockItem {
  type: 'block';
  d: number;
  x: number;
  hp: number;
  coins: number;
}

/** ป้ายค่าพลัง: ยิงเพื่อเพิ่มค่า แล้ววิ่งผ่านเพื่อรับ */
export interface StatItem {
  type: 'stat';
  d: number;
  x: number;
  kind: StatKind;
  value: number;
}

/** กรงเชลย: ยิงแตกแล้วได้ทหารเพิ่ม */
export interface CageItem {
  type: 'cage';
  d: number;
  x: number;
  hp: number;
  prisoners: number;
}

/** แท่นทหารพิเศษ: ยิงแคปซูลให้แตก แล้ววิ่งผ่านแท่นเพื่อรับ */
export interface RecruitItem {
  type: 'recruit';
  d: number;
  x: number;
  capsules: number;
  capsuleHp: number;
}

/** ทหารศัตรู: วิ่งเข้ามาชน (ชนแล้วตายทั้งคู่) */
export interface EnemyItem {
  type: 'enemies';
  d: number;
  x: number;
  count: number;
  hp: number;
}

/** คริสตัลในทุ่งสมบัติท้ายด่าน */
export interface CrystalItem {
  type: 'crystal';
  d: number;
  x: number;
  hp: number;
  coins: number;
  tier: number;
}

export type Item = ObstacleSection | BlockItem | StatItem | CageItem | RecruitItem | EnemyItem | CrystalItem;

export interface LevelData {
  level: number;
  cycle: number;
  /** ระดับความยากจริง (รวมรอบ) */
  hard: number;
  era: number;
  eraBoss: boolean;
  items: Item[];
  finishD: number;
  /** ตำแหน่งบอส (ด่านบอส) หรือประตูปราสาทท้ายทุ่งสมบัติ */
  endD: number;
  bossHp: number;
  /** ดาเมจต่อนัดของศัตรู = ใช้คำนวณเลือดบอสแสดงผล */
  enemyHp: number;
}

export interface PlayerStats {
  startTroops: number;
  capacity: number;
  power: number;
  failStreak: number;
}

export const STAT_LABEL: Record<StatKind, string> = {
  rate: 'อัตรายิง',
  range: 'ระยะยิง',
  power: 'พลังยิง',
};

const LANES = [-LANE_X, 0, LANE_X];

export function generateLevel(level: number, cycle: number, player: PlayerStats): LevelData {
  const hard = level + (cycle - 1) * LEVELS_PER_CYCLE;
  const rng = makeRng(hard * 7919 + 101);
  const era = eraIndexForLevel(level);
  const eraBoss = isEraBossLevel(level);
  const relief = 1 - 0.12 * Math.min(3, player.failStreak);

  // ค่าอ้างอิง: ผสมระหว่าง "ค่ามาตรฐานของด่าน" กับ "ค่าจริงของผู้เล่น" (อัปเกรดช่วยได้ แต่ไม่ง่ายเกินไป)
  // รอบใหม่ค่อยๆ ยากขึ้นภายใน 10 ด่านแรก (เริ่มรอบด้วยทหาร 1 ตัว แต่พลังที่อัปเกรดไว้ยังอยู่)
  const ramp = level + (cycle - 1) * LEVELS_PER_CYCLE * Math.min(1, level / 10);
  const dmgRef = Math.sqrt(Math.pow(1.08, ramp - 1) * player.power);
  const capRef = Math.sqrt((8 + ramp * 1.2) * player.capacity);
  // ใช้ด่านในรอบ (ไม่ใช่ระดับรวม) เพื่อให้รอบใหม่ที่เริ่มด้วยทหาร 1 ตัวยังเล่นได้
  let troops = Math.min(capRef, Math.sqrt((1 + level * 0.25) * player.startTroops));
  let elites = 0;
  let rateMul = 1;
  let powMul = 1;
  // เวลาที่ใช้ยิงทำลาย: ไล่ตามด่านในรอบ (ต้นรอบใหม่ยังเริ่มง่าย) + รอบละนิด
  const tBreak = Math.min(1.4, 0.7 + level * 0.025 + (cycle - 1) * 0.12);
  const dps = () => (troops - elites + elites * ELITE_DAMAGE) * BASE_FIRE_RATE * rateMul * dmgRef * powMul;
  const hpOf = (k: number) => Math.max(2, Math.round(dps() * k * relief));

  // จำนวน/ชนิดของสิ่งต่างๆ ไล่ตามด่านในรอบ ส่วนความแข็ง (เลือด/พลัง) ใช้ระดับรวม
  const cy = cycle - 1;
  const nSections = Math.min(18, 7 + Math.floor(level / 3) + cy * 2);
  const items: Item[] = [];
  let d = 22;
  let last = '';

  const weights: [string, number][] = [
    ['block', 3],
    ['cage', 2.2],
    ['stat', 1.6],
    ['recruit', level >= 2 ? 1.2 : 0],
    ['enemies', level >= 3 ? 1.6 : 0],
    ['hazard', level >= 5 ? 0.9 : 0],
  ];

  for (let i = 0; i < nSections; i++) {
    let type: string;
    if (i === 0) type = 'stat';
    else if (i === 1) type = 'cage';
    else {
      do {
        const total = weights.reduce((a, w) => a + w[1], 0);
        let r = rng() * total;
        type = weights[0][0];
        for (const [k, w] of weights) {
          if (r < w) {
            type = k;
            break;
          }
          r -= w;
        }
      } while (type === last && type !== 'block');
    }

    switch (type) {
      case 'block': {
        const n = rng() < 0.6 || (level <= 3 && i < 4) ? 1 : level >= 8 && rng() < 0.15 ? 3 : 2;
        const lanes = [...LANES].sort(() => rng() - 0.5).slice(0, n);
        for (const x of lanes) {
          // ถ้าปิดครบ 3 เลน ก้อนจะอ่อนลง เพื่อให้ยิงทะลุได้
          const hp = hpOf(tBreak * (0.7 + rng() * 0.6) * (n === 3 ? 0.55 : 1));
          items.push({ type: 'block', d, x, hp, coins: Math.max(1, Math.round(Math.sqrt(hp) * 0.5)) });
        }
        break;
      }
      case 'stat': {
        const side = rng() < 0.5 ? -1 : 1;
        const kinds: StatKind[] = ['rate', 'range', 'power'];
        const kind = pick(rng, kinds);
        const value = -Math.min(40, Math.round(2 + rng() * 5 + (level + cy * 8) * 0.5));
        items.push({ type: 'stat', d, x: side * 2.5, kind, value });
        const other = rng();
        if (other < 0.45 && !(level <= 3 && i === 0)) {
          const hp = hpOf(tBreak);
          items.push({ type: 'block', d, x: -side * LANE_X, hp, coins: Math.max(1, Math.round(Math.sqrt(hp) * 0.5)) });
        } else if (other < 0.8) {
          const k2 = pick(rng, kinds.filter((k) => k !== kind));
          items.push({ type: 'stat', d, x: -side * 2.5, kind: k2, value: -Math.min(40, Math.round(3 + rng() * 6 + (level + cy * 8) * 0.5)) });
        }
        // ผู้เล่นทั่วไปยิงป้ายได้ราว +12%
        if (kind === 'rate') rateMul *= 1.12;
        else if (kind === 'power') powMul *= 1.12;
        break;
      }
      case 'cage': {
        const prisoners = Math.min(7, 1 + Math.floor(rng() * 2) + Math.floor(level / 6) + cy);
        // กรงต้องยิงแตกได้ ไม่งั้นฝูงไม่โต
        items.push({ type: 'cage', d, x: pick(rng, LANES), hp: hpOf(tBreak * 0.75), prisoners });
        troops = Math.min(capRef, troops + prisoners * 0.45);
        break;
      }
      case 'recruit': {
        const side = rng() < 0.5 ? -1 : 1;
        items.push({ type: 'recruit', d, x: side * LANE_X, capsules: 2, capsuleHp: hpOf(0.4) });
        troops = Math.min(capRef, troops + 0.7);
        elites = Math.min(troops, elites + 0.7);
        break;
      }
      case 'enemies': {
        const count = Math.min(12, 2 + Math.floor(rng() * 3) + Math.floor(level / 5) + cy);
        const hp = Math.max(1, Math.round(dmgRef * powMul * 2 * relief));
        items.push({ type: 'enemies', d, x: (rng() - 0.5) * 3, count, hp });
        troops = Math.max(1, troops - count * 0.15);
        break;
      }
      case 'hazard': {
        const kind = pick(rng, ['saw', 'hammer', 'spinner'] as const);
        items.push({
          type: 'obstacle',
          d,
          kind,
          speed: (1.1 + rng() * 0.8) * (1 + Math.min(0.5, (level + cy * 10) * 0.01)),
          phase: rng() * Math.PI * 2,
          param: rng() < 0.5 ? -1 : 1,
          width: 0,
        });
        troops = Math.max(1, troops * 0.92);
        break;
      }
    }
    last = type;
    d += 22 + rng() * 6;
  }

  const finishD = d + 2;
  let endD: number;
  let bossHp = 0;
  if (eraBoss) {
    endD = finishD + 18;
    bossHp = Math.max(30, Math.round(dps() * Math.min(14, 5 + level * 0.22 + cy * 1.5) * relief));
  } else {
    // ทุ่งสมบัติ: คริสตัลแถวละ 3 ก้อน ยิ่งลึกยิ่งแข็งและยิ่งได้เหรียญเยอะ
    let cd = finishD + 8;
    for (let k = 0; k < 14; k++) {
      for (const x of LANES) {
        items.push({
          type: 'crystal',
          d: cd,
          x,
          hp: Math.max(2, Math.round(dps() * 0.3 * Math.pow(1.45, k))),
          coins: Math.round((3 + hard * 0.6) * Math.pow(1.32, k)),
          tier: k,
        });
      }
      cd += 5.5;
    }
    endD = cd + 6;
  }

  return {
    level,
    cycle,
    hard,
    era,
    eraBoss,
    items,
    finishD,
    endD,
    bossHp,
    enemyHp: Math.max(1, Math.round(dmgRef * 2)),
  };
}
