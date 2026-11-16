import { STAMINA_MAX } from './config.ts';
import type { StaminaState } from './stamina.ts';
import type { UpgradeId } from './economy.ts';

export interface SaveData {
  version: 1;
  level: number;
  coins: number;
  upgrades: Record<UpgradeId, number>;
  stamina: StaminaState;
  failStreak: number;
  bestLevel: number;
  settings: { sound: boolean; music: boolean; vibration: boolean };
}

const KEY = 'crowd-ages-save-v1';

export function defaultSave(now: number): SaveData {
  return {
    version: 1,
    level: 1,
    coins: 0,
    upgrades: { start: 0, power: 0, income: 0 },
    stamina: { value: STAMINA_MAX, lastTick: now },
    failStreak: 0,
    bestLevel: 1,
    settings: { sound: true, music: true, vibration: true },
  };
}

export function loadSave(now: number): SaveData {
  const base = defaultSave(now);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...base,
      ...data,
      version: 1,
      upgrades: { ...base.upgrades, ...(data.upgrades ?? {}) },
      stamina: { ...base.stamina, ...(data.stamina ?? {}) },
      settings: { ...base.settings, ...(data.settings ?? {}) },
    };
  } catch {
    return base;
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // เครื่องไม่ให้บันทึก — เล่นต่อได้แต่ไม่จำค่า
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
