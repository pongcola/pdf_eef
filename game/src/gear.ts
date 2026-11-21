// ระบบอุปกรณ์ (Item): ตัวเลขทั้งหมด + กติกา ตีบวก รูน เหมือง สุ่ม แยกชิ้น และคำนวณ stat
// ไม่ผูกกับ 3D/UI — ทุกฟังก์ชันรับ rng เข้ามา ทดสอบ/จำลองได้
// ของทั้งหมดเป็นของถาวร ไม่รีเซ็ตตอนขึ้นยุคใหม่ (แผนเต็ม: docs/item-system-plan.md)

export type Rng = () => number;

// ---------- ชนิดข้อมูล ----------

/** ช่องอุปกรณ์ตามลำดับ: หมวก ชุด รองเท้า เกราะ ถุงมือ อาวุธ */
export const SLOTS = ['helmet', 'suit', 'boots', 'armor', 'gloves', 'weapon'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAME: Record<Slot, string> = {
  helmet: 'หมวก', suit: 'ชุด', boots: 'รองเท้า', armor: 'เกราะ', gloves: 'ถุงมือ', weapon: 'อาวุธ',
};

/** Class: 0 Silver, 1 Gold, 2 Platinum, 3 Legendary */
export const CLASSES = ['Silver', 'Gold', 'Platinum', 'Legendary'] as const;
export type Cls = 0 | 1 | 2 | 3;
export const CLASS_COLOR = ['#b7c0cc', '#f2b632', '#9b8cff', '#ff6a3d'];

export const STATS = ['critRate', 'critDmg', 'dmg', 'rate', 'range'] as const;
export type Stat = (typeof STATS)[number];
export const STAT_NAME: Record<Stat, string> = {
  critRate: 'Crit Rate', critDmg: 'Crit Dmg', dmg: 'Dmg', rate: 'Attack Rate', range: 'Attack Range',
};
export const STAT_TH: Record<Stat, string> = {
  critRate: 'โอกาสคริ', critDmg: 'ดาเมจคริ', dmg: 'ดาเมจ', rate: 'อัตรายิง', range: 'ระยะยิง',
};

/** Tier รูน: 0 B, 1 A, 2 S, 3 SR */
export const TIERS = ['B', 'A', 'S', 'SR'] as const;
export type Tier = 0 | 1 | 2 | 3;
export const TIER_COLOR = ['#9aa1ad', '#4b8fff', '#a259ff', '#ffb02e'];

export interface GearItem {
  id: string;
  slot: number; // index ใน SLOTS
  cls: Cls;
  plus: number; // 0–6
  /** จำนวนครั้งที่พลาด แยกตามขั้นเป้าหมาย index 0–6 (ใช้จริงแค่ 5, 6) */
  pity: number[];
  /** id รูนที่ใส่ ('' = ไม่มี) */
  rune: string;
}

export interface Rune {
  id: string;
  stat: Stat;
  tier: Tier;
  /** id อุปกรณ์ที่ใส่อยู่ ('' = อยู่ในกระเป๋า) */
  on: string;
}

export interface GearState {
  tokens: number;
  pickaxes: number;
  bombs: number;
  stones: number;
  /** จำนวนครั้งที่สุ่มตั้งแต่ได้ Legendary ล่าสุด */
  gachaPity: number;
  nextId: number;
  items: GearItem[];
  runes: Rune[];
  /** 6 ช่องตามลำดับ SLOTS ('' = ว่าง) */
  equipped: string[];
}

export function defaultGear(): GearState {
  return { tokens: 0, pickaxes: 0, bombs: 0, stones: 0, gachaPity: 0, nextId: 1, items: [], runes: [], equipped: ['', '', '', '', '', ''] };
}

/** เติมค่าที่ขาด (เซฟเก่า / ข้อมูลเสีย) */
export function normalizeGear(g: Partial<GearState> | undefined): GearState {
  const d = defaultGear();
  if (!g || typeof g !== 'object') return d;
  const num = (v: unknown, def: number) => (typeof v === 'number' && Number.isFinite(v) ? v : def);
  const items = Array.isArray(g.items)
    ? g.items
        .filter((it) => it && typeof it.id === 'string')
        .map((it) => ({
          id: it.id,
          slot: Math.max(0, Math.min(5, num(it.slot, 0))),
          cls: Math.max(0, Math.min(3, num(it.cls, 0))) as Cls,
          plus: Math.max(0, Math.min(MAX_PLUS, num(it.plus, 0))),
          pity: Array.from({ length: MAX_PLUS + 1 }, (_, i) => num(it.pity?.[i], 0)),
          rune: typeof it.rune === 'string' ? it.rune : '',
        }))
    : [];
  const runes = Array.isArray(g.runes)
    ? g.runes
        .filter((r) => r && typeof r.id === 'string' && (STATS as readonly string[]).includes(r.stat))
        .map((r) => ({ id: r.id, stat: r.stat, tier: Math.max(0, Math.min(3, num(r.tier, 0))) as Tier, on: typeof r.on === 'string' ? r.on : '' }))
    : [];
  const equipped = d.equipped.map((_, i) => {
    const id = g.equipped?.[i];
    return typeof id === 'string' && items.some((it) => it.id === id && it.slot === i) ? id : '';
  });
  return {
    tokens: num(g.tokens, 0),
    pickaxes: num(g.pickaxes, 0),
    bombs: num(g.bombs, 0),
    stones: num(g.stones, 0),
    gachaPity: num(g.gachaPity, 0),
    nextId: num(g.nextId, items.length + runes.length + 1),
    items,
    runes,
    equipped,
  };
}

// ---------- ตัวเลขทั้งหมด (ปรับตรงนี้) ----------

/** stat 2 ตัวของแต่ละช่อง (ตามลำดับ SLOTS) */
export const SLOT_STATS: readonly (readonly [Stat, Stat])[] = [
  ['range', 'rate'], // หมวก
  ['rate', 'critRate'], // ชุด
  ['critRate', 'range'], // รองเท้า
  ['dmg', 'rate'], // เกราะ
  ['critRate', 'critDmg'], // ถุงมือ
  ['dmg', 'critRate'], // อาวุธ
];

/** ค่า stat ต่อชิ้นที่ +0 (%) [Silver, Gold, Platinum, Legendary] */
export const ITEM_STAT: Record<Stat, readonly number[]> = {
  critRate: [2, 3, 4.5, 6],
  critDmg: [8, 12, 18, 25],
  dmg: [5, 8, 12, 16],
  rate: [3, 4.5, 6.5, 9],
  range: [4, 6, 9, 12],
};

/** ค่าพื้นฐานและเพดาน (%) */
export const BASE_STAT: Record<Stat, number> = { critRate: 5, critDmg: 150, dmg: 0, rate: 0, range: 0 };
export const STAT_CAP: Partial<Record<Stat, number>> = { critRate: 100, range: 100 };

// ตีบวก
export const MAX_PLUS = 6;
export const ENHANCE_COST = 3; // หินต่อครั้ง
/** โอกาสพื้นฐานตีไปขั้น index (1–6) */
export const ENHANCE_RATE = [0, 0.8, 0.7, 0.5, 0.4, 0.2, 0.1];
/** Pity ต่อครั้งที่พลาด (0 = ไม่มี pity) */
export const ENHANCE_PITY = [0, 0, 0, 0, 0, 0.1, 0.05];
/** พลาดแล้วตกระดับไหม (ตกลง 1 ระดับจากระดับปัจจุบัน) */
export const ENHANCE_DROP = [false, false, false, false, false, true, true];
/** ตัวคูณ stat ตามระดับ +0 ถึง +6 */
export const PLUS_MULT = [1, 1.05, 1.1, 1.18, 1.28, 1.4, 1.55];

/** ค่ารูน (%) [B, A, S, SR] */
export const RUNE_STAT: Record<Stat, readonly number[]> = {
  critRate: [2, 4, 7, 12],
  critDmg: [5, 10, 18, 30],
  dmg: [3, 6, 10, 16],
  rate: [3, 5, 9, 15],
  range: [5, 8, 12, 20],
};
export const RUNE_TIER_RATE = [0.6, 0.28, 0.1, 0.02];

/**
 * ของดรอปตอนผ่านสเตจ — เพิ่มเรทจากแผนเดิม (Pickaxe 30%, Bomb 10%, Token 5–15/50,
 * ขุดได้หิน 50%, ระเบิดได้รูน 30%) เพื่อให้หาของเร็วขึ้น
 */
export const DROP = {
  pickaxe: 0.7,
  bomb: 0.2,
  /** Token ผ่านสเตจ 1–3 (min, max) */
  tokenRun: [20, 30] as const,
  /** Token ผ่านทุ่งหอคอย (ผ่านยุค) */
  tokenTower: 150,
  /** ใช้ Pickaxe: โอกาสได้หิน และจำนวน (min, max) */
  mineChance: 0.8,
  mineStones: [1, 3] as const,
  /** ใช้ Bomb: โอกาสได้รูน */
  bombRune: 0.5,
};

// สุ่มอุปกรณ์
export const PULL_COST_1 = 100;
export const PULL_COST_10 = 900;
export const PULL_RATE = [0.6, 0.3, 0.085, 0.015];
/** สุ่มครั้งที่เท่านี้นับจาก Legendary ล่าสุด = การันตี Legendary */
export const LEGENDARY_PITY = 80;
/** แยกชิ้นได้ Token ตาม class */
export const SALVAGE = [5, 15, 50, 200];

// ---------- stat ----------

export type Stats = Record<Stat, number>;

function zeroStats(): Stats {
  return { critRate: 0, critDmg: 0, dmg: 0, rate: 0, range: 0 };
}

/** stat ของอุปกรณ์ 1 ชิ้น (ไม่รวมรูน) */
export function itemStats(it: Pick<GearItem, 'slot' | 'cls' | 'plus'>): Stats {
  const s = zeroStats();
  for (const st of SLOT_STATS[it.slot]) s[st] += ITEM_STAT[st][it.cls] * PLUS_MULT[it.plus];
  return s;
}

export function runeValue(r: Pick<Rune, 'stat' | 'tier'>): number {
  return RUNE_STAT[r.stat][r.tier];
}

/** stat รวม (ค่าพื้นฐาน + อุปกรณ์ที่ใส่ + รูนบนอุปกรณ์ที่ใส่) ตัดเพดานแล้ว */
export function totalStats(g: GearState): Stats {
  const s: Stats = { ...BASE_STAT };
  for (const id of g.equipped) {
    const it = id && g.items.find((x) => x.id === id);
    if (!it) continue;
    const is = itemStats(it);
    for (const st of STATS) s[st] += is[st];
    const r = it.rune && g.runes.find((x) => x.id === it.rune);
    if (r) s[r.stat] += runeValue(r);
  }
  for (const st of STATS) {
    const cap = STAT_CAP[st];
    if (cap !== undefined) s[st] = Math.min(s[st], cap);
  }
  return s;
}

/** ตัวคูณที่ใช้ในเกม */
export interface GearMods {
  rateMul: number;
  rangeMul: number;
  dmgMul: number;
  critChance: number;
  critMul: number;
}

export function gearMods(g: GearState): GearMods {
  const s = totalStats(g);
  return {
    rateMul: 1 + s.rate / 100,
    rangeMul: 1 + s.range / 100,
    dmgMul: 1 + s.dmg / 100,
    critChance: s.critRate / 100,
    critMul: s.critDmg / 100,
  };
}

// ---------- helper ----------

function newId(g: GearState, prefix: string): string {
  return `${prefix}${g.nextId++}`;
}

function pickWeighted(rng: Rng, weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function findItem(g: GearState, id: string): GearItem | undefined {
  return g.items.find((x) => x.id === id);
}

export function isEquipped(g: GearState, id: string): boolean {
  return g.equipped.includes(id);
}

// ---------- ดรอปตอนผ่านสเตจ ----------

export interface Drops {
  pickaxes: number;
  bombs: number;
  tokens: number;
}

export function emptyDrops(): Drops {
  return { pickaxes: 0, bombs: 0, tokens: 0 };
}

/** stageIndex 0–3: ผ่านสเตจ 1–3 หรือผ่านทุ่งหอคอย (3) */
export function rollStageDrops(stageIndex: number, rng: Rng): Drops {
  return {
    pickaxes: rng() < DROP.pickaxe ? 1 : 0,
    bombs: rng() < DROP.bomb ? 1 : 0,
    tokens: stageIndex >= 3 ? DROP.tokenTower : randInt(rng, DROP.tokenRun[0], DROP.tokenRun[1]),
  };
}

export function addDrops(g: Drops, d: Drops): void {
  g.pickaxes += d.pickaxes;
  g.bombs += d.bombs;
  g.tokens += d.tokens;
}

// ---------- เหมือง ----------

/** ใช้ Pickaxe n อัน คืนจำนวนหินที่ได้ */
export function mine(g: GearState, n: number, rng: Rng): number {
  const use = Math.max(0, Math.min(n, g.pickaxes));
  let got = 0;
  for (let i = 0; i < use; i++) {
    if (rng() < DROP.mineChance) got += randInt(rng, DROP.mineStones[0], DROP.mineStones[1]);
  }
  g.pickaxes -= use;
  g.stones += got;
  return got;
}

export function rollRune(g: GearState, rng: Rng): Rune {
  const stat = STATS[Math.floor(rng() * STATS.length)];
  const tier = pickWeighted(rng, RUNE_TIER_RATE) as Tier;
  return { id: newId(g, 'r'), stat, tier, on: '' };
}

/** ใช้ Bomb n ลูก คืนรูนที่ได้ */
export function blast(g: GearState, n: number, rng: Rng): Rune[] {
  const use = Math.max(0, Math.min(n, g.bombs));
  const got: Rune[] = [];
  for (let i = 0; i < use; i++) {
    if (rng() < DROP.bombRune) {
      const r = rollRune(g, rng);
      g.runes.push(r);
      got.push(r);
    }
  }
  g.bombs -= use;
  return got;
}

// ---------- ตีบวก ----------

export interface EnhanceInfo {
  /** ระดับเป้าหมาย */
  target: number;
  base: number;
  pity: number;
  chance: number;
  /** ถ้าพลาดจะเหลือระดับเท่าไร */
  failTo: number;
  cost: number;
}

export function enhanceInfo(it: GearItem): EnhanceInfo | null {
  if (it.plus >= MAX_PLUS) return null;
  const target = it.plus + 1;
  const base = ENHANCE_RATE[target];
  const pity = Math.min(1 - base, (it.pity[target] ?? 0) * ENHANCE_PITY[target]);
  return {
    target,
    base,
    pity,
    chance: Math.min(1, base + pity),
    failTo: ENHANCE_DROP[target] ? it.plus - 1 : it.plus,
    cost: ENHANCE_COST,
  };
}

export type EnhanceResult = { ok: true; from: number; to: number } | { ok: false; from: number; to: number; reason?: 'max' | 'stones' };

export function enhance(g: GearState, itemId: string, rng: Rng): EnhanceResult {
  const it = findItem(g, itemId);
  if (!it) return { ok: false, from: 0, to: 0, reason: 'max' };
  const info = enhanceInfo(it);
  if (!info) return { ok: false, from: it.plus, to: it.plus, reason: 'max' };
  if (g.stones < info.cost) return { ok: false, from: it.plus, to: it.plus, reason: 'stones' };
  g.stones -= info.cost;
  const from = it.plus;
  if (rng() < info.chance) {
    it.plus = info.target;
    it.pity[info.target] = 0;
    return { ok: true, from, to: it.plus };
  }
  // พลาด: สะสม pity (ตกระดับแล้ว pity ไม่หาย)
  if (ENHANCE_PITY[info.target] > 0) it.pity[info.target] = (it.pity[info.target] ?? 0) + 1;
  it.plus = info.failTo;
  return { ok: false, from, to: it.plus };
}

// ---------- สวมใส่ / รูน / แยกชิ้น ----------

export function equip(g: GearState, itemId: string): void {
  const it = findItem(g, itemId);
  if (it) g.equipped[it.slot] = it.id;
}

export function unequip(g: GearState, slot: number): void {
  g.equipped[slot] = '';
}

/** ใส่รูนให้อุปกรณ์ (runeId '' = ถอด) รูนเก่าคืนกระเป๋าอัตโนมัติ */
export function setRune(g: GearState, itemId: string, runeId: string): void {
  const it = findItem(g, itemId);
  if (!it) return;
  if (it.rune) {
    const old = g.runes.find((r) => r.id === it.rune);
    if (old) old.on = '';
    it.rune = '';
  }
  if (!runeId) return;
  const r = g.runes.find((x) => x.id === runeId);
  if (!r) return;
  // รูนที่ใส่อยู่ชิ้นอื่น → ถอดออกจากชิ้นนั้นก่อน
  if (r.on) {
    const other = findItem(g, r.on);
    if (other) other.rune = '';
  }
  r.on = it.id;
  it.rune = r.id;
}

/** แยกชิ้นเป็น Token (ห้ามชิ้นที่ใส่อยู่) คืนจำนวน Token ที่ได้ หรือ -1 ถ้าแยกไม่ได้ */
export function salvage(g: GearState, itemId: string): number {
  const it = findItem(g, itemId);
  if (!it || isEquipped(g, itemId)) return -1;
  setRune(g, itemId, '');
  g.items = g.items.filter((x) => x.id !== itemId);
  const got = SALVAGE[it.cls];
  g.tokens += got;
  return got;
}

// ---------- สุ่มอุปกรณ์ ----------

function rollItem(g: GearState, rng: Rng, minCls: Cls = 0): GearItem {
  g.gachaPity++;
  let cls: Cls;
  if (g.gachaPity >= LEGENDARY_PITY) cls = 3;
  else cls = pickWeighted(rng, PULL_RATE) as Cls;
  if (cls < minCls) cls = minCls;
  if (cls === 3) g.gachaPity = 0;
  return {
    id: newId(g, 'i'),
    slot: Math.floor(rng() * SLOTS.length),
    cls,
    plus: 0,
    pity: Array(MAX_PLUS + 1).fill(0),
    rune: '',
  };
}

/** สุ่ม 1 หรือ 10 ครั้ง คืนอุปกรณ์ที่ได้ (ว่าง = Token ไม่พอ) */
export function pull(g: GearState, count: 1 | 10, rng: Rng): GearItem[] {
  const cost = count === 10 ? PULL_COST_10 : PULL_COST_1;
  if (g.tokens < cost) return [];
  g.tokens -= cost;
  const got: GearItem[] = [];
  for (let i = 0; i < count; i++) {
    // สุ่ม 10: ครั้งสุดท้ายการันตี Gold ขึ้นไปถ้ายังไม่ได้
    const needGold = count === 10 && i === count - 1 && !got.some((x) => x.cls >= 1);
    got.push(rollItem(g, rng, needGold ? 1 : 0));
  }
  g.items.push(...got);
  return got;
}

/** ช่องที่ยังว่างได้ชิ้นที่ดีที่สุดในกระเป๋าใส่ให้อัตโนมัติ (ใช้หลังสุ่ม) */
export function autoEquipEmpty(g: GearState): void {
  for (let s = 0; s < SLOTS.length; s++) {
    if (g.equipped[s]) continue;
    const best = g.items
      .filter((x) => x.slot === s)
      .sort((a, b) => b.cls - a.cls || b.plus - a.plus)[0];
    if (best) g.equipped[s] = best.id;
  }
}
