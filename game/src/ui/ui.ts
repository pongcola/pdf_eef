import { LEVELS_PER_ERA, STAMINA_MAX, STAMINA_RUN_COST } from '../config.ts';
import type { MetaId, UpgradeId } from '../economy.ts';
import type { EraDef } from '../eras.ts';
import { applySkins, artUrl, ico } from './art.ts';
import { unlockText, type HeroDef } from '../heroes.ts';
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
  meta(id: MetaId): void;
  timeline(justCleared: boolean): TimelineData;
  team(): TeamData;
  heroUpgrade(id: number): void;
  heroEquip(id: number): void;
}

export interface TeamData {
  trophies: number;
  equipped: number;
  heroes: { def: HeroDef; lvl: number; atk: number; cost: number; unlocked: boolean; affordable: boolean }[];
}

export interface TimelineData {
  timeline: number;
  current: number;
  justCleared: boolean;
  eras: { era: EraDef; state: 'clear' | 'current' | 'next' | 'locked' }[];
}

export interface CampData {
  stars: number;
  items: { id: MetaId; name: string; icon: string; lvl: number; max: number; desc: string; next: string; cost: number; maxed: boolean; affordable: boolean }[];
}

export interface EraClearInfo {
  from: EraDef;
  to: EraDef;
  timeline: number;
  newTimeline: boolean;
  stamina: number;
  stars: number;
  converted: number;
  startCoins: number;
}

