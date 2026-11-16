import { STAMINA_MAX, STAMINA_REGEN_MS, STAMINA_RUN_COST } from './config.ts';

export interface StaminaState {
  value: number;
  /** เวลาเริ่มนับรอบฟื้นปัจจุบัน (ms) */
  lastTick: number;
}

/**
 * อัปเดต stamina ตามเวลาจริง (+1 ทุก STAMINA_REGEN_MS)
 * คำนวณจากเวลาที่บันทึกไว้ ดังนั้นปิดแอปแล้ว stamina ก็ยังฟื้นต่อ
 */
export function refreshStamina(s: StaminaState, now: number): StaminaState {
  // นาฬิกาเครื่องถูกย้อนหลัง → เริ่มนับรอบใหม่ ไม่ให้ค้าง
  if (now < s.lastTick) s.lastTick = now;
  if (s.value >= STAMINA_MAX) {
    s.value = Math.max(s.value, STAMINA_MAX);
    s.lastTick = now;
    return s;
  }
  const ticks = Math.floor((now - s.lastTick) / STAMINA_REGEN_MS);
  if (ticks > 0) {
    s.value = Math.min(STAMINA_MAX, s.value + ticks);
    s.lastTick = s.value >= STAMINA_MAX ? now : s.lastTick + ticks * STAMINA_REGEN_MS;
  }
  return s;
}

/** มิลลิวินาทีจนกว่าจะได้ +1 (0 ถ้าเต็มแล้ว) */
export function msToNextStamina(s: StaminaState, now: number): number {
  if (s.value >= STAMINA_MAX) return 0;
  return Math.max(0, s.lastTick + STAMINA_REGEN_MS - now);
}

/** มิลลิวินาทีจนกว่าจะเต็มหลอด */
export function msToFullStamina(s: StaminaState, now: number): number {
  if (s.value >= STAMINA_MAX) return 0;
  return msToNextStamina(s, now) + (STAMINA_MAX - s.value - 1) * STAMINA_REGEN_MS;
}

export function canPlay(s: StaminaState): boolean {
  return s.value >= STAMINA_RUN_COST;
}

export function consumeStamina(s: StaminaState, now: number): boolean {
  refreshStamina(s, now);
  if (s.value < STAMINA_RUN_COST) return false;
  // ถ้าเดิมเต็มอยู่ เริ่มนับรอบฟื้นจากตอนนี้
  if (s.value >= STAMINA_MAX) s.lastTick = now;
  s.value -= STAMINA_RUN_COST;
  return true;
}

export function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
