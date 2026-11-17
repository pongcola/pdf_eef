// ฮีโร่: วิ่งไปกับฝูงและใช้สกิลเฉพาะตัวอัตโนมัติ
// ปลดล็อกตามยุคที่ไปถึง อัปเกรดด้วยถ้วยรางวัล Level รีเซ็ตเป็น 1 เมื่อขึ้นยุคใหม่

import { ERAS_PER_TIMELINE } from './config.ts';

export type HeroSkill = 'flask' | 'punch' | 'axe' | 'wind' | 'missile' | 'treasure';

export interface HeroDef {
  id: number;
  name: string;
  skill: HeroSkill;
  skillName: string;
  desc: string;
  /** สีหลัก/สีรอง (ใช้กับโมเดลและการ์ด) */
  color: number;
  accent: number;
  /** ปลดล็อกเมื่อถึงยุคลำดับที่เท่านี้ (นับรวมทุกไทม์ไลน์ เริ่ม 0) */
  unlockOrd: number;
  /** ใช้สกิลทุกกี่วินาที */
  cooldown: number;
}

export const HEROES: readonly HeroDef[] = [
  {
    id: 0, name: 'นักปรุงยาเพี้ยน', skill: 'flask', skillName: 'ขวดกรดเดือด',
    desc: 'ปาขวดกรดใส่เป้า ระเบิดเป็นวงกว้าง แล้วกัดกร่อนต่อเนื่อง',
    color: 0x8b5cf6, accent: 0x7cf26b, unlockOrd: 0, cooldown: 2.2,
  },
  {
    id: 1, name: 'นักชกเพลิง', skill: 'punch', skillName: 'หมัดเพลิง',
    desc: 'ปล่อยหมัดไฟใส่เป้า มีโอกาสคริติคอลแรงขึ้น 3 เท่า',
    color: 0xd94b3a, accent: 0xffb02e, unlockOrd: 1, cooldown: 1.1,
  },
  {
    id: 2, name: 'คนตัดไม้ยักษ์', skill: 'axe', skillName: 'ขวานฉีก',
    desc: 'ขว้างขวานหมุนทะลุเป้าได้ 3 ชิ้น ทำให้เลือดไหลต่อเนื่อง',
    color: 0x3f7d4a, accent: 0xc0c6d0, unlockOrd: 2, cooldown: 1.8,
  },
  {
    id: 3, name: 'นักพรตสายลม', skill: 'wind', skillName: 'พายุแยกสาย',
    desc: 'โจมตีเป้า แล้วปล่อยกระแสลม 3 สายพัดไปข้างหน้า',
    color: 0x4b8fd9, accent: 0xe8c27a, unlockOrd: 3, cooldown: 2.4,
  },
  {
    id: 4, name: 'นักบินโดรน', skill: 'missile', skillName: 'มิสไซล์โดรน',
    desc: 'โดรนเรียกมิสไซล์ถล่มเป้า ระเบิดโดนทุกอย่างรอบๆ',
    color: 0x334155, accent: 0x38f2ff, unlockOrd: 4, cooldown: 3.0,
  },
  {
    id: 5, name: 'นักล่าสมบัติ', skill: 'treasure', skillName: 'ปืนคู่ล่าสมบัติ',
    desc: 'ยิงปืนสลับซ้ายขวา ยิงโดนมีโอกาสได้เงิน หรือได้ดาว',
    color: 0xb7791f, accent: 0x2b2b2b, unlockOrd: 5, cooldown: 0.6,
  },
];

/** ATK ตาม Level */
export function heroAtk(lvl: number): number {
  return lvl;
}

/** ตัวคูณดาเมจสกิลตาม Level */
export function heroMult(lvl: number): number {
  return 1 + 0.4 * (lvl - 1);
}

/** ราคาอัปเกรด (ถ้วยรางวัล) จาก Level ปัจจุบัน */
export function heroUpgradeCost(lvl: number): number {
  return 2 * lvl + 1;
}

/** ข้อความ "ปลดล็อกที่ ไทม์ไลน์ X – ยุค Y" */
export function unlockText(ord: number): string {
  return `ไทม์ไลน์ ${Math.floor(ord / ERAS_PER_TIMELINE) + 1} – ยุค ${(ord % ERAS_PER_TIMELINE) + 1}`;
}