export interface MenuData {
  save: SaveData;
  now: number;
  era: EraDef;
  timeline: number;
  upgrades: {
    id: UpgradeId;
    name: string;
    icon: string;
    color: string;
    note: string;
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
  stars: number;
  trophies: number;
  collected: number;
  survivors: number;
  eraClear: EraClearInfo | null;
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

const WHEEL = [
  { m: 1.5, c: '#7cb8ff' },
  { m: 2, c: '#5fd9a4' },
  { m: 1.2, c: '#b9a3ff' },
  { m: 3, c: '#ff7f95' },
  { m: 1.5, c: '#7cb8ff' },
  { m: 2, c: '#5fd9a4' },
  { m: 1.2, c: '#b9a3ff' },
  { m: 2.5, c: '#ffa47d' },
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
  private campModal: HTMLElement;
  private timelineModal: HTMLElement;
  private teamModal: HTMLElement;
  private teamSel = -1;
  private teamTab = 'hero';
  private toastEl: HTMLElement;
  private crowdLabel: HTMLElement;
  private dmgPool: HTMLElement[] = [];
  private dmgNext = 0;
  private lastTick = 0;
  private resetArmed = 0;
  private hudKey = '';
  private wheelSpun = false;
  private lastEc: EraClearInfo | null = null;

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
        <div class="pill coins">${ico('coin', 'ic')}<b data-coins>0</b></div>
        <div class="pill stars">${ico('star', 'ic')}<b data-stars>0</b></div>
        <div class="pill stamina">${ico('stamina', 'ic')}<b data-st>10/10</b><small data-st-timer></small></div>
        <button class="icon-btn" data-act="settings" aria-label="ตั้งค่า">${ico('settings')}</button>
      </div>
      <div class="title">
        ${artUrl('logo') ? `<img class="logo-img" src="${artUrl('logo')}" alt="Crowd Ages">` : '<div class="logo"><span>CROWD</span><span>AGES</span></div>'}
        <div class="subtitle">ยุคแห่งฝูงชน</div>
        <button class="era-card" data-act="timeline">
          <div class="era-tl" data-tl></div>
          <div class="era-name" data-era></div>
          <div class="era-dots" data-dots></div>
        </button>
        <div class="side-btns">
          <button class="side-btn" data-act="timeline">${ico('timeline')}<span>ไทม์ไลน์</span></button>
          <button class="side-btn" data-act="camp">${ico('camp')}<span>ค่ายฝึก</span></button>
          <button class="side-btn" data-act="team">${ico('team')}<span>ฮีโร่</span></button>
        </div>
      </div>
      <div class="bottom">
        <div class="upgrades" data-upgrades></div>
        <button class="play-btn" data-act="play"><span data-play-text>เล่น</span><em>${ico('stamina')}${STAMINA_RUN_COST}</em></button>
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
        <div class="progress"><div class="bar" data-prog></div><span class="boss-ic" data-bossic></span></div>
        <button class="icon-btn" data-act="pause" aria-label="หยุด">${ico('pause')}</button>
      </div>
      <div class="hud-row">
        <div class="chip gold">${ico('coin')} <b data-hcoins>0</b></div>
        <div class="chip">${ico('troop')} <b data-htroops>1/8</b></div>
      </div>
      <div class="hud-stats" data-hstats></div>
      <div class="gauge" data-gauge>
        <div class="g-next" data-gnext>3</div>
        <div class="g-bar"><i data-gfill></i></div>
        <div class="g-ic">${ico('troop')}<b data-gcur>1</b></div>
      </div>`,
    );
    root.append(this.hud);

    this.hint = el('div', 'hint hidden', `<div class="hand">${ico('hand')}</div><div>ลากนิ้วซ้าย–ขวา ทหารจะยิงเอง</div>`);
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
    this.campModal = el('div', 'modal hidden');
    root.append(this.campModal);
    this.timelineModal = el('div', 'modal hidden');
    root.append(this.timelineModal);
    this.teamModal = el('div', 'modal hidden');
    root.append(this.teamModal);
    this.toastEl = el('div', 'toast hidden');
    root.append(this.toastEl);

    root.addEventListener('click', (e) => this.onClick(e));
    applySkins(root);
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
    const info = (e.target as HTMLElement).closest<HTMLElement>('[data-info]');
    if (info) {
      const card = info.closest<HTMLElement>('[data-upg]');
      if (card?.dataset.note) this.showNote(card, card.dataset.note);
      return;
    }
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-upg],[data-meta],[data-hero],[data-tab]');
    if (!t || (t as HTMLButtonElement).disabled) return;
    const upg = t.dataset.upg as UpgradeId | undefined;
    if (upg) {
      this.h.upgrade(upg);
      return;
    }
    const meta = t.dataset.meta as MetaId | undefined;
    if (meta) {
      this.h.meta(meta);
      return;
    }
    if (t.dataset.hero !== undefined) {
      this.teamSel = Number(t.dataset.hero);
      sfx.click();
      this.renderTeam(this.h.team());
      return;
    }
    if (t.dataset.tab) {
      this.teamTab = t.dataset.tab;
      sfx.click();
      this.renderTeam(this.h.team());
      return;
    }
    const act = t.dataset.act;
    if (act !== 'play' && act !== 'resume' && act !== 'spin') sfx.click();
    switch (act) {
      case 'play':
        this.timelineModal.classList.add('hidden');
        this.h.play();
        break;
      case 'timeline':
        this.showTimeline(this.h.timeline(false));
        break;
      case 'era-next':
        this.hideResult();
        this.showTimeline(this.h.timeline(true), this.lastEc);
        break;
      case 'close-timeline':
        this.timelineModal.classList.add('hidden');
        break;
      case 'timeline-menu':
        this.timelineModal.classList.add('hidden');
        this.h.menu();
        break;
      case 'camp':
        this.campModal.classList.remove('hidden');
        break;
      case 'close-camp':
        this.campModal.classList.add('hidden');
        break;
      case 'team':
        this.teamSel = -1;
        this.teamTab = 'hero';
        this.renderTeam(this.h.team());
        this.teamModal.classList.remove('hidden');
        break;
      case 'close-team':
        this.teamModal.classList.add('hidden');
        break;
      case 'hero-up':
        this.h.heroUpgrade(Number(t.dataset.id));
        break;
      case 'hero-eq':
        this.h.heroEquip(Number(t.dataset.id));
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

  /** กล่อง NOTE เหนือการ์ดอัปเกรด */
  private showNote(card: HTMLElement, text: string): void {
    this.menu.querySelector('.note-pop')?.remove();
    const pop = el('div', 'note-pop', `<b>NOTE</b><div>${text}</div>`);
    const r = card.getBoundingClientRect();
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - 228, r.left + r.width / 2 - 110))}px`;
    pop.style.bottom = `${window.innerHeight - r.top + 10}px`;
    this.menu.append(pop);
    window.setTimeout(() => pop.remove(), 3500);
  }

  closeOverlays(): boolean {
    for (const m of [this.settingsModal, this.campModal, this.timelineModal, this.teamModal]) {
      if (!m.classList.contains('hidden')) {
        m.classList.add('hidden');
        return true;
      }
    }
    return false;
  }

  // ---------- เมนู ----------

  showMenu(d: MenuData): void {
    this.menu.classList.remove('hidden');
    this.q(this.menu, '[data-coins]').textContent = fmt(d.save.coins);
    this.q(this.menu, '[data-stars]').textContent = fmt(d.save.stars);
    this.q(this.menu, '[data-tl]').textContent = `ไทม์ไลน์ ${d.timeline}`;
    this.q(this.menu, '[data-era]').innerHTML = `${ico(`era_${d.era.id}`)} ${d.era.nameTh} <small>${d.era.nameEn}</small>`;
    const inEra = ((d.save.level - 1) % LEVELS_PER_ERA) + 1;
    const dots = this.q(this.menu, '[data-dots]');
    dots.innerHTML = '';
    for (let i = 1; i <= LEVELS_PER_ERA; i++) {
      const dot = el('span', 'dot' + (i < inEra ? ' done' : i === inEra ? ' cur' : '') + (i === LEVELS_PER_ERA ? ' boss' : ''));
      dot.innerHTML = i === LEVELS_PER_ERA ? ico('crown') : String(d.save.level - inEra + i);
      dots.append(dot);
    }
    const list = this.q(this.menu, '[data-upgrades]');
    list.innerHTML = '';
    for (const u of d.upgrades) {
      const b = el(
        'button',
        'upg' + (u.affordable ? ' can' : ''),
        `<div class="upg-head" style="background:${u.color}">${u.name}</div>
         <span class="upg-info" data-info="${u.id}" role="button" aria-label="ข้อมูล">i</span>
         <div class="upg-ic">${ico(u.icon)}</div>
         <div class="upg-lvl">Lv.${u.lvl + 1}</div>
         <div class="upg-desc">${u.desc}</div>
         <div class="upg-cost">${ico('coin')} ${fmt(u.cost)}</div>`,
      );
      b.dataset.upg = u.id;
      b.dataset.note = u.note;
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

  showHud(level: number, timeline: number, eraBoss: boolean): void {
    this.hud.classList.remove('hidden');
    this.q(this.hud, '[data-hudlvl]').textContent = timeline > 1 ? `TL${timeline} • ด่าน ${level}` : `ด่าน ${level}`;
    this.q(this.hud, '[data-bossic]').innerHTML = ico(eraBoss ? 'crown' : 'crystal');
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
    tr.textContent = String(s.troops);
    const chip = (ic: string, name: string, v: number) =>
      `<div class="stat ${v > 1.001 ? 'up' : v < 0.999 ? 'down' : ''}">${ico(ic)} ${name} ×${v.toFixed(2)}</div>`;
    this.q(this.hud, '[data-hstats]').innerHTML =
      chip('stat_rate', 'อัตรายิง', s.rate) + chip('stat_range', 'ระยะ', s.range) + chip('stat_power', 'พลัง', s.power);
  }

  showHint(on: boolean): void {
    this.hint.classList.toggle('hidden', !on);
  }

  showPause(on: boolean): void {
    this.pauseModal.classList.toggle('hidden', !on);
  }

  private gaugeKey = '';

  /** เกจด้านซ้าย: frac 0–1, count = จำนวนแคปซูลบนแท่นตอนนี้ (ล่าง) → ถัดไป (บน) */
  setGauge(frac: number, count: number, max: boolean): void {
    const key = `${Math.round(frac * 100)}|${count}|${max}`;
    if (key === this.gaugeKey) return;
    this.gaugeKey = key;
    this.q(this.hud, '[data-gfill]').style.height = `${Math.round(frac * 100)}%`;
    this.q(this.hud, '[data-gcur]').textContent = String(count);
    this.q(this.hud, '[data-gnext]').textContent = max ? 'MAX' : String(count + 1);
  }

  pulseGauge(): void {
    const g = this.q(this.hud, '[data-gauge]');
    g.classList.remove('pulse');
    void g.offsetWidth;
    g.classList.add('pulse');
  }

  /** ป้าย Level เหนือแท่นทหาร พร้อมแถบความคืบหน้า */
  setPadLabel(l: HTMLElement, level: number, frac: number, max: boolean, x: number, y: number, vis: boolean): void {
    if (!vis) {
      if (l.style.display !== 'none') l.style.display = 'none';
      return;
    }
    if (l.style.display === 'none') l.style.display = '';
    const key = `${level}|${Math.round(frac * 50)}|${max}`;
    if (l.dataset.k !== key) {
      l.dataset.k = key;
      l.innerHTML = `<i style="width:${Math.round(frac * 100)}%"></i><span>${max ? `Level ${level} MAX` : `Level ${level}`}</span>`;
    }
    l.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }

  makeLabel(kind: 'enemy' | 'hp' | 'tier' | 'pad'): HTMLElement {
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

  setLabelText(l: HTMLElement, text: string, x: number, y: number, vis: boolean): void {
    if (!vis) {
      if (l.style.display !== 'none') l.style.display = 'none';
      return;
    }
    if (l.style.display === 'none') l.style.display = '';
    if (l.textContent !== text) l.textContent = text;
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

  starPop(x: number, y: number): void {
    const f = el('div', 'floater star', `${ico('star')}+1`);
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    this.floaters.append(f);
    setTimeout(() => f.remove(), 1100);
  }

  coinPop(text: string, x: number, y: number): void {
    const f = el('div', 'floater coin', `${ico('coin')}${text}`);
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    this.floaters.append(f);
    setTimeout(() => f.remove(), 1000);
  }

  showBossBar(eraBoss: boolean): void {
    this.bossbar.classList.remove('hidden');
    this.q(this.bossbar, '[data-bossname]').innerHTML = eraBoss ? `${ico('crown')} ราชันแห่งยุค` : 'บอส';
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
    const stLine = `${ico('stamina')} ${st.value}/${STAMINA_MAX}` + (next > 0 ? ` • +1 ใน ${formatMs(next)}` : '');
    const segAngle = 360 / WHEEL.length;
    const wheelHtml = r.wheel
      ? `<div class="wheel-box" data-wheelbox>
          <div class="wheel-title">${ico('gift')} วงล้อโชค! หมุนฟรี</div>
          <div class="wheel-wrap">
            <div class="wheel-pointer">▼</div>
            <div class="wheel" data-wheel style="background:conic-gradient(${WHEEL.map((s, i) => `${s.c} ${i * segAngle}deg ${(i + 1) * segAngle}deg`).join(',')})">
              ${WHEEL.map((s, i) => `<span style="transform:rotate(${i * segAngle + segAngle / 2}deg)"><b>×${s.m}</b></span>`).join('')}
            </div>
          </div>
          <button class="spin-btn" data-act="spin">หมุน!</button>
        </div>`
      : '';
    const banner = r.win ? artUrl('banner_win') : artUrl('banner_lose');
    const title = banner
      ? `<img class="banner-img" src="${banner}" alt="">`
      : `<div class="result-title">${r.win ? 'ผ่านด่าน!' : 'พ่ายแพ้'}</div>`;
    const ec = r.eraClear;
    const buttons = ec
      ? `<button class="play-btn" data-act="era-next"><span>ไปยุคถัดไป</span></button>`
      : `<button class="play-btn" data-act="play" ${can ? '' : 'disabled'}>
          <span>${r.win ? `ด่านต่อไป (${r.save.level})` : 'ลองอีกครั้ง'}</span><em>${ico('stamina')}${STAMINA_RUN_COST}</em>
        </button>
        <button class="ghost-btn" data-act="menu">เมนู / อัปเกรด</button>`;
    this.wheelSpun = false;
    this.lastEc = r.eraClear;
    this.resultModal.innerHTML = `
      <div class="card result ${r.win ? 'win' : 'lose'}">
        ${title}
        <div class="result-sub">${r.win ? `ด่าน ${r.level}${r.castle ? ' • ทะลวงปราสาท!' : ''}${ec ? ` • เคลียร์${ec.from.nameTh}!` : ''}` : `ด่าน ${r.level} • ลองใหม่อีกครั้ง`}</div>
        <div class="rewards-title">— รางวัล —</div>
        <div class="rewards">
          <div class="rw coin">${ico('coin')}<b data-reward>+${fmt(r.reward)}</b></div>
          ${r.win ? `<div class="rw star">${ico('star')}<b>+${r.stars}</b></div>` : ''}
          ${r.trophies ? `<div class="rw trophy">${ico('trophy')}<b>+${r.trophies}</b></div>` : ''}
          ${ec ? `<div class="rw stamina">${ico('stamina')}<b>+${ec.stamina}</b></div>` : ''}
        </div>
        ${r.win && !ec ? `<div class="survivors">ทหารรอดชีวิต <b>${fmt(r.survivors)}</b></div>` : ''}
        ${wheelHtml}
        ${buttons}
        <div class="note">${stLine}</div>
      </div>`;
    applySkins(this.resultModal);
    this.resultModal.classList.remove('hidden');
  }

  /** หน้าไทม์ไลน์ยุค (justCleared = เพิ่งเคลียร์ยุค แสดงรางวัลและป้ายยุคใหม่) */
  showTimeline(d: TimelineData, ec?: EraClearInfo | null): void {
    const rows = [...d.eras]
      .map((e, i) => ({ ...e, i }))
      .reverse()
      .map(({ era, state, i }) => {
        const card = artUrl(`era_card_${i}` as never);
        const bg = card ? `background-image:url("${card}")` : `background:linear-gradient(135deg, #${era.sky.toString(16).padStart(6, '0')}, #${era.ground.toString(16).padStart(6, '0')})`;
        const badge =
          state === 'clear' ? `<span class="tl-badge clear">${ico('check')} เคลียร์แล้ว</span>`
          : state === 'current' ? `<span class="tl-badge cur">กำลังเล่น</span>`
          : state === 'next' ? `<span class="tl-badge next">ถัดไป</span>`
          : `<span class="tl-badge lock">${ico('lock')}</span>`;
        return `<div class="tl-row ${state}${d.justCleared && state === 'current' ? ' fresh' : ''}">
          <div class="tl-dot"></div>
          <div class="tl-card" style='${bg}'>
            <div class="tl-ic">${ico(`era_${i}`)}</div>
            <div class="tl-name">${era.nameTh}<small>${era.nameEn}</small></div>
            ${badge}
          </div>
        </div>`;
      })
      .join('');
    const cur = d.eras[d.current].era;
    const nb = artUrl('banner_newera');
    const head = d.justCleared
      ? `${nb ? `<img class="banner-img" src="${nb}" alt="">` : '<div class="newera-title">ยุคใหม่!</div>'}
         <div class="newera-name">${ico(`era_${d.current}`)} ${cur.nameTh}</div>
         ${ec?.newTimeline ? `<div class="newtl">ไทม์ไลน์ ${d.timeline} • ยากขึ้น!</div>` : ''}
         <div class="reset-note">อัปเกรดกลับเป็น Lv.1 • ทหารเริ่มใหม่</div>`
      : `<div class="card-title">ไทม์ไลน์ ${d.timeline}</div>`;
    const conv = ec && ec.converted > 0 ? `<div class="conv">เหรียญที่เหลือแลกเป็น ${ico('star')} +${ec.converted}</div>` : '';
    const buttons = d.justCleared
      ? `<button class="play-btn" data-act="play"><span>เริ่มยุคใหม่</span><em>${ico('stamina')}${STAMINA_RUN_COST}</em></button>
         <button class="ghost-btn" data-act="timeline-menu">เมนู / ค่ายฝึก</button>`
      : `<button class="play-btn" data-act="close-timeline"><span>ปิด</span></button>`;
    this.timelineModal.innerHTML = `
      <div class="card timeline">
        ${head}
        ${conv}
        <div class="tl-list">${rows}</div>
        ${buttons}
      </div>`;
    applySkins(this.timelineModal);
    this.timelineModal.classList.remove('hidden');
  }

  /** หน้าทีม: ฮีโร่ / สัตว์เลี้ยง / อุปกรณ์ */
  renderTeam(d: TeamData): void {
    const sel = this.teamSel >= 0 ? this.teamSel : d.equipped;
    const hx = (c: number) => '#' + c.toString(16).padStart(6, '0');
    const tabs = `<div class="team-tabs">
        <button class="tab ${this.teamTab === 'hero' ? 'on' : ''}" data-tab="hero">ฮีโร่</button>
        <button class="tab ${this.teamTab === 'pets' ? 'on' : ''}" data-tab="pets">สัตว์เลี้ยง</button>
        <button class="tab ${this.teamTab === 'gears' ? 'on' : ''}" data-tab="gears">อุปกรณ์ ${ico('lock')}</button>
      </div>`;
    let body: string;
    if (this.teamTab !== 'hero') {
      body = `<div class="soon">${ico('lock')}<b>เร็วๆ นี้</b><div>${this.teamTab === 'pets' ? 'สัตว์เลี้ยงช่วยรบ' : 'อุปกรณ์เสริมพลัง'} จะมาในอัปเดตถัดไป</div></div>`;
    } else {
      const h = d.heroes[sel];
      const def = h.def;
      const btns = h.unlocked
        ? `<div class="hero-btns">
            <button class="hero-up ${h.affordable ? 'can' : ''}" data-act="hero-up" data-id="${def.id}" ${h.affordable ? '' : 'disabled'}>อัปเกรด<b>${ico('trophy')} ${h.cost}</b></button>
            <button class="hero-eq ${d.equipped === def.id ? 'on' : ''}" data-act="hero-eq" data-id="${def.id}" ${d.equipped === def.id ? 'disabled' : ''}>${d.equipped === def.id ? 'ใช้งานอยู่' : 'เลือกใช้'}</button>
          </div>`
        : `<div class="hero-lock">ปลดล็อกที่ <b>${unlockText(def.unlockOrd)}</b></div>`;
      body = `
        <div class="hero-show" style="background:linear-gradient(160deg, ${hx(def.color)}, ${hx(def.accent)})">
          <div class="hero-portrait ${h.unlocked ? '' : 'dim'}">${ico(`hero_${def.id}`)}</div>
        </div>
        <div class="hero-row">
          <b class="hero-name">${def.name}</b>
          <span class="hero-lv">Level ${h.lvl}</span>
          <span class="hero-atk">ATK ${h.atk}</span>
        </div>
        <div class="hero-skill"><b>${def.skillName}</b><div>${def.desc}</div></div>
        ${btns}
        <div class="note">Level ฮีโร่รีเซ็ตเป็น 1 เมื่อขึ้นยุคใหม่</div>
        <div class="hero-grid">
          ${d.heroes
            .map(
              (x) => `<button class="hero-card ${x.def.id === sel ? 'sel' : ''} ${x.unlocked ? '' : 'locked'}" data-hero="${x.def.id}" style="--hc:${hx(x.def.color)}">
              <div class="hc-ic">${ico(`hero_${x.def.id}`)}</div>
              <div class="hc-name">${x.def.name}</div>
              ${x.unlocked ? `<div class="hc-lv">Lv.${x.lvl}${d.equipped === x.def.id ? ' ✓' : ''}</div>` : `<div class="hc-lock">${ico('lock')}</div>`}
            </button>`,
            )
            .join('')}
        </div>`;
    }
    this.teamModal.innerHTML = `
      <div class="card team">
        <div class="team-head"><div class="card-title">ทีม</div><div class="team-tro">${ico('trophy')} <b>${d.trophies}</b></div></div>
        ${tabs}
        ${body}
        <button class="play-btn" data-act="close-team"><span>ปิด</span></button>
      </div>`;
    applySkins(this.teamModal);
  }

  renderCamp(d: CampData): void {
    const wasOpen = !this.campModal.classList.contains('hidden');
    this.campModal.innerHTML = `
      <div class="card camp">
        <div class="card-title">${ico('camp')} ค่ายฝึก</div>
        <div class="camp-sub">อัปเกรดถาวร ไม่รีเซ็ตเมื่อขึ้นยุคใหม่</div>
        <div class="camp-stars">${ico('star')} <b>${fmt(d.stars)}</b></div>
        <div class="camp-list">
          ${d.items
            .map(
              (m) => `<div class="camp-item">
              <div class="camp-ic">${ico(m.icon)}</div>
              <div class="camp-info">
                <div class="camp-name">${m.name} <small>Lv.${m.lvl}/${m.max}</small></div>
                <div class="camp-desc">${m.desc}${m.maxed ? '' : ` → <b>${m.next}</b>`}</div>
              </div>
              <button class="camp-buy ${m.affordable ? 'can' : ''}" data-meta="${m.id}" ${m.affordable ? '' : 'disabled'}>
                ${m.maxed ? 'MAX' : `${ico('star')} ${fmt(m.cost)}`}
              </button>
            </div>`,
            )
            .join('')}
        </div>
        <div class="note">ได้ดาวจากการชนะด่าน, คริสตัลที่มีดาว และการเคลียร์ยุค</div>
        <button class="play-btn" data-act="close-camp"><span>ปิด</span></button>
      </div>`;
    applySkins(this.campModal);
    if (wasOpen) this.campModal.classList.remove('hidden');
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
      rw.textContent = `+${fmt(total)}`;
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
        ${row('sound', `${ico('sound')} เสียงเอฟเฟกต์`, s.sound)}
        ${row('music', `${ico('music')} เพลง`, s.music)}
        ${row('vibration', `${ico('vibration')} การสั่น`, s.vibration)}
        <div class="howto">
          <b>วิธีเล่น</b><br>
          ลากนิ้วซ้าย–ขวา ทหารจะยิงเอง • ยิงสิ่งกีดขวางให้แตกก่อนชน (ชั้นนอกแตกแล้วยังมีแกนข้างใน) •
          ยิงแผงไม้หน้าป้ายให้พัง แล้วยิงป้าย (อัตรายิง/ระยะ/พลัง) ให้ค่าขึ้นเป็นสีเขียว แล้ววิ่งผ่าน •
          ยิงแคปซูลให้แตก ทหารจะไปรอที่ Collect Area ต้องวิ่งผ่านถึงจะได้ •
          ยิงหอหินเพื่อเติมเกจด้านซ้าย เต็มแล้วแคปซูลบนแท่นเพิ่ม 1 ช่อง (สูงสุด 5) •
          ยิงแท่นแคปซูลจนแถบเต็ม ทหารในแคปซูล Level +1 (สูงสุด 10) • ศัตรูชุดดำปาอาวุธใส่ โดนแล้วตาย 1 ตัว ยิงให้ล้มก่อน •
          ยิงกรงให้เงินหล่น แล้ววิ่งเก็บ • ท้ายด่านยิงหอคอยเก็บเงิน •
          ทุก 5 ด่านสู้ราชันแห่งยุค เคลียร์แล้วขึ้นยุคใหม่ (อัปเกรดรีเซ็ต ทหารเหลือ 1 คน) • ใช้ดาวซื้ออัปเกรดถาวรที่ค่ายฝึก
        </div>
        <div class="note">ไม่มีโฆษณา • เล่นออฟไลน์ได้ • Stamina +1 ทุก 5 นาที (สูงสุด ${STAMINA_MAX})</div>
        <button class="ghost-btn danger" data-act="reset">ลบความคืบหน้าทั้งหมด</button>
        <button class="play-btn" data-act="close-settings"><span>ปิด</span></button>
        <div class="version">Crowd Ages v${__APP_VERSION__}</div>
      </div>`;
    applySkins(this.settingsModal);
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
