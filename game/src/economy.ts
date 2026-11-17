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
  growth: number;
  describe: (lvl: number, meta: MetaLevels) => string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'troop', nameTh: 'เพิ่มทหาร', icon: 'up_troop', color: '#c04bd9', baseCost: 45, growth: 1.32,
    describe: (lvl, m) => `เริ่ม ${startTroops(lvl, m)} คน`,
  },
  {
    id: 'capacity', nameTh: 'ความจุ', icon: 'up_capacity', color: '#3f8cff', baseCost: 40, growth: 1.28,
    describe: (lvl, m) => `สูงสุด ${capacity(lvl, m)} • เกจ +${gaugeTroops(lvl)}`,
  },
  {
    id: 'power', nameTh: 'พลังโจมตี', icon: 'up_power', color: '#ff8a1f', baseCost: 55, growth: 1.3,
    describe: (lvl, m) => `ดาเมจ ×${playerPower(lvl, m).toFixed(2)}`,
  },
  {
    id: 'economy', nameTh: 'รายได้', icon: 'up_economy', color: '#2fbf63', baseCost: 60, growth: 1.33,
    describe: (lvl) => `เหรียญ ×${incomeMult(lvl).toFixed(1)}`,
  },
];

export function startTroops(lvl: number, m: MetaLevels): number {
  return 1 + lvl + m.veteran;
}

export function capacity(lvl: number, m: MetaLevels): number {
  return 8 + lvl * 3 + m.logistics * 2;
}

/** เกจด้านซ้ายเต็มแล้วได้ทหารกี่คน */
export function gaugeTroops(lvl: number): number {
  return 1 + Math.floor(lvl / 3);
}

export function playerPower(lvl: number, m: MetaLevels): number {
  return Math.pow(1.15, lvl) * (1 + m.aim * 0.08);
}

export function incomeMult(lvl: number): number {
  return 1 + lvl * 0.2;
}

function niceRound(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

/** ราคาอัปเกรด: ยุคหลังๆ แพงขึ้น */
export function upgradeCost(def: UpgradeDef, lvl: number, eraOrd: number): number {
  return niceRound(def.baseCost * Math.pow(def.growth, lvl) * (1 + eraOrd * 0.3));
}

export function winReward(inEra: number, eraOrd: number, collected: number, eraBoss: boolean, economyLvl: number): number {
  const base = (15 + inEra * 8) * (1 + eraOrd * 0.3) + (eraBoss ? 100 : 0);
  return Math.round((base + collected) * incomeMult(economyLvl));
}

export function loseReward(collected: number, economyLvl: number): number {
  return Math.max(1, Math.round(collected * 0.5 * incomeMult(economyLvl)));
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
  { id: 'logistics', nameTh: 'คลังเสบียง', icon: 'camp_logistics', baseCost: 4, growth: 1.5, max: 15, describe: (l) => `ความจุ +${l * 2}` },
];

export function metaCost(def: MetaDef, lvl: number): number {
  return Math.round(def.baseCost * Math.pow(def.growth, lvl));
}
