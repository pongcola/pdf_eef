import { LEVELS_PER_ERA, STAMINA_MAX, STAMINA_RUN_COST } from '../config.ts';
import type { UpgradeId } from '../economy.ts';
import type { EraDef } from '../eras.ts';
import type { SaveData } from '../save.ts';
import { formatMs, msToNextStamina, refreshStamina } from '../stamina.ts';
import { sfx, unlockAudio } from '../audio.ts';

export interface UIHandlers {
  play(): void;
  upgrade(id: UpgradeId): void;
  pause(): void;
  resume(): void;
  quit(): void;
  menu(): void;
  toggle(key: 'sound' | 'music' | 'vibration'): void;
  reset(): void;
  /** วงล้อหยุดที่ตัวคูณ mult; คืนค่ารางวัลรวม */
  wheel(mult: number): number;
}

export interface MenuData {
  save: SaveData;
  now: number;
  era: EraDef;
  upgrades: {
    id: UpgradeId;
    name: string;
    icon: string;
    color: string;
    lvl: number;
    desc: string;
    cost: number;
    affordable: boolean;
  }[];
}

export interface ResultData {
  win: boolean;
  level: number;
  reward: number;
  collected: number;
  survivors: number;
  evolved: EraDef | null;
  /** > 0 เมื่อเพิ่งเริ่มรอบใหม่ (เลขรอบ) */
  newCycle: number;
  castle: boolean;
  wheel: boolean;
  income: number;
  save: SaveData;
}

export interface HudStats {
  coins: number;
  troops: number;
  cap: number;
  rate: number;
  range: number;
  power: number;
}

const ERA_ICONS = ['🪨', '🏛️', '🛡️', '💥', '🚁', '🚀'];
const WHEEL = [
  { m: 1.5, c: '#3f8cff' },
  { m: 2, c: '#2fbf63' },
  { m: 1.2, c: '#8a63ff' },
  { m: 3, c: '#ff4f6d' },
  { m: 1.5, c: '#3f8cff' },
  { m: 2, c: '#2fbf63' },
  { m: 1.2, c: '#8a63ff' },
  { m: 2.5, c: '#ff9f1c' },
];

