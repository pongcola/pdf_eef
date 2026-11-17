// ช่องรูป UI — วางไฟล์ .png/.webp/.svg ชื่อตาม key ไว้ในโฟลเดอร์ src/ui/art/
// แล้ว build ใหม่ เกมจะใช้รูปนั้นแทนอีโมจิ/สไตล์เดิมทันที (ไม่มีไฟล์ = ใช้ของเดิม)

const files = import.meta.glob('./art/*.{png,webp,svg,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  ART[path.replace(/^.*\//, '').replace(/\.[a-z]+$/, '')] = url;
}

export interface SlotInfo {
  /** ของเดิมที่ใช้อยู่ (อีโมจิ) */
  emoji: string;
  /** ชื่อ/ความหมาย */
  label: string;
  /** ขนาดแนะนำ (px) */
  size: string;
  /** ใช้ที่ไหน */
  where: string;
}

const ICON = '128×128';

/** รายการช่องรูปทั้งหมด (ใช้ทำเอกสาร UI ด้วย) */
export const SLOTS = {
  // ----- ไอคอนทั่วไป -----
  coin: { emoji: '🪙', label: 'เหรียญ', size: ICON, where: 'แถบบนเมนู, HUD, ราคาอัปเกรด, รางวัล' },
  star: { emoji: '⭐', label: 'ดาว (สกุลถาวร)', size: ICON, where: 'แถบบนเมนู, ค่ายฝึก, รางวัล' },
  stamina: { emoji: '⚡', label: 'Stamina', size: ICON, where: 'แถบบนเมนู, ปุ่มเล่น, หน้าผลลัพธ์' },
  settings: { emoji: '⚙️', label: 'ปุ่มตั้งค่า', size: ICON, where: 'มุมขวาบนเมนู' },
  pause: { emoji: '⏸', label: 'ปุ่มหยุด', size: ICON, where: 'มุมขวาบนระหว่างเล่น' },
  troop: { emoji: '🧍', label: 'จำนวนทหาร', size: ICON, where: 'HUD ระหว่างเล่น' },
  timeline: { emoji: '🗺️', label: 'ปุ่มไทม์ไลน์', size: ICON, where: 'เมนู (ปุ่มดูไทม์ไลน์ยุค)' },
  camp: { emoji: '⛺', label: 'ปุ่มค่ายฝึก', size: ICON, where: 'เมนู (ปุ่มค่ายฝึก)' },
  lock: { emoji: '🔒', label: 'ล็อก', size: ICON, where: 'ไทม์ไลน์ (ยุคที่ยังไม่ปลด)' },
  check: { emoji: '✅', label: 'ผ่านแล้ว', size: ICON, where: 'ไทม์ไลน์ (ยุคที่เคลียร์)' },
  crown: { emoji: '👑', label: 'ด่านบอส', size: ICON, where: 'จุดด่านในยุค, ปลายแถบความคืบหน้า, ชื่อบอส' },
  crystal: { emoji: '💎', label: 'ทุ่งคริสตัล', size: ICON, where: 'ปลายแถบความคืบหน้า (ด่านปกติ)' },
  hand: { emoji: '👆', label: 'มือสอนเล่น', size: ICON, where: 'คำแนะนำตอนเริ่มด่าน' },
  gift: { emoji: '🎁', label: 'วงล้อโชค', size: ICON, where: 'หัวข้อวงล้อหลังชนะ' },
  sound: { emoji: '🔊', label: 'เสียง', size: ICON, where: 'หน้าตั้งค่า' },
  music: { emoji: '🎵', label: 'เพลง', size: ICON, where: 'หน้าตั้งค่า' },
  vibration: { emoji: '📳', label: 'การสั่น', size: ICON, where: 'หน้าตั้งค่า' },
  stat_rate: { emoji: '🔥', label: 'อัตรายิง', size: ICON, where: 'HUD ค่าพลังระหว่างเล่น' },
  stat_range: { emoji: '🎯', label: 'ระยะยิง', size: ICON, where: 'HUD ค่าพลังระหว่างเล่น' },
  stat_power: { emoji: '💥', label: 'พลังยิง', size: ICON, where: 'HUD ค่าพลังระหว่างเล่น' },
  trophy: { emoji: '🏆', label: 'ถ้วยรางวัล', size: ICON, where: 'รางวัลจบด่าน, หน้าทีม (อัปเกรดฮีโร่)' },
  team: { emoji: '🦸', label: 'ปุ่มฮีโร่', size: ICON, where: 'เมนู (ปุ่มหน้าทีม)' },
  // ----- ฮีโร่ -----
  hero_0: { emoji: '🧪', label: 'ฮีโร่: นักปรุงยาเพี้ยน', size: '256×256', where: 'หน้าทีม' },
  hero_1: { emoji: '🥊', label: 'ฮีโร่: นักชกเพลิง', size: '256×256', where: 'หน้าทีม' },
  hero_2: { emoji: '🪓', label: 'ฮีโร่: คนตัดไม้ยักษ์', size: '256×256', where: 'หน้าทีม' },
  hero_3: { emoji: '🌪️', label: 'ฮีโร่: นักพรตสายลม', size: '256×256', where: 'หน้าทีม' },
  hero_4: { emoji: '🛸', label: 'ฮีโร่: นักบินโดรน', size: '256×256', where: 'หน้าทีม' },
  hero_5: { emoji: '💰', label: 'ฮีโร่: นักล่าสมบัติ', size: '256×256', where: 'หน้าทีม' },
  // ----- อัปเกรดประจำยุค -----
  up_troop: { emoji: '🧍', label: 'อัปเกรด: เพิ่มทหาร', size: '160×160', where: 'การ์ดอัปเกรดในเมนู' },
  up_capacity: { emoji: '🏕️', label: 'อัปเกรด: ความจุ', size: '160×160', where: 'การ์ดอัปเกรดในเมนู' },
  up_power: { emoji: '⚔️', label: 'อัปเกรด: พลังโจมตี', size: '160×160', where: 'การ์ดอัปเกรดในเมนู' },
  up_economy: { emoji: '💰', label: 'อัปเกรด: รายได้', size: '160×160', where: 'การ์ดอัปเกรดในเมนู' },
  // ----- ค่ายฝึก (ถาวร) -----
  camp_funds: { emoji: '💰', label: 'ค่ายฝึก: ทุนตั้งต้น', size: '160×160', where: 'หน้าค่ายฝึก' },
  camp_aim: { emoji: '🎯', label: 'ค่ายฝึก: ฝึกยิง', size: '160×160', where: 'หน้าค่ายฝึก' },
  camp_veteran: { emoji: '🎖️', label: 'ค่ายฝึก: ทหารผ่านศึก', size: '160×160', where: 'หน้าค่ายฝึก' },
  camp_logistics: { emoji: '📦', label: 'ค่ายฝึก: คลังเสบียง', size: '160×160', where: 'หน้าค่ายฝึก' },
  // ----- ยุค -----
  era_0: { emoji: '🪨', label: 'ไอคอนยุคหิน', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_1: { emoji: '🏛️', label: 'ไอคอนยุคโบราณ', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_2: { emoji: '🛡️', label: 'ไอคอนยุคอัศวิน', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_3: { emoji: '💥', label: 'ไอคอนยุคดินปืน', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_4: { emoji: '🚁', label: 'ไอคอนยุคสมัยใหม่', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_5: { emoji: '🚀', label: 'ไอคอนยุคอนาคต', size: ICON, where: 'การ์ดยุคในเมนู, ไทม์ไลน์, ป้ายยุคใหม่' },
  era_card_0: { emoji: '', label: 'ภาพปกยุคหิน', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  era_card_1: { emoji: '', label: 'ภาพปกยุคโบราณ', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  era_card_2: { emoji: '', label: 'ภาพปกยุคอัศวิน', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  era_card_3: { emoji: '', label: 'ภาพปกยุคดินปืน', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  era_card_4: { emoji: '', label: 'ภาพปกยุคสมัยใหม่', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  era_card_5: { emoji: '', label: 'ภาพปกยุคอนาคต', size: '640×240', where: 'แถวยุคในหน้าไทม์ไลน์ (พื้นหลัง)' },
  // ----- ภาพใหญ่ -----
  logo: { emoji: '', label: 'โลโก้ CROWD AGES', size: '1024×512', where: 'หัวเมนูหลัก (แทนตัวหนังสือ)' },
  banner_win: { emoji: '', label: 'ป้าย "ชนะ!"', size: '800×300', where: 'หัวหน้าผลลัพธ์ตอนชนะ' },
  banner_lose: { emoji: '', label: 'ป้าย "พ่ายแพ้"', size: '800×300', where: 'หัวหน้าผลลัพธ์ตอนแพ้' },
  banner_newera: { emoji: '', label: 'ป้าย "ยุคใหม่!"', size: '800×300', where: 'หน้าไทม์ไลน์หลังเคลียร์ยุค' },
  btn_play: { emoji: '', label: 'พื้นปุ่มหลัก (ส้ม)', size: '600×140 (ยืดเต็มปุ่ม)', where: 'ปุ่มเล่น, ด่านต่อไป, เริ่มยุคใหม่' },
  btn_ghost: { emoji: '', label: 'พื้นปุ่มรอง', size: '600×110 (ยืดเต็มปุ่ม)', where: 'ปุ่มเมนู/ออก' },
  panel: { emoji: '', label: 'พื้นหน้าต่าง/การ์ด', size: '760×1000 (ยืดเต็มกรอบ)', where: 'หน้าผลลัพธ์, หยุดชั่วคราว, ตั้งค่า, ค่ายฝึก, ไทม์ไลน์' },
} satisfies Record<string, SlotInfo>;

export type SlotKey = keyof typeof SLOTS;

export function hasArt(key: SlotKey): boolean {
  return key in ART;
}

export function artUrl(key: SlotKey): string | undefined {
  return ART[key];
}

/** ไอคอน: รูปถ้ามี ไม่งั้นใช้อีโมจิ */
export function ico(key: SlotKey | string, cls = ''): string {
  const url = ART[key];
  if (url) return `<img class="ico ${cls}" src="${url}" alt="">`;
  const slot = (SLOTS as Record<string, SlotInfo>)[key];
  return `<span class="ico emo ${cls}">${slot?.emoji ?? ''}</span>`;
}

/**
 * ใส่ภาพพื้นหลังให้ปุ่ม/การ์ด แบบ 9-slice (มุมไม่ยืด)
 * slice = ขนาดมุมในรูป (px ของไฟล์), width = ขนาดมุมบนจอ (CSS px)
 */
const SKINS: { key: SlotKey; sel: string; slice: number; width: number }[] = [
  { key: 'btn_play', sel: '.play-btn', slice: 64, width: 26 },
  { key: 'btn_ghost', sel: '.ghost-btn', slice: 64, width: 22 },
  { key: 'panel', sel: '.card', slice: 100, width: 34 },
];

export function applySkins(root: HTMLElement): void {
  for (const { key, sel, slice, width } of SKINS) {
    const url = ART[key];
    if (!url) continue;
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      el.classList.add('skinned');
      el.style.borderStyle = 'solid';
      el.style.borderImage = `url("${url}") ${slice} fill / ${width}px stretch`;
    });
  }
}
