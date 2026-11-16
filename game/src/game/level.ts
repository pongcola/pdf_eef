import { makeRng, pick } from '../rng.ts';
import { refPower } from '../economy.ts';
import { eraIndexForLevel, isEraBossLevel } from '../eras.ts';

export type GateKind = 'add' | 'sub' | 'mul' | 'div';
export interface GateOp {
  kind: GateKind;
  v: number;
}

export type ObstacleKind = 'saw' | 'wall' | 'hammer' | 'spinner';

export interface GateSection {
  type: 'gates';
  d: number;
  left: GateOp;
  right: GateOp;
}

export interface ObstacleSection {
  type: 'obstacle';
  d: number;
  kind: ObstacleKind;
  speed: number;
  phase: number;
  /** wall: ตำแหน่งกลางของกำแพง, spinner: ทิศหมุน */
  param: number;
  /** wall: ความกว้างกำแพง */
  width: number;
}

export interface EnemySection {
  type: 'enemy';
  d: number;
  count: number;
}

export type Section = GateSection | ObstacleSection | EnemySection;

export interface LevelData {
  level: number;
  era: number;
  eraBoss: boolean;
  sections: Section[];
  bossD: number;
  bossHp: number;
  enemyPower: number;
  /** ขนาดฝูงที่ระบบคาดว่าผู้เล่นจะมีตอนถึงบอส (ใช้ปรับสมดุล) */
  expectedAtBoss: number;
}

export const SECTION_GAP = 30;

export function applyGate(op: GateOp, n: number): number {
  switch (op.kind) {
    case 'add':
      return n + op.v;
    case 'sub':
      return Math.max(0, n - op.v);
    case 'mul':
      return n * op.v;
    case 'div':
      return n <= 0 ? 0 : Math.max(1, Math.ceil(n / op.v));
  }
}

export function isGoodGate(op: GateOp): boolean {
  return op.kind === 'add' || op.kind === 'mul';
}

export function gateLabel(op: GateOp): string {
  const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[op.kind];
  return `${sym}${op.v}`;
}

function nice(n: number): number {
  if (n < 20) return Math.max(1, Math.round(n));
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

function goodOp(rng: () => number, e: number, level: number, prefer?: 'add' | 'mul'): GateOp {
  const useMul = prefer ? prefer === 'mul' : rng() < 0.4;
  if (useMul) return { kind: 'mul', v: level >= 3 && rng() < 0.25 ? 3 : 2 };
  return { kind: 'add', v: nice(Math.max(4, e * (0.5 + rng() * 0.8))) };
}

function badOp(rng: () => number, e: number, prefer?: 'sub' | 'div'): GateOp {
  const useDiv = prefer ? prefer === 'div' : rng() < 0.35 && e >= 8;
  if (useDiv) return { kind: 'div', v: 2 };
  return { kind: 'sub', v: nice(Math.max(2, e * (0.25 + rng() * 0.35))) };
}

function makeGatePair(rng: () => number, e: number, level: number): [GateOp, GateOp] {
  const r = rng();
  let a: GateOp;
  let b: GateOp;
  if (r < 0.4 || level < 2) {
    a = goodOp(rng, e, level);
    b = badOp(rng, e);
  } else if (r < 0.92 || level < 6) {
    a = goodOp(rng, e, level, 'add');
    b = goodOp(rng, e, level, 'mul');
  } else {
    // เลือกทางที่เสียน้อยกว่า
    a = badOp(rng, e, 'sub');
    b = badOp(rng, e, 'div');
  }
  return rng() < 0.5 ? [a, b] : [b, a];
}

export function obstacleKindsFor(level: number): ObstacleKind[] {
  const kinds: ObstacleKind[] = [];
  if (level >= 2) kinds.push('saw', 'wall');
  if (level >= 4) kinds.push('hammer');
  if (level >= 6) kinds.push('spinner');
  return kinds;
}

/**
 * ความยากของบอส = จำนวนวินาทีที่ฝูง "ขนาดที่คาดไว้" ต้องตีเต็มแรงถึงจะชนะ
 * ค่ายิ่งมาก ยิ่งต้องเหลือคนมากถึงจะชนะ
 */
export function bossSeconds(level: number, eraBoss: boolean): number {
  return Math.min(7, 2.2 + (level - 1) * 0.18) * (eraBoss ? 1.15 : 1);
}

export interface PlayerStats {
  startCrowd: number;
  power: number;
  failStreak: number;
}

export function generateLevel(level: number, player: PlayerStats): LevelData {
  const rng = makeRng(level * 9973 + 1337);
  const era = eraIndexForLevel(level);
  const eraBoss = isEraBossLevel(level);
  // ความยากปรับตามผู้เล่นครึ่งหนึ่ง: อัปเกรดยังช่วยได้จริง แต่เกมไม่ง่ายเกินไป
  const power = Math.sqrt(refPower(level) * player.power);
  const refStart = 6 + (level - 1);
  const nSections = Math.min(16, 7 + Math.floor(level / 2));
  const obstacleKinds = obstacleKindsFor(level);

  let e = Math.sqrt(refStart * player.startCrowd);
  let d = 30;
  let last: Section['type'] | '' = '';
  const sections: Section[] = [];

  for (let i = 0; i < nSections; i++) {
    let type: Section['type'] = 'gates';
    // ประตูอย่างน้อยทุกๆ 2 ช่วง ฝูงจะได้โตต่อเนื่อง
    if (i >= 2 && last === 'gates' && rng() < 0.65) {
      type = obstacleKinds.length && rng() < 0.45 ? 'obstacle' : 'enemy';
    }

    if (type === 'gates') {
      const [left, right] = makeGatePair(rng, e, level);
      sections.push({ type, d, left, right });
      // ผู้เล่นทั่วไปเลือกถูกเกือบทุกครั้ง แต่เผื่อพลาดไว้นิดหน่อย
      e = Math.max(applyGate(left, e), applyGate(right, e)) * 0.92;
    } else if (type === 'obstacle') {
      const kind = pick(rng, obstacleKinds);
      const speedScale = 1 + Math.min(0.6, level * 0.015);
      sections.push({
        type,
        d,
        kind,
        speed: (1.2 + rng() * 0.9) * speedScale,
        phase: rng() * Math.PI * 2,
        param: kind === 'wall' ? (rng() * 2 - 1) * 2.4 : rng() < 0.5 ? -1 : 1,
        width: kind === 'wall' ? Math.min(4.2, 2.4 + level * 0.04) : 0,
      });
      e *= 0.85;
    } else {
      const count = Math.max(3, Math.round(e * (0.18 + rng() * 0.22)));
      sections.push({ type, d, count });
      e = Math.max(4, e - count);
    }
    last = type;
    d += SECTION_GAP;
  }

  const bossD = d + 4;
  // แพ้ติดกันหลายครั้ง บอสจะอ่อนลงเล็กน้อย
  const relief = 1 - 0.12 * Math.min(3, player.failStreak);
  const bossHp = Math.max(20, Math.round(bossSeconds(level, eraBoss) * e * power * relief));

  return { level, era, eraBoss, sections, bossD, bossHp, enemyPower: power, expectedAtBoss: e };
}
