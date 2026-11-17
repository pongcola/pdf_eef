// เสียงทั้งหมดสังเคราะห์สดด้วย WebAudio — ไม่ต้องมีไฟล์เสียง

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxOn = true;
let musicOn = true;
let musicTimer: number | null = null;
let nextNoteTime = 0;
let step = 0;
let lastPop = 0;
let lastShot = 0;
let lastTick = 0;
let unlocked = false;

function ensure(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** ต้องเรียกจากการแตะของผู้ใช้ครั้งแรก (ข้อกำหนดของเบราว์เซอร์) */
export function unlockAudio(): void {
  unlocked = true;
  ensure();
  if (musicOn) startMusic();
}

export function setSound(on: boolean): void {
  sfxOn = on;
}

export function setMusic(on: boolean): void {
  musicOn = on;
  if (on && unlocked) startMusic();
  else stopMusic();
}

export function suspendAudio(): void {
  if (ctx && ctx.state === 'running') void ctx.suspend();
}

export function resumeAudio(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, endFreq: number, dur: number, type: OscillatorType, vol: number, delay = 0, dest?: AudioNode): void {
  if (!unlocked) return;
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (endFreq !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(dest ?? master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, freq: number): void {
  if (!unlocked) return;
  const c = ensure();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
}

export const sfx = {
  click() {
    if (sfxOn) tone(660, 880, 0.07, 'triangle', 0.25);
  },
  gateGood() {
    if (!sfxOn) return;
    tone(523, 523, 0.09, 'square', 0.12);
    tone(659, 659, 0.09, 'square', 0.12, 0.07);
    tone(784, 1046, 0.16, 'square', 0.12, 0.14);
  },
  gateBad() {
    if (!sfxOn) return;
    tone(392, 196, 0.3, 'sawtooth', 0.12);
  },
  pop() {
    if (!sfxOn || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastPop < 0.045) return;
    lastPop = now;
    tone(300 + Math.random() * 200, 120, 0.08, 'triangle', 0.14);
  },
  stomp() {
    if (!sfxOn) return;
    tone(110, 40, 0.4, 'sine', 0.6);
    noise(0.3, 0.35, 600);
  },
  hit() {
    if (!sfxOn) return;
    noise(0.06, 0.12, 2000);
  },
  win() {
    if (!sfxOn) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.22, 'square', 0.13, i * 0.11));
    tone(1318, 1318, 0.5, 'triangle', 0.16, 0.46);
  },
  lose() {
    if (!sfxOn) return;
    [392, 349, 311, 262].forEach((f, i) => tone(f, f * 0.98, 0.26, 'triangle', 0.18, i * 0.16));
  },
  coin() {
    if (!sfxOn) return;
    tone(988, 988, 0.06, 'square', 0.1);
    tone(1318, 1318, 0.14, 'square', 0.1, 0.06);
  },
  shoot() {
    if (!sfxOn || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastShot < 0.08) return;
    lastShot = now;
    tone(700 + Math.random() * 200, 380, 0.04, 'triangle', 0.035);
  },
  tick() {
    if (!sfxOn || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastTick < 0.06) return;
    lastTick = now;
    tone(1250, 1250, 0.03, 'square', 0.03);
  },
  breakBlock() {
    if (!sfxOn) return;
    noise(0.22, 0.32, 1400);
    tone(220, 70, 0.18, 'square', 0.1);
  },
  join() {
    if (!sfxOn) return;
    [660, 880, 1175].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.14, i * 0.06));
  },
  evolve() {
    if (!sfxOn) return;
    [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f * 1.01, 0.18, 'triangle', 0.16, i * 0.08));
  },
};

// เพลงประกอบสั้นๆ วนซ้ำ (C - Am - F - G)
const CHORDS = [
  [261.6, 329.6, 392.0],
  [220.0, 261.6, 329.6],
  [174.6, 220.0, 261.6],
  [196.0, 246.9, 293.7],
];
const BASS = [130.8, 110.0, 87.3, 98.0];
const BEAT = 60 / 112 / 2;

function scheduleMusic(): void {
  if (!ctx || !musicGain) return;
  while (nextNoteTime < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 8) % 4;
    const s = step % 8;
    const delay = Math.max(0, nextNoteTime - ctx.currentTime);
    if (s % 4 === 0) tone(BASS[bar], BASS[bar], BEAT * 1.8, 'triangle', 0.5, delay, musicGain);
    const chord = CHORDS[bar];
    const note = chord[[0, 1, 2, 1, 2, 1, 0, 2][s]] * 2;
    tone(note, note, BEAT * 0.9, 'square', 0.12, delay, musicGain);
    if (s === 2 || s === 6) tone(note * 1.5, note * 1.5, BEAT * 0.6, 'triangle', 0.08, delay, musicGain);
    nextNoteTime += BEAT;
    step++;
  }
}

function startMusic(): void {
  const c = ensure();
  if (!c || musicTimer !== null) return;
  nextNoteTime = c.currentTime + 0.1;
  musicTimer = window.setInterval(scheduleMusic, 90);
}

function stopMusic(): void {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
