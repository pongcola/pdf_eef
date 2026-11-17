// ---------- อัปเกรดประจำยุค (รีเซ็ตเป็น Lv.1 ทุกครั้งที่ขึ้นยุคใหม่) ----------

export type UpgradeId = 'troop' | 'capacity' | 'power' | 'economy';

export interface MetaLevels {
  funds: number;
  aim: number;
  veteran: number;
  logistics: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  nameTh: string;
  icon: string;
  color: string;
  baseCost: number;
  /** ราคาเพิ่มต่อระดับ */
  step: number;
  /** คำอธิบายเมื่อกดปุ่ม i */
  note: string;
  describe: (lvl: number, meta: MetaLevels) => string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'economy', nameTh: 'รายได้', icon: 'up_economy', color: '#2fbf63', baseCost: 25, step: 30,
    note: 'เพิ่มเงินที่ได้จากการทำลายหอคอย สิ่งกีดขวาง และกองเงิน อัปเกรดรีเซ็ตทุกยุค',
    describe: (lvl) => `เงิน ×${incomeMult(lvl).toFixed(1)}`,
  },
  {
    id: 'capacity', nameTh: 'ความจุ', icon: 'up_capacity', color: '#3f8cff', baseCost: 25, step: 30,
    note: 'เพิ่มจำนวนแคปซูลเริ่มต้นบนแท่นทหาร ทุก 10 ระดับ +1 ช่อง (แถบคือความคืบหน้า และเกจซ้ายเริ่มต้นตามแถบนี้) อัปเกรดรีเซ็ตทุกยุค',
    describe: (lvl) => `แคปซูล ${capsuleStartCount(lvl)} • ${Math.round(capacityProgress(lvl) * 100)}%`,
  },
  {
    id: 'troop', nameTh: 'เพิ่มทหาร', icon: 'up_troop', color: '#c04bd9', baseCost: 75, step: 75,
    note: 'เพิ่มจำนวนทหารตอนเริ่มด่าน อัปเกรดรีเซ็ตทุกยุค',
    describe: (lvl, m) => `เริ่ม ${startTroops(lvl, m)} คน`,
  },
  {
    id: 'power', nameTh: 'พลังโจมตี', icon: 'up_power', color: '#ff8a1f', baseCost: 25, step: 30,
    note: 'เพิ่มพลังโจมตีของทหาร อัปเกรดรีเซ็ตทุกยุค',
    describe: (lvl, m) => `ดาเมจ ×${playerPower(lvl, m).toFixed(2)}`,
  },
];

/** จำนวนทหารสูงสุดในฝูง (ไม่จำกัดด้วยอัปเกรดแล้ว) */
export const MAX_SQUAD = 60;

export function startTroops(lvl: number, m: MetaLevels): number {
  return 1 + lvl + m.veteran;
}

export function capacity(_lvl: number, _m: MetaLevels): number {
  return MAX_SQUAD;
}

/** จำนวนแคปซูลบนแท่นตอนเริ่มด่าน (อัปเกรดความจุทุก 10 ระดับ +1, สูงสุด 5) */
export function capsuleStartCount(lvl: number): number {
  return Math.min(5, 2 + Math.floor(lvl / 10));
}

/** ความคืบหน้าไปสู่แคปซูลช่องถัดไป (0–1) = เกจซ้ายตอนเริ่มด่าน */
export function capacityProgress(lvl: number): number {
  return capsuleStartCount(lvl) >= 5 ? 0 : (lvl % 10) / 10;
}

export function playerPower(lvl: number, m: MetaLevels): number {
  return Math.pow(1.15, lvl) * (1 + m.aim * 0.08);
}

/** ตัวคูณเงินจากหอคอย สิ่งกีดขวาง และกองเงิน */
export function incomeMult(lvl: number): number {
  return 1 + lvl * 0.2;
}

function niceRound(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

/** ราคาอัปเกรด: เพิ่มทีละเท่าๆ กัน ยุคหลังๆ แพงขึ้น */
export function upgradeCost(def: UpgradeDef, lvl: number, eraOrd: number): number {
  return niceRound((def.baseCost + def.step * lvl) * (1 + eraOrd * 0.3));
}

/** เงินจบด่าน: ค่าผ่านด่าน + เงินที่เก็บได้ระหว่างทาง (เงินระหว่างทางคูณ "รายได้" ไปแล้ว) */
export function winReward(inEra: number, eraOrd: number, collected: number, eraBoss: boolean): number {
  const base = (15 + inEra * 8) * (1 + eraOrd * 0.3) + (eraBoss ? 100 : 0);
  return Math.round(base + collected);
}

export function loseReward(collected: number): number {
  return Math.max(1, Math.round(collected * 0.5));
}

// ---------- ค่ายฝึก: อัปเกรดถาวรด้วยดาว (ไม่รีเซ็ต) ----------

export type MetaId = keyof MetaLevels;

export interface MetaDef {
  id: MetaId;
  nameTh: string;
  icon: string;
  baseCost: number;
  growth: number;
  max: number;
  describe: (lvl: number) => string;
}

export const META: readonly MetaDef[] = [
  { id: 'funds', nameTh: 'ทุนตั้งต้น', icon: 'camp_funds', baseCost: 3, growth: 1.45, max: 20, describe: (l) => `เริ่มยุคใหม่ +${l * 100} เหรียญ` },
  { id: 'aim', nameTh: 'ฝึกยิง', icon: 'camp_aim', baseCost: 4, growth: 1.5, max: 25, describe: (l) => `ดาเมจถาวร +${l * 8}%` },
  { id: 'veteran', nameTh: 'ทหารผ่านศึก', icon: 'camp_veteran', baseCost: 8, growth: 1.9, max: 5, describe: (l) => `ทหารเริ่มต้น +${l}` },
  { id: 'logistics', nameTh: 'คลังเสบียง', icon: 'camp_logistics', baseCost: 4, growth: 1.5, max: 9, describe: (l) => `เกจซ้ายเริ่ม +${l * 10}%` },
];

export function metaCost(def: MetaDef, lvl: number): number {
  return Math.round(def.baseCost * Math.pow(def.growth, lvl));
}
