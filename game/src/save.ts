import { STAMINA_MAX } from './config.ts';
import type { StaminaState } from './stamina.ts';
import type { UpgradeId } from './economy.ts';

export interface SaveData {
  version: 2;
  /** รอบที่เล่น (เคลียร์ครบทุกยุคแล้วเพิ่มขึ้น ด่านจะยากขึ้น) */
  cycle: number;
  /** ด่านในรอบปัจจุบัน (1–30) */
  level: number;
  coins: number;
  upgrades: Record<UpgradeId, number>;
  stamina: StaminaState;
  failStreak: number;
  settings: { sound: boolean; music: boolean; vibration: boolean };
}

const KEY = 'crowd-ages-save-v1';

export function defaultSave(now: number): SaveData {
  return {
    version: 2,
    cycle: 1,
    level: 1,
    coins: 0,
    upgrades: { troop: 0, capacity: 0, power: 0, economy: 0 },
    stamina: { value: STAMINA_MAX, lastTick: now },
    failStreak: 0,
    settings: { sound: true, music: true, vibration: true },
  };
}

export function loadSave(now: number): SaveData {
  const base = defaultSave(now);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Partial<SaveData> & { version?: number; upgrades?: Record<string, number> };
    if (data.version !== 2) {
      // เซฟจากเวอร์ชันแรก (แนวประตูบวก/คูณ): เก็บเหรียญ stamina และการตั้งค่าไว้ เริ่มด่านใหม่
      return {
        ...base,
        coins: typeof data.coins === 'number' ? data.coins : 0,
        stamina: { ...base.stamina, ...(data.stamina ?? {}) },
        settings: { ...base.settings, ...(data.settings ?? {}) },
      };
    }
    return {
      ...base,
      ...data,
      version: 2,
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
