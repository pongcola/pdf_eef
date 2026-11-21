import { defaultGear, normalizeGear, type GearState } from './gear.ts';
import { ERA_START_COINS, STAMINA_MAX } from './config.ts';
import type { StaminaState } from './stamina.ts';
import type { MetaLevels, UpgradeId } from './economy.ts';

export interface SaveData {
  version: 5;
  /** เลขด่านรวม (1, 2, 3, …) — ยุคและไทม์ไลน์คำนวณจากเลขนี้ */
  level: number;
  /** เหรียญ (ใช้ในยุคปัจจุบัน รีเซ็ตเมื่อขึ้นยุคใหม่) */
  coins: number;
  /** ดาว (ถาวร ใช้ที่ค่ายฝึก) */
  stars: number;
  /** อัปเกรดประจำยุค */
  upgrades: Record<UpgradeId, number>;
  /** อัปเกรดถาวรจากค่ายฝึก */
  meta: MetaLevels;
  stamina: StaminaState;
  failStreak: number;
  /** ถ้วยรางวัล (ใช้อัปเกรดฮีโร่) */
  trophies: number;
  /** ฮีโร่: ตัวที่ใช้อยู่ และ Level ของแต่ละตัว (รีเซ็ตทุกยุค) */
  heroes: { equipped: number; levels: number[] };
  settings: { sound: boolean; music: boolean; vibration: boolean };
  /** ระบบอุปกรณ์ (ถาวร ไม่รีเซ็ตตอนขึ้นยุค) — เพิ่มใน v5 */
  gear: GearState;
}

const KEY = 'crowd-ages-save-v1';

export function defaultSave(now: number): SaveData {
  return {
    version: 5,
    level: 1,
    coins: ERA_START_COINS,
    stars: 0,
    upgrades: { troop: 0, capacity: 0, power: 0, economy: 0 },
    meta: { funds: 0, aim: 0, veteran: 0, logistics: 0 },
    stamina: { value: STAMINA_MAX, lastTick: now },
    failStreak: 0,
    trophies: 0,
    heroes: { equipped: 0, levels: [1, 1, 1, 1, 1, 1] },
    settings: { sound: true, music: true, vibration: true },
    gear: defaultGear(),
  };
}

export function loadSave(now: number): SaveData {
  const base = defaultSave(now);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Omit<Partial<SaveData>, 'version'> & { version?: number; cycle?: number };
    const keep = {
      coins: typeof data.coins === 'number' ? data.coins : base.coins,
      stamina: { ...base.stamina, ...(data.stamina ?? {}) },
      settings: { ...base.settings, ...(data.settings ?? {}) },
    };
    if (data.version === 2) {
      // เวอร์ชัน 2 นับด่านเป็นรอบละ 30 ด่าน → แปลงเป็นเลขด่านรวม
      const old = ((data.cycle ?? 1) - 1) * 30 + (data.level ?? 1);
      const level = Math.floor((old - 1) / 5) + 1;
      return { ...base, ...keep, level, upgrades: { ...base.upgrades, ...(data.upgrades ?? {}) } };
    }
    if (data.version !== 3 && data.version !== 4 && data.version !== 5) return { ...base, ...keep };
    // เวอร์ชัน 3: ยุคละ 5 ด่าน → เวอร์ชัน 4: 1 ด่าน = 1 ยุค
    const level = data.version === 3 ? Math.floor(((data.level ?? 1) - 1) / 5) + 1 : (data.level ?? 1);
    return {
      ...base,
      ...data,
      level,
      version: 5,
      upgrades: { ...base.upgrades, ...(data.upgrades ?? {}) },
      meta: { ...base.meta, ...(data.meta ?? {}) },
      heroes: {
        equipped: data.heroes?.equipped ?? 0,
        levels: base.heroes.levels.map((v, i) => data.heroes?.levels?.[i] ?? v),
      },
      stamina: keep.stamina,
      settings: keep.settings,
      // v4 ยังไม่มี gear → เริ่มว่าง
      gear: normalizeGear(data.gear),
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
