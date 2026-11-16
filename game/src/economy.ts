export type UpgradeId = 'start' | 'power' | 'income';

export interface UpgradeDef {
  id: UpgradeId;
  nameTh: string;
  icon: string;
  baseCost: number;
  growth: number;
  describe: (lvl: number) => string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'start', nameTh: 'กำลังพลเริ่มต้น', icon: '👥', baseCost: 40, growth: 1.28,
    describe: (lvl) => `เริ่ม ${startCrowd(lvl)} คน`,
  },
  {
    id: 'power', nameTh: 'พลังโจมตี', icon: '⚔️', baseCost: 60, growth: 1.32,
    describe: (lvl) => `พลัง ×${playerPower(lvl).toFixed(2)}`,
  },
  {
    id: 'income', nameTh: 'รายได้', icon: '🪙', baseCost: 80, growth: 1.35,
    describe: (lvl) => `เหรียญ ×${incomeMult(lvl).toFixed(2)}`,
  },
];

export function startCrowd(lvl: number): number {
  return 6 + lvl * 2;
}

export function playerPower(lvl: number): number {
  return Math.pow(1.12, lvl);
}

export function incomeMult(lvl: number): number {
  return 1 + lvl * 0.15;
}

function niceRound(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

export function upgradeCost(def: UpgradeDef, lvl: number): number {
  return niceRound(def.baseCost * Math.pow(def.growth, lvl));
}

/** พลังมาตรฐานของศัตรู/ผู้เล่นอ้างอิงในด่านนั้นๆ */
export function refPower(level: number): number {
  return Math.pow(1.04, level - 1);
}

export function winReward(level: number, survivors: number, eraBoss: boolean, incomeLvl: number): number {
  const base = 25 + level * 5 + 8 * Math.sqrt(Math.max(0, survivors)) + (eraBoss ? 120 : 0);
  return Math.round(base * incomeMult(incomeLvl));
}

export function loseReward(level: number, progress: number, incomeLvl: number): number {
  const base = (8 + level * 2) * Math.max(0, Math.min(1, progress));
  return Math.round(base * incomeMult(incomeLvl));
}
