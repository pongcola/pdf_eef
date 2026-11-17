import { BASE_FIRE_RATE, FIRE_RATE_SCALE, LANE_X, MAX_TIER, TIER_DAMAGE, TRACK_WIDTH } from '../config.ts';
import { eraIndexForLevel, eraOrdinal, isEraBossLevel, levelInEra, timelineForLevel } from '../eras.ts';
import { makeRng, pick } from '../rng.ts';

export type ObstacleKind = 'saw' | 'wall' | 'hammer' | 'spinner' | 'fire';
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
  /** เลือดแผงไม้กั้นด้านหน้า (0 = ไม่มี) */
  barrier: number;
}

/** กรงเชลย: ยิงแตกแล้วได้ทหารเพิ่ม */
export interface CageItem {
  type: 'cage';
  d: number;
  x: number;
  hp: number;
  prisoners: number;
  /** มูลค่าเงินที่หล่นทุกครั้ง (4 ครั้งระหว่างโดนยิง) */
  cash: number;
}

/** แท่นทหาร (Collect Area): ยิงแคปซูลให้แตก แล้ววิ่งผ่านแท่นเพื่อรับทหารระดับ tier */
export interface RecruitItem {
  type: 'recruit';
  d: number;
  x: number;
  capsules: number;
  capsuleHp: number;
  /** ดาเมจที่ต้องใช้อัปเลเวลแรก (เลเวลต่อไป ×1.6) */
  levelHp: number;
  maxLevel: number;
  /** Collect Area ข้างหน้า */
  collectD: number;
  collectX: number;
  collectW: number;
}

/** กองเงินบนถนน: วิ่งผ่านเพื่อเก็บ */
export interface CashItem {
  type: 'cash';
  d: number;
  x: number;
  value: number;
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
  /** แตกแล้วได้ดาว 1 ดวง */
  star: boolean;
}

export type Item = ObstacleSection | BlockItem | StatItem | CageItem | RecruitItem | EnemyItem | CrystalItem | CashItem;

