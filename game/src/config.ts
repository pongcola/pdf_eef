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
/** จำนวนด่านต่อ 1 ยุค (ด่านสุดท้ายของยุคเป็นบอส) */
export const LEVELS_PER_ERA = 5;
/** จำนวนยุคต่อ 1 รอบ (เคลียร์ครบแล้วเริ่มรอบใหม่ที่ยากขึ้น) */
export const ERAS_PER_CYCLE = 6;
export const LEVELS_PER_CYCLE = LEVELS_PER_ERA * ERAS_PER_CYCLE;

/** การยิง */
export const BASE_FIRE_RATE = 2.2; // นัด/วินาที ต่อทหาร 1 ตัว
export const BASE_RANGE = 13; // ระยะยิง
export const PROJECTILE_SPEED = 26;
/** ทหารพิเศษ (จากแท่นเก็บทหาร) แรงกว่าปกติกี่เท่า */
export const ELITE_DAMAGE = 2.5;

/** บอส */
export const BOSS_STOMP_INTERVAL = 1.7;
export const BOSS_STOMP_KILL = 0.1;

/** โอกาสที่วงล้อคูณรางวัลจะโผล่หลังชนะ (0–1) */
export const WHEEL_CHANCE = 0.4;
