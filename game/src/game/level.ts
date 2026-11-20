import { BASE_FIRE_RATE, FIRE_RATE_SCALE, LANE_X, MAX_TIER, STAGES_PER_ERA, TIER_DAMAGE, TRACK_WIDTH } from '../config.ts';
import { eraIndexForLevel, eraOrdinal, levelInEra, timelineForLevel } from '../eras.ts';
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
  /** จุดเริ่มสเตจ 1–3 และเส้นชัย (เริ่มสเตจ 4 ทุ่งหอคอย) */
  stageD: number[];
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
/** จำนวนแถวหอคอยในทุ่งท้ายยุค */
export const TOWER_ROWS = 10;
/** ฝูงอ้างอิงที่ใช้ตั้งเลือดหอคอย */
const MAX_SQUAD_REF = 20;

export function generateLevel(level: number, player: PlayerStats): LevelData {
  const rng = makeRng(level * 7919 + 101);
  const era = eraIndexForLevel(level);
  const eraOrd = eraOrdinal(level);
  const inEra = levelInEra(level);
  const timeline = timelineForLevel(level);
  const relief = 1 - 0.12 * Math.min(3, player.failStreak);
  // ความยากเพิ่มทุกสเตจต่อเนื่อง (ยุค N สเตจ s)
  const hardAt = (stage: number) => 1 + ((level - 1) * 3 + stage) * 0.5;
  let hard = hardAt(0);
  // ค่าอ้างอิงตามด่านเป็นหลัก ผสมค่าจริงของผู้เล่นเล็กน้อย
  const dmgRefOf = (h: number) => Math.pow(Math.pow(1.1, h - 1), 0.65) * Math.pow(player.power, 0.35);
  let dmgRef = dmgRefOf(hard);
  const capRef = Math.min(player.capacity, 6 + hard * 1.5);
  let troops = Math.min(capRef, Math.pow(1 + hard * 0.3, 0.6) * Math.pow(player.startTroops, 0.4));
  let bonusUnits = 0;
  let rateMul = 1;
  let powMul = 1;
  const dps = () => (troops + bonusUnits) * BASE_FIRE_RATE * rateMul * dmgRef * powMul;
  const hpOf = (k: number) => Math.max(2, Math.round(dps() * k * relief));
  const items: Item[] = [];
  const stageD: number[] = [];
  let d = 22;
  let last = '';
  for (let stage = 0; stage < STAGES_PER_ERA - 1; stage++) {
    hard = hardAt(stage);
    dmgRef = dmgRefOf(hard);
    stageD.push(d - 10);
    const weights: [string, number][] = [
      ['block', 3],
      ['recruit', 2],
      ['stat', 1.4],
      ['enemies', level >= 2 || stage >= 1 ? 1.2 : 0],
    ];
    const nSections = Math.min(7, 4 + Math.floor(hard / 3));
    // เลือกชนิดแต่ละแถวก่อน แล้วบังคับ: ทุกสเตจมีแท่นทหารอย่างน้อย 1 แท่น
    // และแถวสุดท้ายของสเตจ 3 เป็นแท่นทหารเสมอ (ทหารเข้าฝูงตอนเริ่มสเตจ 4)
    const types: string[] = [];
    for (let i = 0; i < nSections; i++) {
      let type: string;
      if (stage === 0 && i === 0) type = 'stat';
      else if (stage === 0 && i === 1) type = 'recruit';
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
      types.push(type);
      last = type;
    }
    if (stage === STAGES_PER_ERA - 2) {
      types[nSections - 1] = 'recruit';
      if (types[nSections - 2] === 'recruit') types[nSections - 2] = 'block';
    }
    if (!types.includes('recruit')) {
      const slots: number[] = [];
      for (let j = 1; j < nSections - 1; j++) if (types[j - 1] !== 'recruit' && types[j + 1] !== 'recruit') slots.push(j);
      types[slots.length ? pick(rng, slots) : 1] = 'recruit';
    }
    for (let i = 0; i < nSections; i++) {
      const type = types[i];
      switch (type) {
        case 'block': {
          // หุ่นไล่กายิงไม่แตก (เติมหลอดซ้าย) ชนแล้วหุ่นหาย ทหารไม่ตาย
          // 1 ก้อนต่อแถว
          items.push({ type: 'block', d, x: pick(rng, LANES), hp: 1, coins: 0 });
          break;
        }
        case 'stat': {
          const side = rng() < 0.5 ? -1 : 1;
          const kinds: StatKind[] = ['rate', 'range'];
          const kind = pick(rng, kinds);
          // ค่าเริ่ม: ส่วนใหญ่ติดลบ (ต้องยิงให้เป็นบวก) บางป้ายเริ่มบวก; สุ่มว่ามีแผงไม้ปิดหรือไม่
          const startVal = () => (rng() < 0.3 ? Math.round(10 + rng() * 30) : -Math.min(60, Math.round(8 + rng() * 15 + hard * 1.5)));
          const barrier = () => (rng() < 0.5 ? hpOf(0.45) : 0);
          items.push({ type: 'stat', d, x: side * 2.5, kind, value: startVal(), barrier: barrier() });
          if (rng() < 0.6) {
            const k2 = kinds.find((k) => k !== kind)!;
            items.push({ type: 'stat', d, x: -side * 2.5, kind: k2, value: startVal(), barrier: barrier() });
          } else {
            items.push({ type: 'block', d, x: -side * LANE_X, hp: 1, coins: 0 });
          }
          if (kind === 'rate') rateMul *= 1.1;
          break;
        }
        case 'recruit': {
          const side = rng() < 0.5 ? -1 : 1;
          const collectW = TRACK_WIDTH * (rng() < 0.5 ? 0.5 : 0.62);
          items.push({
            type: 'recruit',
            d,
            x: side * (LANE_X - 0.3),
            capsules: 1,
            capsuleHp: hpOf(0.55),
            levelHp: hpOf(0.8),
            maxLevel: MAX_TIER,
            collectD: d + 12,
            collectX: side * (TRACK_WIDTH / 2 - collectW / 2),
            collectW,
          });
          troops = Math.min(capRef, troops + 1.2);
          // ทหารระดับ 2 โดยเฉลี่ย
          bonusUnits += 1.2 * (TIER_DAMAGE[1] - 1) * 0.6;
          break;
        }
        case 'enemies': {
          // ศัตรูยืนปาอาวุธ (โดนแล้วตาย 1 ตัว) ชนแล้วไม่ตาย
          const count = Math.min(5, 2 + Math.floor(rng() * 2) + Math.floor(hard / 6));
          const hp = Math.max(1, Math.round(dmgRef * powMul * 2 * FIRE_RATE_SCALE * relief));
          items.push({ type: 'enemies', d, x: (rng() - 0.5) * 3, count, hp });
          troops = Math.max(1, troops - count * 0.2);
          break;
        }
      }
      // กองเงินระหว่างช่วง (ต้องเดินเก็บ)
      if (rng() < 0.5) {
        items.push({ type: 'cash', d: d + 11, x: pick(rng, LANES), value: Math.round(4 + hard * 2) });
      }
      d += 22 + rng() * 6;
    }
    d += 6;
  }
  const finishD = d + 2;
  stageD.push(finishD);
  // สเตจ 4 ทุ่งหอคอย: แถวละ 3 หอ เลือดเพิ่มตามระยะทาง ผ่านยุค = ไปถึงแถวสุดท้าย
  hard = hardAt(STAGES_PER_ERA - 1);
  // หอคอยแข็งขึ้นทุกยุค (ไม่ผสมค่าผู้เล่น: อัปเกรดช่วยได้จริง)
  dmgRef = Math.pow(1.4, eraOrd);
  const towerTroops = Math.min(MAX_SQUAD_REF, 5 + hard * 1.4);
  const towerDps = towerTroops * BASE_FIRE_RATE * dmgRef * 1.6;
  // ยุคแรกเบากว่า แล้วค่อยๆ แข็งขึ้น (ชดเชยแท่นทหารที่มีทุกสเตจ)
  const towerK = Math.min(0.85, 0.5 + 0.07 * eraOrd);
  let cd = finishD + 8;
  for (let k = 0; k < TOWER_ROWS; k++) {
    for (const x of LANES) {
      items.push({
        type: 'crystal',
        d: cd,
        x,
        hp: Math.max(2, Math.round(towerDps * towerK * Math.pow(1.22, k) * (0.85 + rng() * 0.3) * relief)),
        coins: Math.round((3 + hard * 0.8) * Math.pow(1.15, k)),
        tier: Math.min(13, Math.round((k * 13) / (TOWER_ROWS - 1))),
        star: k >= 2 && rng() < 0.18,
      });
    }
    cd += 5.5;
  }
  const endD = cd + 2;
  const eraBoss = false;
  const bossHp = 0;
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
    stageD,
    enemyHp: Math.max(1, Math.round(dmgRef * 2)),
  };
}
