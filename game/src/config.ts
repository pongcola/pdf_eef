// ค่าตั้งหลักของเกม — แก้ตรงนี้ที่เดียว

/** Stamina สูงสุด */
export const STAMINA_MAX = 10;
/** ใช้ stamina กี่หน่วยต่อการเล่น 1 ด่าน */
export const STAMINA_RUN_COST = 1;
/** ฟื้น stamina +1 ทุกๆ กี่มิลลิวินาที (5 นาที) */
export const STAMINA_REGEN_MS = 5 * 60 * 1000;

/** ความกว้างของถนน (หน่วยโลก 3D) */
export const TRACK_WIDTH = 10;
/** ตำแหน่งกลางเลนซ้าย/ขวา */
export const LANE_X = 3.2;
/** ความเร็ววิ่ง (หน่วย/วินาที) */
export const RUN_SPEED = 7;
/** ระยะห่างระหว่างทหารในฝูง */
export const UNIT_SPACING = 0.42;
/** จำนวนด่านต่อ 1 ยุค (ด่านสุดท้ายของยุคเป็นบอส/ปราสาท) */
export const LEVELS_PER_ERA = 5;
/** จำนวนยุคต่อ 1 ไทม์ไลน์ (ครบแล้วเริ่มไทม์ไลน์ใหม่ที่ยากขึ้น) */
export const ERAS_PER_TIMELINE = 6;
export const LEVELS_PER_TIMELINE = LEVELS_PER_ERA * ERAS_PER_TIMELINE;

/** รางวัลเคลียร์ยุค (stamina เกินหลอดได้) */
export const ERA_CLEAR_STAMINA = 5;
export const ERA_CLEAR_STARS = 10;
/** เหรียญเริ่มต้นเมื่อขึ้นยุคใหม่ */
export const ERA_START_COINS = 100;
/** เหรียญที่เหลือตอนจบยุค แลกเป็นดาว: กี่เหรียญต่อ 1 ดาว */
export const COINS_PER_STAR = 400;

/** การยิง */
export const BASE_FIRE_RATE = 2.2; // นัด/วินาที ต่อทหาร 1 ตัว
export const BASE_RANGE = 13; // ระยะยิง
export const PROJECTILE_SPEED = 26;
/** ระดับทหารในแคปซูล 1–10: แรงกว่าปกติกี่เท่า */
export const TIER_DAMAGE = [1, 1.6, 2.4, 3.5, 5, 7, 9.5, 12.5, 16, 20];
export const MAX_TIER = TIER_DAMAGE.length;

/** บอส */
export const BOSS_STOMP_INTERVAL = 1.7;
export const BOSS_STOMP_KILL = 0.1;

/** โอกาสที่วงล้อคูณรางวัลจะโผล่หลังชนะ (0–1) */
export const WHEEL_CHANCE = 0.4;
