// ค่าตั้งหลักของเกม — แก้ตรงนี้ที่เดียว

/** Stamina สูงสุด */
export const STAMINA_MAX = 10;
/** ใช้ stamina กี่หน่วยต่อการเล่น 1 ด่าน */
export const STAMINA_RUN_COST = 1;
/** ฟื้น stamina +1 ทุกๆ กี่มิลลิวินาที (5 นาที) */
export const STAMINA_REGEN_MS = 5 * 60 * 1000;

/** ความกว้างของถนน (หน่วยโลก 3D) */
export const TRACK_WIDTH = 10;
/** ความเร็ววิ่ง (หน่วย/วินาที) */
export const RUN_SPEED = 9;
/** จำนวนตัวละครที่วาดจริงสูงสุด (ตัวเลขยังนับเกินได้) */
export const MAX_VISIBLE_UNITS = 300;
/** จำนวนศัตรูที่วาดจริงสูงสุดต่อกลุ่ม */
export const MAX_VISIBLE_ENEMIES = 120;
/** ระยะห่างระหว่างตัวละครในฝูง */
export const UNIT_SPACING = 0.27;
/** จำนวนด่านต่อ 1 ยุค (ด่านสุดท้ายของยุคเป็นบอสใหญ่) */
export const LEVELS_PER_ERA = 5;

/** บอสโจมตีทุกกี่วินาที และฆ่ากี่ % ของฝูง */
export const BOSS_STOMP_INTERVAL = 1.0;
export const BOSS_STOMP_KILL = 0.08;
