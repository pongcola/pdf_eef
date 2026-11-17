export type UpgradeId = 'troop' | 'capacity' | 'power' | 'economy';

export interface UpgradeDef {
  id: UpgradeId;
  nameTh: string;
  icon: string;
  color: string;
  baseCost: number;
  growth: number;
  describe: (lvl: number) => string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'troop', nameTh: 'เพิ่มทหาร', icon: '🧍', color: '#c04bd9', baseCost: 45, growth: 1.32,
    describe: (lvl) => `เริ่ม ${startTroops(lvl)} คน`,
  },
  {
    id: 'capacity', nameTh: 'ความจุ', icon: '🏕️', color: '#3f8cff', baseCost: 40, growth: 1.28,
    describe: (lvl) => `สูงสุด ${capacity(lvl)} คน`,
  },
  {
    id: 'power', nameTh: 'พลังโจมตี', icon: '⚔️', color: '#ff8a1f', baseCost: 55, growth: 1.3,
    describe: (lvl) => `ดาเมจ ×${playerPower(lvl).toFixed(2)}`,
  },
  {
    id: 'economy', nameTh: 'รายได้', icon: '💰', color: '#2fbf63', baseCost: 60, growth: 1.33,
    describe: (lvl) => `เหรียญ ×${incomeMult(lvl).toFixed(1)}`,
  },
];

export function startTroops(lvl: number): number {
  return 1 + lvl;
}

export function capacity(lvl: number): number {
  return 8 + lvl * 3;
}

export function playerPower(lvl: number): number {
  return Math.pow(1.15, lvl);
}

export function incomeMult(lvl: number): number {
  return 1 + lvl * 0.2;
}

function niceRound(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

export function upgradeCost(def: UpgradeDef, lvl: number): number {
  return niceRound(def.baseCost * Math.pow(def.growth, lvl));
}

export function winReward(level: number, collected: number, eraBoss: boolean, cycle: number, economyLvl: number): number {
  const base = 15 + level * 4 + (eraBoss ? 100 : 0);
  return Math.round((base * (1 + (cycle - 1) * 0.5) + collected) * incomeMult(economyLvl));
}

export function loseReward(collected: number, economyLvl: number): number {
  return Math.max(1, Math.round(collected * 0.5 * incomeMult(economyLvl)));
}
