import { ERAS_PER_TIMELINE, LEVELS_PER_ERA, LEVELS_PER_TIMELINE } from './config.ts';

export type DecorKind = 'stone' | 'ancient' | 'medieval' | 'gunpowder' | 'modern' | 'future';

export interface EraDef {
  id: number;
  nameTh: string;
  nameEn: string;
  sky: number;
  fog: number;
  ground: number;
  track: number;
  trackLine: number;
  rail: number;
  railAlt: number;
  skin: number;
  legs: number;
  hat: number;
  weapon: number;
  metal: number;
  decor: DecorKind;
}

export const ERAS: readonly EraDef[] = [
  {
    id: 0, nameTh: 'ยุคหิน', nameEn: 'Stone Age',
    sky: 0x8fd3ff, fog: 0xbfe6ff, ground: 0x6fbf4a, track: 0xc9a46b, trackLine: 0xb38d55,
    rail: 0x7a5230, railAlt: 0x9c6b3f,
    skin: 0xe0a979, legs: 0x6b4a2b, hat: 0x3b2614, weapon: 0x7a5230, metal: 0x9a9a9a, decor: 'stone',
  },
  {
    id: 1, nameTh: 'ยุคโบราณ', nameEn: 'Ancient Age',
    sky: 0xffd99a, fog: 0xffe9c2, ground: 0xe9c77b, track: 0xf1dfb0, trackLine: 0xdcc48d,
    rail: 0xb88a3e, railAlt: 0xe0b45a,
    skin: 0xd9965f, legs: 0xc68a5a, hat: 0xc99a2e, weapon: 0x8a5a2b, metal: 0xd4a23a, decor: 'ancient',
  },
  {
    id: 2, nameTh: 'ยุคอัศวิน', nameEn: 'Knight Age',
    sky: 0x9fc6ff, fog: 0xcfe0ff, ground: 0x4f9e4a, track: 0xa7a7a0, trackLine: 0x8f8f88,
    rail: 0x5d5d66, railAlt: 0x7c7c88,
    skin: 0xf0c098, legs: 0x777e88, hat: 0xb9c0c9, weapon: 0x5a3a20, metal: 0xd7dde4, decor: 'medieval',
  },
  {
    id: 3, nameTh: 'ยุคดินปืน', nameEn: 'Gunpowder Age',
    sky: 0xffc2a1, fog: 0xffdcc8, ground: 0x7fae52, track: 0xb5895e, trackLine: 0x9d7449,
    rail: 0x5b3b22, railAlt: 0x7d5532,
    skin: 0xf0c098, legs: 0xf2f2ee, hat: 0x222222, weapon: 0x6b4220, metal: 0x5f6670, decor: 'gunpowder',
  },
  {
    id: 4, nameTh: 'ยุคสมัยใหม่', nameEn: 'Modern Age',
    sky: 0xa9d8ff, fog: 0xd6ecff, ground: 0x8a9aa6, track: 0x4d545e, trackLine: 0xf2f2f2,
    rail: 0xf0c419, railAlt: 0x2e3238,
    skin: 0xe8b48a, legs: 0x4a5a3a, hat: 0x55663f, weapon: 0x2b2b2b, metal: 0x3a3a3a, decor: 'modern',
  },
  {
    id: 5, nameTh: 'ยุคอนาคต', nameEn: 'Future Age',
    sky: 0x2a1b5c, fog: 0x3b2a7a, ground: 0x1a1240, track: 0x2b2f55, trackLine: 0x38f2ff,
    rail: 0x38f2ff, railAlt: 0xff4fd8,
    skin: 0xf0c098, legs: 0xdde3ea, hat: 0xf4f7fb, weapon: 0xe8eef5, metal: 0x38f2ff, decor: 'future',
  },
];

export const PLAYER_COLOR = 0x2f7bff;
export const ENEMY_COLOR = 0xe8433f;
/** ทหารศัตรู (ชุดดำแดง) */
export const ENEMY_SQUAD_COLOR = 0x2b2b38;
/** สีเสื้อทหารตามระดับ 1–5 */
export const TIER_COLORS = [PLAYER_COLOR, 0x2fbf63, 0xf2b632, 0x9b5cff, 0x38f2ff, 0xff7a1a, 0xff5fa2, 0xe03b3b, 0xf5f5f5, 0x2b2b38];

/** level = เลขด่านรวม (1, 2, 3, …) */
export function eraIndexForLevel(level: number): number {
  return Math.floor((level - 1) / LEVELS_PER_ERA) % ERAS_PER_TIMELINE;
}

/** ลำดับยุคนับรวมทุกไทม์ไลน์ (0, 1, 2, …) */
export function eraOrdinal(level: number): number {
  return Math.floor((level - 1) / LEVELS_PER_ERA);
}

export function timelineForLevel(level: number): number {
  return Math.floor((level - 1) / LEVELS_PER_TIMELINE) + 1;
}

export function levelInEra(level: number): number {
  return ((level - 1) % LEVELS_PER_ERA) + 1;
}

export function isEraBossLevel(_level: number): boolean {
  // ไม่มีบอสแล้ว: ท้ายยุคเป็นทุ่งหอคอยเสมอ
  return false;
}

/** ทหารระดับสูงหน้าตาเป็นทหารของยุคถัดๆ ไป (เหมือนวิวัฒนาการ) */
export function tierLook(era: number, tier: number): number {
  return Math.min(ERAS.length - 1, era + tier - 1);
}