export interface LevelData {
  /** เลขด่านรวม */
  level: number;
  timeline: number;
  /** ด่านที่เท่าไรในยุค (1–5) */
  inEra: number;
  /** ลำดับยุครวมทุกไทม์ไลน์ */
  eraOrd: number;
  /** ระดับความยากที่ใช้คำนวณ */
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

export function generateLevel(level: number, player: PlayerStats): LevelData {
  const rng = makeRng(level * 7919 + 101);
  const era = eraIndexForLevel(level);
  const eraOrd = eraOrdinal(level);
  const inEra = levelInEra(level);
  const timeline = timelineForLevel(level);
  const eraBoss = isEraBossLevel(level);
  const relief = 1 - 0.12 * Math.min(3, player.failStreak);
  // ทุกยุคเริ่มใหม่ (อัปเกรดรีเซ็ต) จึงให้ความยากไต่ตามด่านในยุค + ยุคละนิด
  const hard = inEra + eraOrd * 1.2;

  // ค่าอ้างอิง: ผสมระหว่าง "ค่ามาตรฐานของด่าน" กับ "ค่าจริงของผู้เล่น" (อัปเกรดช่วยได้ แต่ไม่ง่ายเกินไป)
  const dmgRef = Math.sqrt(Math.pow(1.08, hard - 1) * player.power);
  const capRef = Math.sqrt((8 + hard * 1.2) * player.capacity);
  let troops = Math.min(capRef, Math.sqrt((1 + inEra * 0.3) * player.startTroops));
  let bonusUnits = 0;
  let rateMul = 1;
  let powMul = 1;
  const tBreak = Math.min(1.4, 0.7 + hard * 0.04);
  const dps = () => (troops + bonusUnits) * BASE_FIRE_RATE * rateMul * dmgRef * powMul;
  const hpOf = (k: number) => Math.max(2, Math.round(dps() * k * relief));
  const blockCoins = (hp: number) => Math.max(1, Math.round(Math.sqrt(hp) * 0.5));

  const nSections = Math.min(18, 7 + Math.floor(hard / 2));
  const items: Item[] = [];
  let d = 22;
  let last = '';

  const weights: [string, number][] = [
    ['block', 3],
    ['cage', 2.2],
    ['stat', 1.6],
    ['recruit', hard >= 2 ? 1.3 : 0],
    ['enemies', hard >= 4 ? 1.4 : 0],
    ['hazard', hard >= 4.5 ? 0.9 : 0],
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
        const n = rng() < 0.6 || (hard <= 3 && i < 4) ? 1 : hard >= 8 && rng() < 0.15 ? 3 : 2;
        const lanes = [...LANES].sort(() => rng() - 0.5).slice(0, n);
        for (const x of lanes) {
          // ถ้าปิดครบ 3 เลน ก้อนจะอ่อนลง เพื่อให้ยิงทะลุได้
          const hp = hpOf(tBreak * (0.7 + rng() * 0.6) * (n === 3 ? 0.55 : 1));
          items.push({ type: 'block', d, x, hp, coins: blockCoins(hp) });
        }
        break;
      }
      case 'stat': {
        const side = rng() < 0.5 ? -1 : 1;
        const kinds: StatKind[] = ['rate', 'range', 'power'];
        const kind = pick(rng, kinds);
        // ค่าเริ่ม: ส่วนใหญ่ติดลบ (ต้องยิงให้เป็นบวก) บางป้ายเริ่มบวก
        const startVal = () => (rng() < 0.3 ? Math.round(10 + rng() * 30) : -Math.min(60, Math.round(8 + rng() * 15 + hard * 1.5)));
        const barrier = () => (i === 0 && hard <= 2 ? 0 : hpOf(0.45));
        items.push({ type: 'stat', d, x: side * 2.5, kind, value: startVal(), barrier: barrier() });
        const other = rng();
        if (other < 0.45 && !(hard <= 3 && i === 0)) {
          const hp = hpOf(tBreak);
          items.push({ type: 'block', d, x: -side * LANE_X, hp, coins: blockCoins(hp) });
        } else if (other < 0.8) {
          const k2 = pick(rng, kinds.filter((k) => k !== kind));
          items.push({ type: 'stat', d, x: -side * 2.5, kind: k2, value: startVal(), barrier: barrier() });
        }
        // ผู้เล่นทั่วไปยิงป้ายได้ราว +12%
        if (kind === 'rate') rateMul *= 1.12;
        else if (kind === 'power') powMul *= 1.12;
        break;
      }
      case 'cage': {
        const prisoners = Math.min(7, 1 + Math.floor(rng() * 2) + Math.floor(hard / 5));
        // กรงต้องยิงแตกได้ ไม่งั้นฝูงไม่โต
        items.push({ type: 'cage', d, x: pick(rng, LANES), hp: hpOf(tBreak * 0.75), prisoners, cash: Math.round(2 + hard * 0.8) });
        troops = Math.min(capRef, troops + prisoners * 0.45);
        break;
      }
      case 'recruit': {
        const side = rng() < 0.5 ? -1 : 1;
        // ยิงแท่นจนแถบเต็ม → Level +1 สูงสุด 10
        const maxLevel = MAX_TIER;
        const tier = Math.min(maxLevel, 2);
        const collectW = TRACK_WIDTH * (rng() < 0.5 ? 0.5 : 0.62);
        items.push({
          type: 'recruit',
          d,
          x: side * (LANE_X - 0.3),
          capsules: rng() < 0.35 ? 3 : 2,
          capsuleHp: hpOf(0.55),
          levelHp: hpOf(0.35),
          maxLevel,
          collectD: d + 12,
          collectX: side * (TRACK_WIDTH / 2 - collectW / 2),
          collectW,
        });
        troops = Math.min(capRef, troops + 0.7);
        // ทหารระดับสูงเพิ่มดาเมจเหมือนมีทหารเพิ่มหลายตัว (คิดแบบระมัดระวัง)
        bonusUnits += 0.7 * (TIER_DAMAGE[tier - 1] - 1) * 0.6;
        break;
      }
      case 'enemies': {
        // ศัตรูปาอาวุธใส่ (โดนแล้วตาย 1 ตัว) จึงมีน้อยกว่าเดิม
        const count = Math.min(6, 2 + Math.floor(rng() * 2) + Math.floor(hard / 5));
        const hp = Math.max(1, Math.round(dmgRef * powMul * 2 * FIRE_RATE_SCALE * relief));
        items.push({ type: 'enemies', d, x: (rng() - 0.5) * 3, count, hp });
        troops = Math.max(1, troops - count * 0.15);
        break;
      }
      case 'hazard': {
        const kind = pick(rng, ['saw', 'hammer', 'spinner', 'fire', 'fire'] as const);
        items.push({
          type: 'obstacle',
          d,
          kind,
          speed: (1.1 + rng() * 0.8) * (1 + Math.min(0.5, hard * 0.02)),
          phase: rng() * Math.PI * 2,
          param: kind === 'fire' ? pick(rng, LANES) : rng() < 0.5 ? -1 : 1,
          width: kind === 'fire' ? 3.2 : 0,
        });
        troops = Math.max(1, troops * 0.92);
        break;
      }
    }
    // กองเงินระหว่างช่วง
    if (i > 0 && rng() < 0.4) {
      items.push({ type: 'cash', d: d + 11, x: pick(rng, LANES), value: Math.round(3 + hard * 1.5) });
    }
    last = type;
    d += 22 + rng() * 6;
  }

  const finishD = d + 2;
  let endD: number;
  let bossHp = 0;
  if (eraBoss) {
    endD = finishD + 18;
    bossHp = Math.max(30, Math.round(dps() * Math.min(14, 5 + hard * 0.4) * relief));
  } else {
    // ทุ่งคริสตัล: แถวละ 3 ก้อน ยิ่งลึกยิ่งแข็งและยิ่งได้เหรียญเยอะ บางก้อนมีดาว
    let cd = finishD + 8;
    for (let k = 0; k < 14; k++) {
      for (const x of LANES) {
        items.push({
          type: 'crystal',
          d: cd,
          x,
          hp: Math.max(2, Math.round(dps() * 0.3 * Math.pow(1.45, k))),
          coins: Math.round((3 + hard * 0.8) * Math.pow(1.32, k)),
          tier: k,
          star: k >= 2 && rng() < 0.22,
        });
      }
      cd += 5.5;
    }
    endD = cd + 6;
  }

  return {
    level,
    timeline,
    inEra,
    eraOrd,
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