export function fmt(n: number): string {
  n = Math.round(n);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  return n.toLocaleString('en-US');
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export class UI {
  private h: UIHandlers;
  private labels: HTMLElement;
  private floaters: HTMLElement;
  private menu: HTMLElement;
  private hud: HTMLElement;
  private hint: HTMLElement;
  private bossbar: HTMLElement;
  private pauseModal: HTMLElement;
  private resultModal: HTMLElement;
  private settingsModal: HTMLElement;
  private toastEl: HTMLElement;
  private crowdLabel: HTMLElement;
  private dmgPool: HTMLElement[] = [];
  private dmgNext = 0;
  private lastTick = 0;
  private resetArmed = 0;
  private hudKey = '';
  private wheelSpun = false;

  constructor(root: HTMLElement, h: UIHandlers) {
    this.h = h;
    this.labels = el('div', 'labels');
    this.floaters = el('div', 'floaters');
    root.append(this.labels, this.floaters);
    this.crowdLabel = el('div', 'label crowd');
    this.labels.append(this.crowdLabel);
    for (let i = 0; i < 36; i++) {
      const d = el('div', 'dmg');
      d.style.display = 'none';
      this.floaters.append(d);
      this.dmgPool.push(d);
    }

    this.menu = el(
      'div',
      'screen menu hidden',
      `
      <div class="topbar">
        <div class="pill coins"><span class="ic">🪙</span><b data-coins>0</b></div>
        <div class="pill stamina"><span class="ic">⚡</span><b data-st>10/10</b><small data-st-timer></small></div>
        <button class="icon-btn" data-act="settings" aria-label="ตั้งค่า">⚙️</button>
      </div>
      <div class="title">
        <div class="logo"><span>CROWD</span><span>AGES</span></div>
        <div class="subtitle">ยุคแห่งฝูงชน</div>
        <div class="era-card">
          <div class="era-name" data-era></div>
          <div class="era-dots" data-dots></div>
        </div>
      </div>
      <div class="bottom">
        <div class="upgrades" data-upgrades></div>
        <button class="play-btn" data-act="play"><span data-play-text>เล่น</span><em>⚡${STAMINA_RUN_COST}</em></button>
        <div class="play-sub" data-playsub></div>
      </div>`,
    );
    root.append(this.menu);

    this.hud = el(
      'div',
      'hud hidden',
      `
      <div class="hud-top">
        <div class="lvl-chip" data-hudlvl>ด่าน 1</div>
        <div class="progress"><div class="bar" data-prog></div><span class="boss-ic" data-bossic>💎</span></div>
        <button class="icon-btn" data-act="pause" aria-label="หยุด">⏸</button>
      </div>
      <div class="hud-row">
        <div class="chip gold">🪙 <b data-hcoins>0</b></div>
        <div class="chip">🧍 <b data-htroops>1/8</b></div>
      </div>
      <div class="hud-stats" data-hstats></div>`,
    );
    root.append(this.hud);

    this.hint = el('div', 'hint hidden', `<div class="hand">👆</div><div>ลากนิ้วซ้าย–ขวา ทหารจะยิงเอง</div>`);
    root.append(this.hint);

    this.bossbar = el(
      'div',
      'bossbar hidden',
      `<div class="boss-name" data-bossname>บอส</div><div class="hp"><div class="hp-fill" data-hp></div><span data-hptext></span></div>`,
    );
    root.append(this.bossbar);

    this.pauseModal = el(
      'div',
      'modal hidden',
      `<div class="card">
        <div class="card-title">หยุดชั่วคราว</div>
        <button class="play-btn" data-act="resume"><span>เล่นต่อ</span></button>
        <button class="ghost-btn" data-act="quit">ออกไปเมนู</button>
        <div class="note">ถ้าออก stamina ที่ใช้ไปแล้วจะไม่คืนนะ</div>
      </div>`,
    );
    root.append(this.pauseModal);

    this.resultModal = el('div', 'modal hidden');
    root.append(this.resultModal);
    this.settingsModal = el('div', 'modal hidden');
    root.append(this.settingsModal);
    this.toastEl = el('div', 'toast hidden');
    root.append(this.toastEl);

    root.addEventListener('click', (e) => this.onClick(e));
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
  }

  private q<T extends HTMLElement = HTMLElement>(scope: HTMLElement, sel: string): T {
    return scope.querySelector(sel) as T;
  }

  private onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-upg]');
    if (!t || (t as HTMLButtonElement).disabled) return;
    const upg = t.dataset.upg as UpgradeId | undefined;
    if (upg) {
      this.h.upgrade(upg);
      return;
    }
    const act = t.dataset.act;
    if (act !== 'play' && act !== 'resume' && act !== 'spin') sfx.click();
    switch (act) {
      case 'play':
        this.h.play();
        break;
      case 'pause':
        this.h.pause();
        break;
      case 'resume':
        this.h.resume();
        break;
      case 'quit':
        this.h.quit();
        break;
      case 'menu':
        this.h.menu();
        break;
      case 'spin':
        this.spinWheel();
        break;
      case 'settings':
        this.settingsModal.classList.remove('hidden');
        break;
      case 'close-settings':
        this.settingsModal.classList.add('hidden');
        this.resetArmed = 0;
        break;
      case 'toggle':
        this.h.toggle(t.dataset.key as 'sound' | 'music' | 'vibration');
        break;
      case 'reset': {
        const now = performance.now();
        if (now - this.resetArmed < 3000) {
          this.resetArmed = 0;
          this.settingsModal.classList.add('hidden');
          this.h.reset();
          this.toast('เริ่มใหม่ทั้งหมดแล้ว');
        } else {
          this.resetArmed = now;
          this.toast('แตะอีกครั้งเพื่อยืนยันการลบความคืบหน้า');
        }
        break;
      }
    }
  }

  closeOverlays(): boolean {
    if (!this.settingsModal.classList.contains('hidden')) {
      this.settingsModal.classList.add('hidden');
      return true;
    }
    return false;
  }

  // ---------- เมนู ----------

  showMenu(d: MenuData): void {
    this.menu.classList.remove('hidden');
    this.q(this.menu, '[data-coins]').textContent = fmt(d.save.coins);
    const cycle = d.save.cycle > 1 ? `<span class="cycle">รอบ ${d.save.cycle}</span>` : '';
    this.q(this.menu, '[data-era]').innerHTML = `${cycle}${ERA_ICONS[d.era.id]} ${d.era.nameTh} <small>${d.era.nameEn}</small>`;
    const inEra = ((d.save.level - 1) % LEVELS_PER_ERA) + 1;
    const dots = this.q(this.menu, '[data-dots]');
    dots.innerHTML = '';
    for (let i = 1; i <= LEVELS_PER_ERA; i++) {
      const dot = el('span', 'dot' + (i < inEra ? ' done' : i === inEra ? ' cur' : '') + (i === LEVELS_PER_ERA ? ' boss' : ''));
      dot.textContent = i === LEVELS_PER_ERA ? '👑' : String(d.save.level - inEra + i);
      dots.append(dot);
    }
    const list = this.q(this.menu, '[data-upgrades]');
    list.innerHTML = '';
    for (const u of d.upgrades) {
      const b = el(
        'button',
        'upg' + (u.affordable ? ' can' : ''),
        `<div class="upg-head" style="background:${u.color}">${u.name}</div>
         <div class="upg-ic">${u.icon}</div>
         <div class="upg-lvl">Lv.${u.lvl + 1}</div>
         <div class="upg-desc">${u.desc}</div>
         <div class="upg-cost">🪙 ${fmt(u.cost)}</div>`,
      );
      b.dataset.upg = u.id;
      list.append(b);
    }
    this.q(this.menu, '[data-play-text]').textContent = `เล่น ด่าน ${d.save.level}`;
    this.lastTick = 0;
    this.tickMenu(d.save, d.now);
  }

  hideMenu(): void {
    this.menu.classList.add('hidden');
  }

  tickMenu(save: SaveData, now: number): void {
    if (now - this.lastTick < 250) return;
    this.lastTick = now;
    refreshStamina(save.stamina, now);
    const st = save.stamina.value;
    this.q(this.menu, '[data-st]').textContent = `${st}/${STAMINA_MAX}`;
    const next = msToNextStamina(save.stamina, now);
    this.q(this.menu, '[data-st-timer]').textContent = next > 0 ? `+1 ใน ${formatMs(next)}` : 'เต็ม';
    const btn = this.q<HTMLButtonElement>(this.menu, '[data-act="play"]');
    const can = st >= STAMINA_RUN_COST;
    btn.disabled = !can;
    this.q(this.menu, '[data-playsub]').textContent = can
      ? 'ไม่มีโฆษณา • Stamina +1 ทุก 5 นาที'
      : `Stamina หมด • ได้ +1 ใน ${formatMs(next)}`;
  }

  // ---------- ระหว่างเล่น ----------

  showHud(level: number, cycle: number, eraBoss: boolean): void {
    this.hud.classList.remove('hidden');
    this.q(this.hud, '[data-hudlvl]').textContent = cycle > 1 ? `รอบ ${cycle} • ด่าน ${level}` : `ด่าน ${level}`;
    this.q(this.hud, '[data-bossic]').textContent = eraBoss ? '👑' : '💎';
    this.hudKey = '';
    this.setProgress(0);
  }

  hideHud(): void {
    this.hud.classList.add('hidden');
    this.showHint(false);
  }

  setProgress(p: number): void {
    this.q(this.hud, '[data-prog]').style.width = `${Math.round(p * 1000) / 10}%`;
  }

  setHudStats(s: HudStats): void {
    const key = `${s.coins}|${s.troops}|${s.cap}|${s.rate.toFixed(2)}|${s.range.toFixed(2)}|${s.power.toFixed(2)}`;
    if (key === this.hudKey) return;
    this.hudKey = key;
    this.q(this.hud, '[data-hcoins]').textContent = fmt(s.coins);
    const tr = this.q(this.hud, '[data-htroops]');
    tr.textContent = `${s.troops}/${s.cap}`;
    tr.parentElement!.classList.toggle('full', s.troops >= s.cap);
    const chip = (ic: string, name: string, v: number) =>
      `<div class="stat ${v > 1.001 ? 'up' : v < 0.999 ? 'down' : ''}">${ic} ${name} ×${v.toFixed(2)}</div>`;
    this.q(this.hud, '[data-hstats]').innerHTML =
      chip('🔥', 'อัตรายิง', s.rate) + chip('🎯', 'ระยะ', s.range) + chip('💥', 'พลัง', s.power);
  }

  showHint(on: boolean): void {
    this.hint.classList.toggle('hidden', !on);
  }

  showPause(on: boolean): void {
    this.pauseModal.classList.toggle('hidden', !on);
  }

  makeLabel(kind: 'enemy' | 'hp'): HTMLElement {
    const l = el('div', kind === 'hp' ? 'label hpl' : `label ${kind}`);
    l.style.display = 'none';
    this.labels.append(l);
    return l;
  }

  setLabel(l: HTMLElement, n: number, x: number, y: number, vis: boolean): void {
    if (!vis || n <= 0) {
      if (l.style.display !== 'none') l.style.display = 'none';
      return;
    }
    if (l.style.display === 'none') l.style.display = '';
    const txt = fmt(n);
    if (l.textContent !== txt) l.textContent = txt;
    l.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }

  setCrowdLabel(n: number, x: number, y: number, vis: boolean): void {
    this.setLabel(this.crowdLabel, n, x, y, vis);
  }

  /** ตัวเลขดาเมจเด้งขึ้น (ใช้ element ซ้ำ ไม่สร้างใหม่) */
  damageNumber(n: number, x: number, y: number): void {
    if (n <= 0) return;
    const d = this.dmgPool[this.dmgNext];
    this.dmgNext = (this.dmgNext + 1) % this.dmgPool.length;
    d.textContent = fmt(n);
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    d.style.display = '';
    d.classList.remove('go');
    void d.offsetWidth;
    d.classList.add('go');
  }

  floatText(text: string, x: number, y: number, good: boolean): void {
    const f = el('div', 'floater ' + (good ? 'good' : 'bad'));
    f.textContent = text;
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    this.floaters.append(f);
    setTimeout(() => f.remove(), 1000);
  }

  coinPop(text: string, x: number, y: number): void {
    const f = el('div', 'floater coin');
    f.textContent = `🪙${text}`;
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    this.floaters.append(f);
    setTimeout(() => f.remove(), 1000);
  }

  showBossBar(eraBoss: boolean): void {
    this.bossbar.classList.remove('hidden');
    this.q(this.bossbar, '[data-bossname]').textContent = eraBoss ? '👑 ราชันแห่งยุค' : '💀 บอส';
  }

  hideBossBar(): void {
    this.bossbar.classList.add('hidden');
  }

  setBossHp(frac: number, hp: number): void {
    this.q(this.bossbar, '[data-hp]').style.width = `${Math.max(0, frac) * 100}%`;
    this.q(this.bossbar, '[data-hptext]').textContent = fmt(Math.ceil(hp));
  }

  placeBossBar(x: number, y: number): void {
    const top = Math.max(120, Math.min(window.innerHeight * 0.4, y));
    this.bossbar.style.transform = `translate(${x.toFixed(1)}px, ${top.toFixed(1)}px) translate(-50%, -100%)`;
  }

  // ---------- ผลลัพธ์ ----------

  showResult(r: ResultData): void {
    const st = r.save.stamina;
    const next = msToNextStamina(st, Date.now());
    const can = st.value >= STAMINA_RUN_COST;
    const stLine = `⚡ ${st.value}/${STAMINA_MAX}` + (next > 0 ? ` • +1 ใน ${formatMs(next)}` : '');
    const nextLabel = r.newCycle ? `เริ่มรอบ ${r.newCycle}` : `ด่านต่อไป (${r.save.level})`;
    const segAngle = 360 / WHEEL.length;
    const wheelHtml = r.wheel
      ? `<div class="wheel-box" data-wheelbox>
          <div class="wheel-title">🎁 วงล้อโชค! หมุนฟรี</div>
          <div class="wheel-wrap">
            <div class="wheel-pointer">▼</div>
            <div class="wheel" data-wheel style="background:conic-gradient(${WHEEL.map((s, i) => `${s.c} ${i * segAngle}deg ${(i + 1) * segAngle}deg`).join(',')})">
              ${WHEEL.map((s, i) => `<span style="transform:rotate(${i * segAngle + segAngle / 2}deg)"><b>×${s.m}</b></span>`).join('')}
            </div>
          </div>
          <button class="spin-btn" data-act="spin">หมุน!</button>
        </div>`
      : '';
    this.wheelSpun = false;
    this.resultModal.innerHTML = `
      <div class="card result ${r.win ? 'win' : 'lose'}">
        <div class="result-title">${r.win ? 'ชนะ!' : 'พ่ายแพ้'}</div>
        <div class="result-sub">${r.win ? `ผ่านด่าน ${r.level} แล้ว${r.castle ? ' • ทะลวงปราสาท!' : ''}` : `ด่าน ${r.level} • ลองใหม่อีกครั้ง`}</div>
        ${
          r.newCycle
            ? `<div class="evolve"><div class="evolve-ic">🔁</div><div>เคลียร์ครบทุกยุค! เริ่ม<br><b>รอบที่ ${r.newCycle}</b><br><small>ด่านยากขึ้น • ทหารเริ่มต้นเหลือ 1 คน</small></div></div>`
            : r.evolved
              ? `<div class="evolve"><div class="evolve-ic">${ERA_ICONS[r.evolved.id]}</div><div>วิวัฒนาการสู่<br><b>${r.evolved.nameTh}</b></div></div>`
              : ''
        }
        <div class="stats">
          ${r.win ? `<div><span>ทหารรอดชีวิต</span><b>${fmt(r.survivors)}</b></div>` : ''}
          <div><span>เหรียญที่ได้</span><b class="gold" data-reward>+${fmt(r.reward)} 🪙</b></div>
        </div>
        ${wheelHtml}
        <button class="play-btn" data-act="play" ${can ? '' : 'disabled'}>
          <span>${r.win ? nextLabel : 'ลองอีกครั้ง'}</span><em>⚡${STAMINA_RUN_COST}</em>
        </button>
        <button class="ghost-btn" data-act="menu">เมนู / อัปเกรด</button>
        <div class="note">${stLine}</div>
      </div>`;
    this.resultModal.classList.remove('hidden');
  }

  private spinWheel(): void {
    if (this.wheelSpun) return;
    this.wheelSpun = true;
    const wheel = this.q(this.resultModal, '[data-wheel]');
    const btn = this.q<HTMLButtonElement>(this.resultModal, '[data-act="spin"]');
    btn.disabled = true;
    // ตัวคูณสูงออกยากกว่า
    const weights = WHEEL.map((s) => 1 / s.m);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let idx = 0;
    for (; idx < WHEEL.length - 1; idx++) {
      if (r < weights[idx]) break;
      r -= weights[idx];
    }
    const seg = 360 / WHEEL.length;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const angle = 360 * 5 + (360 - (idx * seg + seg / 2)) + jitter;
    sfx.click();
    wheel.style.transition = 'transform 2.6s cubic-bezier(0.15, 0.85, 0.25, 1)';
    wheel.style.transform = `rotate(${angle}deg)`;
    window.setTimeout(() => {
      const mult = WHEEL[idx].m;
      const total = this.h.wheel(mult);
      sfx.win();
      btn.textContent = `ได้ ×${mult}!`;
      const rw = this.q(this.resultModal, '[data-reward]');
      rw.textContent = `+${fmt(total)} 🪙`;
      rw.classList.add('bump');
    }, 2700);
  }

  hideResult(): void {
    this.resultModal.classList.add('hidden');
  }

  // ---------- ตั้งค่า ----------

  renderSettings(s: SaveData['settings']): void {
    const row = (key: string, label: string, on: boolean) =>
      `<button class="toggle ${on ? 'on' : ''}" data-act="toggle" data-key="${key}"><span>${label}</span><i></i></button>`;
    this.settingsModal.innerHTML = `
      <div class="card settings">
        <div class="card-title">ตั้งค่า</div>
        ${row('sound', '🔊 เสียงเอฟเฟกต์', s.sound)}
        ${row('music', '🎵 เพลง', s.music)}
        ${row('vibration', '📳 การสั่น', s.vibration)}
        <div class="howto">
          <b>วิธีเล่น</b><br>
          ลากนิ้วซ้าย–ขวา ทหารจะยิงเอง • ยิงสิ่งกีดขวางให้แตกก่อนชน • ยิงป้าย (อัตรายิง/ระยะ/พลัง) ให้เป็นสีเขียวแล้ววิ่งผ่าน •
          ยิงกรงเพื่อช่วยเพื่อน • ยิงแคปซูลบนแท่นแล้ววิ่งผ่านเพื่อรับทหารพิเศษ • ท้ายด่านยิงคริสตัลเก็บเหรียญ • ทุก 5 ด่านสู้ราชันแห่งยุค 👑
        </div>
        <div class="note">ไม่มีโฆษณา • เล่นออฟไลน์ได้ • Stamina +1 ทุก 5 นาที (สูงสุด ${STAMINA_MAX})</div>
        <button class="ghost-btn danger" data-act="reset">ลบความคืบหน้าทั้งหมด</button>
        <button class="play-btn" data-act="close-settings"><span>ปิด</span></button>
      </div>`;
  }

  toast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('hidden');
    this.toastEl.classList.remove('show');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
    window.clearTimeout((this.toastEl as unknown as { _t?: number })._t);
    (this.toastEl as unknown as { _t?: number })._t = window.setTimeout(() => this.toastEl.classList.add('hidden'), 2200);
  }
}
