import {
  CLASSES, CLASS_COLOR, DROP, LEGENDARY_PITY, PULL_COST_1, PULL_COST_10, PULL_RATE, SALVAGE, SLOTS as GEAR_SLOTS, SLOT_NAME, SLOT_STATS,
  STATS, STAT_TH, TIERS, TIER_COLOR, enhanceInfo, findItem, isEquipped, itemStats, runeValue, totalStats,
  type Drops, type GearItem, type GearState, type Rune, type Stat,
} from '../gear.ts';
import { STAGES_PER_ERA, STAMINA_MAX, STAMINA_RUN_COST } from '../config.ts';
import type { MetaId, UpgradeId } from '../economy.ts';
import type { EraDef } from '../eras.ts';
import { applySkins, artUrl, ico, icoFirst } from './art.ts';
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
  gear(op: GearOp, a?: string, b?: string): GearActResult;
}

export type GearOp = 'equip' | 'unequip' | 'enhance' | 'rune' | 'salvage' | 'mine' | 'blast' | 'pull1' | 'pull10';
export interface GearActResult {
  msg: string;
  good: boolean;
  items?: GearItem[];
  runes?: Rune[];
}

export interface TeamData {
  trophies: number;
  equipped: number;
  heroes: { def: HeroDef; lvl: number; atk: number; cost: number; unlocked: boolean; affordable: boolean }[];
  gear: GearState;
  /** ยุคปัจจุบัน (0–5) ใช้เลือกไอคอนอาวุธ */
  era: number;
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
  /** สเตจที่ไปถึง (1–4) */
  stage: number;
  /** ของจากระบบอุปกรณ์ที่ได้ในรอบนี้ */
  drops: Drops;
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
  private gearSub: 'equip' | 'mine' | 'gacha' = 'equip';
  private gearSel = '';
  private gearFilter = -1;
  private gearRunePick = false;
  private gearLast: GearActResult | null = null;
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
        <div class="lvl-chip" data-hudlvl>ยุค 1</div>
        <div class="progress"><div class="bar" data-prog></div><span class="boss-ic" data-bossic></span></div>
        <button class="icon-btn" data-act="pause" aria-label="หยุด">${ico('pause')}</button>
      </div>
      <div class="hud-row">
        <div class="chip gold">${ico('coin')} <b data-hcoins>0</b></div>
        <div class="chip">${ico('troop')} <b data-htroops>1/8</b></div>
      </div>
      <div class="hud-stats" data-hstats></div>
      <div class="gauge" data-gauge>
        <div class="g-next" data-gnext>+1</div>
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
    const gt = (e.target as HTMLElement).closest<HTMLElement>('[data-gsub],[data-gitem],[data-gfilter],[data-gop]');
    if (gt && !(gt as HTMLButtonElement).disabled) {
      this.onGearClick(gt);
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
      this.gearLast = null;
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
    // สเตจในยุค: 1–3 ช่วงวิ่ง, สเตจสุดท้ายทุ่งหอคอย
    const dots = this.q(this.menu, '[data-dots]');
    dots.innerHTML = '';
    for (let i = 1; i <= STAGES_PER_ERA; i++) {
      const dot = el('span', 'dot' + (i === 1 ? ' cur' : '') + (i === STAGES_PER_ERA ? ' boss' : ''));
      dot.innerHTML = i === STAGES_PER_ERA ? ico('crystal') : String(i);
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
    this.q(this.menu, '[data-play-text]').textContent = `เล่น ยุค ${d.save.level}`;
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

  showHud(level: number, timeline: number, _eraBoss: boolean): void {
    this.hud.classList.remove('hidden');
    this.hudLevel = { level, timeline };
    this.stageKey = -1;
    this.setStage(1);
    this.q(this.hud, '[data-bossic]').innerHTML = ico('crystal');
    this.hudKey = '';
    this.setProgress(0);
  }

  private hudLevel = { level: 1, timeline: 1 };
  private stageKey = -1;

  /** ป้ายมุมบน: ยุค + สเตจ */
  setStage(stage: number): void {
    if (stage === this.stageKey) return;
    this.stageKey = stage;
    const { level, timeline } = this.hudLevel;
    this.q(this.hud, '[data-hudlvl]').textContent = `${timeline > 1 ? `TL${timeline} • ` : ''}ยุค ${level} • ${stage}/${STAGES_PER_ERA}`;
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
      chip('stat_rate', 'อัตรายิง', s.rate) + chip('stat_range', 'ระยะ', s.range);
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
    // ไม่มีแท่นข้างหน้า (เช่น ทุ่งหอคอย) → ซ่อนหลอด
    this.q(this.hud, '[data-gauge]').style.visibility = count > 0 ? '' : 'hidden';
    this.q(this.hud, '[data-gfill]').style.height = `${Math.round(frac * 100)}%`;
    this.q(this.hud, '[data-gcur]').textContent = String(count);
    this.q(this.hud, '[data-gnext]').textContent = max ? 'MAX' : `+1`;
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
      : `<div class="result-title">${r.win ? 'ผ่านยุค!' : 'ทหารหมดแล้ว'}</div>`;
    const ec = r.eraClear;
    const buttons = ec
      ? `<button class="play-btn" data-act="era-next"><span>ไปยุคถัดไป</span></button>`
      : `<button class="play-btn" data-act="play" ${can ? '' : 'disabled'}>
          <span>${r.win ? `ยุคถัดไป (${r.save.level})` : 'ลองอีกครั้ง'}</span><em>${ico('stamina')}${STAMINA_RUN_COST}</em>
        </button>
        <button class="ghost-btn" data-act="menu">เมนู / อัปเกรด</button>`;
    this.wheelSpun = false;
    this.lastEc = r.eraClear;
    this.resultModal.innerHTML = `
      <div class="card result ${r.win ? 'win' : 'lose'}">
        ${title}
        <div class="result-sub">${r.win ? `ยุค ${r.level}${ec ? ` • เคลียร์${ec.from.nameTh}!` : ''}` : `ยุค ${r.level} • ไปถึงสเตจ ${r.stage}/${STAGES_PER_ERA} • อัปเกรดแล้วลองใหม่`}</div>
        <div class="rewards-title">— รางวัล —</div>
        <div class="rewards">
          <div class="rw coin">${ico('coin')}<b data-reward>+${fmt(r.reward)}</b></div>
          ${r.stars ? `<div class="rw star">${ico('star')}<b>+${r.stars}</b></div>` : ''}
          ${r.trophies ? `<div class="rw trophy">${ico('trophy')}<b>+${r.trophies}</b></div>` : ''}
          ${ec ? `<div class="rw stamina">${ico('stamina')}<b>+${ec.stamina}</b></div>` : ''}
          ${r.drops.tokens ? `<div class="rw token">${ico('token')}<b>+${r.drops.tokens}</b></div>` : ''}
          ${r.drops.pickaxes ? `<div class="rw pick">${ico('pickaxe')}<b>+${r.drops.pickaxes}</b></div>` : ''}
          ${r.drops.bombs ? `<div class="rw bomb">${ico('bomb')}<b>+${r.drops.bombs}</b></div>` : ''}
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
        <button class="tab ${this.teamTab === 'gears' ? 'on' : ''}" data-tab="gears">อุปกรณ์</button>
      </div>`;
    let body: string;
    if (this.teamTab === 'gears') {
      body = this.gearBody(d.gear, d.era);
    } else if (this.teamTab !== 'hero') {
      body = `<div class="soon">${ico('lock')}<b>เร็วๆ นี้</b><div>สัตว์เลี้ยงช่วยรบ จะมาในอัปเดตถัดไป</div></div>`;
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
        <div class="team-head"><div class="card-title">ทีม</div>${
          this.teamTab === 'gears'
            ? `<div class="team-tro token">${ico('token')} <b>${fmt(d.gear.tokens)}</b></div>`
            : `<div class="team-tro">${ico('trophy')} <b>${d.trophies}</b></div>`
        }</div>
        ${tabs}
        ${body}
        <button class="play-btn" data-act="close-team"><span>ปิด</span></button>
      </div>`;
    applySkins(this.teamModal);
  }

  // ---------- แท็บอุปกรณ์ ----------

  private onGearClick(t: HTMLElement): void {
    sfx.click();
    const ds = t.dataset;
    if (ds.gsub) {
      this.gearSub = ds.gsub as typeof this.gearSub;
      this.gearLast = null;
      this.gearRunePick = false;
    } else if (ds.gfilter !== undefined) {
      this.gearFilter = Number(ds.gfilter);
    } else if (ds.gitem !== undefined) {
      this.gearSel = this.gearSel === ds.gitem ? '' : ds.gitem;
      this.gearRunePick = false;
      this.gearLast = null;
    } else if (ds.gop === 'rune-pick') {
      this.gearRunePick = !this.gearRunePick;
    } else if (ds.gop) {
      const op = ds.gop as GearOp;
      this.gearLast = this.h.gear(op, ds.a ?? '', ds.b ?? '');
      if (op === 'rune') this.gearRunePick = false;
      if (op === 'salvage' && this.gearLast.good) this.gearSel = '';
    }
    this.renderTeam(this.h.team());
  }

  private gearIcon(it: Pick<GearItem, 'slot' | 'cls'>, era: number): string {
    const slot = GEAR_SLOTS[it.slot];
    const keys = slot === 'weapon' ? [`gear_weapon_${era}_${it.cls}`, `gear_weapon_${era}`] : [`gear_${slot}_${it.cls}`, `gear_${slot}`];
    return icoFirst(keys);
  }

  private runeIcon(r: Pick<Rune, 'stat' | 'tier'>): string {
    return icoFirst([`rune_${r.stat}_${r.tier}`, `rune_${r.stat}`]);
  }

  private pct(_st: Stat, v: number, sign = true): string {
    const n = Math.round(v * 10) / 10;
    return `${sign && n >= 0 ? '+' : ''}${n}%`;
  }

  private itemName(it: GearItem): string {
    return `${CLASSES[it.cls]} ${SLOT_NAME[GEAR_SLOTS[it.slot]]}${it.plus ? ` +${it.plus}` : ''}`;
  }

  private itemCell(it: GearItem, g: GearState, era: number, attr: string): string {
    const r = it.rune ? g.runes.find((x) => x.id === it.rune) : undefined;
    return `<button class="gi ${this.gearSel === it.id ? 'sel' : ''}" ${attr} style="--cc:${CLASS_COLOR[it.cls]}">
      ${this.gearIcon(it, era)}
      ${it.plus ? `<span class="gi-plus">+${it.plus}</span>` : ''}
      ${r ? `<span class="gi-rune" style="--tc:${TIER_COLOR[r.tier]}"></span>` : ''}
      ${isEquipped(g, it.id) ? '<span class="gi-on">✓</span>' : ''}
    </button>`;
  }

  private gearBody(g: GearState, era: number): string {
    const sub = (k: string, label: string) => `<button class="gsub ${this.gearSub === k ? 'on' : ''}" data-gsub="${k}">${label}</button>`;
    const last = this.gearLast?.msg ? `<div class="g-msg ${this.gearLast.good ? 'good' : 'bad'}">${this.gearLast.msg}</div>` : '';
    let inner = '';
    if (this.gearSub === 'equip') inner = this.gearEquip(g, era);
    else if (this.gearSub === 'mine') inner = this.gearMine(g);
    else inner = this.gearGacha(g, era);
    return `<div class="gsubs">${sub('equip', 'สวมใส่')}${sub('mine', 'เหมือง')}${sub('gacha', 'สุ่ม')}</div>${last}<div class="gear-scroll">${inner}</div>`;
  }

  private gearEquip(g: GearState, era: number): string {
    const tot = totalStats(g);
    const slots = GEAR_SLOTS.map((slot, i) => {
      const it = g.equipped[i] ? findItem(g, g.equipped[i]) : undefined;
      return it
        ? this.itemCell(it, g, era, `data-gitem="${it.id}"`)
        : `<div class="gi empty"><span class="gi-ph">${this.gearIcon({ slot: i, cls: 0 }, era)}</span><small>${SLOT_NAME[slot]}</small></div>`;
    }).join('');
    const sel = this.gearSel ? findItem(g, this.gearSel) : undefined;
    // ค่าที่จะเปลี่ยนถ้าใส่ชิ้นที่เลือก
    let diff: Partial<Record<Stat, number>> = {};
    if (sel && !isEquipped(g, sel.id)) {
      const after: GearState = { ...g, equipped: g.equipped.map((id, i) => (i === sel.slot ? sel.id : id)) };
      const t2 = totalStats(after);
      for (const st of STATS) if (Math.abs(t2[st] - tot[st]) > 0.001) diff[st] = t2[st] - tot[st];
    }
    const statRows = STATS.map((st) => {
      const dv = diff[st];
      const d = dv === undefined ? '' : `<em class="${dv > 0 ? 'up' : 'down'}">${dv > 0 ? '▲' : '▼'}${this.pct(st, Math.abs(dv), false)}</em>`;
      const v = st === 'critRate' || st === 'critDmg' ? this.pct(st, tot[st], false) : this.pct(st, tot[st]);
      return `<div class="gs"><span>${STAT_TH[st]}</span><b>${v}</b>${d}</div>`;
    }).join('');
    const detail = sel ? this.gearDetail(sel, g, era) : '<div class="note">แตะอุปกรณ์เพื่อดูรายละเอียด ใส่ ตีบวก หรือใส่รูน</div>';
    const filters = [`<button class="gf ${this.gearFilter < 0 ? 'on' : ''}" data-gfilter="-1">ทั้งหมด</button>`]
      .concat(GEAR_SLOTS.map((s, i) => `<button class="gf ${this.gearFilter === i ? 'on' : ''}" data-gfilter="${i}">${SLOT_NAME[s]}</button>`))
      .join('');
    const bag = g.items
      .filter((it) => this.gearFilter < 0 || it.slot === this.gearFilter)
      .sort((a, b) => b.cls - a.cls || b.plus - a.plus || a.slot - b.slot)
      .map((it) => this.itemCell(it, g, era, `data-gitem="${it.id}"`))
      .join('');
    return `
      <div class="g-equip">
        <div class="g-slots">${slots}</div>
        <div class="g-stats">${statRows}</div>
      </div>
      ${detail}
      <div class="g-sec">กระเป๋า (${g.items.length}) • หิน ${g.stones}</div>
      <div class="g-filters">${filters}</div>
      <div class="g-bag">${bag || '<div class="note">ยังไม่มีอุปกรณ์ — ไปที่แท็บ "สุ่ม" ใช้ Token สุ่มอุปกรณ์</div>'}</div>`;
  }

  private gearDetail(it: GearItem, g: GearState, era: number): string {
    const st = itemStats(it);
    const lines = SLOT_STATS[it.slot].map((s) => `<div>${STAT_TH[s]} <b>${this.pct(s, st[s])}</b></div>`).join('');
    const rune = it.rune ? g.runes.find((r) => r.id === it.rune) : undefined;
    const on = isEquipped(g, it.id);
    const info = enhanceInfo(it);
    const enh = info
      ? `<div class="g-enh">ตีไป +${info.target} • โอกาสสำเร็จ <b>${Math.round(info.chance * 100)}%</b>${
          info.pity > 0 ? ` (พื้นฐาน ${Math.round(info.base * 100)}% + Pity ${Math.round(info.pity * 100)}%)` : ''
        }${info.failTo < it.plus ? `<div class="warn">⚠️ ถ้าพลาด จะลดเป็น +${info.failTo}</div>` : ''}</div>`
      : '<div class="g-enh">ตีบวกเต็มแล้ว (+6)</div>';
    const runeLine = rune
      ? `<div class="g-rune">${this.runeIcon(rune)} รูน ${TIERS[rune.tier]} • ${STAT_TH[rune.stat]} <b>+${runeValue(rune)}%</b></div>`
      : '<div class="g-rune none">ยังไม่ใส่รูน</div>';
    const bagRunes = g.runes.filter((r) => !r.on).sort((a, b) => b.tier - a.tier);
    const picker = this.gearRunePick
      ? `<div class="g-runes">${
          bagRunes.length
            ? bagRunes
                .map((r) => `<button class="rn" data-gop="rune" data-a="${it.id}" data-b="${r.id}" style="--tc:${TIER_COLOR[r.tier]}">${this.runeIcon(r)}<small>${TIERS[r.tier]} ${STAT_TH[r.stat]} +${runeValue(r)}%</small></button>`)
                .join('')
            : '<div class="note">ไม่มีรูนในกระเป๋า — ใช้ Bomb ที่แท็บ "เหมือง"</div>'
        }</div>`
      : '';
    return `<div class="g-detail" style="--cc:${CLASS_COLOR[it.cls]}">
      <div class="gd-head"><div class="gd-ic">${this.gearIcon(it, era)}</div><div><b class="gd-name">${this.itemName(it)}</b>${lines}</div></div>
      ${runeLine}
      ${enh}
      <div class="gd-btns">
        ${on ? `<button data-gop="unequip" data-a="${it.slot}">ถอด</button>` : `<button class="main" data-gop="equip" data-a="${it.id}">ใส่</button>`}
        <button class="main" data-gop="enhance" data-a="${it.id}" ${info && g.stones >= info.cost ? '' : 'disabled'}>ตีบวก <small>หิน ${info?.cost ?? 0}/${g.stones}</small></button>
        <button data-gop="rune-pick">${rune ? 'เปลี่ยนรูน' : 'ใส่รูน'}</button>
        ${rune ? `<button data-gop="rune" data-a="${it.id}" data-b="">ถอดรูน</button>` : ''}
        <button class="danger" data-gop="salvage" data-a="${it.id}" ${on ? 'disabled' : ''}>แยกชิ้น <small>+${SALVAGE[it.cls]}</small></button>
      </div>
      ${picker}
    </div>`;
  }

  private gearMine(g: GearState): string {
    const got = this.gearLast?.runes?.length
      ? `<div class="g-got">${this.gearLast.runes.map((r) => `<div class="rn" style="--tc:${TIER_COLOR[r.tier]}">${this.runeIcon(r)}<small>${TIERS[r.tier]} ${STAT_TH[r.stat]} +${runeValue(r)}%</small></div>`).join('')}</div>`
      : '';
    const runes = [...g.runes].sort((a, b) => b.tier - a.tier || a.stat.localeCompare(b.stat));
    return `
      <div class="g-mine">
        <div class="gm-row">
          <div class="gm-ic">${ico('pickaxe')}<b>${g.pickaxes}</b></div>
          <div class="gm-txt"><b>Pickaxe</b><small>ขุด 1 ครั้ง: ${Math.round(DROP.mineChance * 100)}% ได้หิน ${DROP.mineStones[0]}–${DROP.mineStones[1]} ก้อน</small></div>
          <button data-gop="mine" data-b="1" ${g.pickaxes ? '' : 'disabled'}>ขุด</button>
          <button data-gop="mine" data-b="all" ${g.pickaxes ? '' : 'disabled'}>ทั้งหมด</button>
        </div>
        <div class="gm-row">
          <div class="gm-ic">${ico('bomb')}<b>${g.bombs}</b></div>
          <div class="gm-txt"><b>Bomb</b><small>ระเบิด 1 ลูก: ${Math.round(DROP.bombRune * 100)}% ได้รูน 1 ชิ้น</small></div>
          <button data-gop="blast" data-b="1" ${g.bombs ? '' : 'disabled'}>ระเบิด</button>
          <button data-gop="blast" data-b="all" ${g.bombs ? '' : 'disabled'}>ทั้งหมด</button>
        </div>
        <div class="gm-row"><div class="gm-ic">${ico('enh_stone')}<b>${g.stones}</b></div><div class="gm-txt"><b>หินตีบวก</b><small>ใช้ตีบวกอุปกรณ์ ครั้งละ 3 ก้อน</small></div></div>
      </div>
      ${got}
      <div class="g-sec">กระเป๋ารูน (${g.runes.length})</div>
      <div class="g-runes">${
        runes.length
          ? runes.map((r) => `<div class="rn ${r.on ? 'used' : ''}" style="--tc:${TIER_COLOR[r.tier]}">${this.runeIcon(r)}<small>${TIERS[r.tier]} ${STAT_TH[r.stat]} +${runeValue(r)}%${r.on ? ' ✓' : ''}</small></div>`).join('')
          : '<div class="note">ยังไม่มีรูน</div>'
      }</div>
      <div class="note">ได้ Pickaxe / Bomb / Token ทุกครั้งที่ผ่านสเตจ (Pickaxe ${Math.round(DROP.pickaxe * 100)}%, Bomb ${Math.round(DROP.bomb * 100)}%)</div>`;
  }

  private gearGacha(g: GearState, era: number): string {
    const left = LEGENDARY_PITY - g.gachaPity;
    const got = this.gearLast?.items?.length
      ? `<div class="g-sec">ได้รับ</div><div class="g-bag">${this.gearLast.items.map((it) => this.itemCell(it, g, era, `data-gitem="${it.id}"`)).join('')}</div>`
      : '';
    return `
      <div class="g-gacha">
        <div class="gg-tokens">${ico('token')}<b>${fmt(g.tokens)}</b><small>Token</small></div>
        <div class="gg-btns">
          <button class="main" data-gop="pull1" ${g.tokens >= PULL_COST_1 ? '' : 'disabled'}>สุ่ม 1 ครั้ง<small>${ico('token')} ${PULL_COST_1}</small></button>
          <button class="main" data-gop="pull10" ${g.tokens >= PULL_COST_10 ? '' : 'disabled'}>สุ่ม 10 ครั้ง<small>${ico('token')} ${PULL_COST_10} • การันตี Gold+</small></button>
        </div>
        <div class="gg-pity">อีก <b>${left}</b> ครั้งการันตี Legendary</div>
        <div class="gg-rates">${CLASSES.map((c, i) => `<span style="--cc:${CLASS_COLOR[i]}">${c} ${Math.round(PULL_RATE[i] * 1000) / 10}%</span>`).join('')}</div>
      </div>
      ${got}
      <div class="note">ได้ Token จากการผ่านสเตจ และแยกชิ้นอุปกรณ์ที่ไม่ใช้ • อุปกรณ์ที่สุ่มได้ใส่ให้อัตโนมัติถ้าช่องนั้นยังว่าง</div>`;
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
        <div class="note">ได้ดาวจากหอคอยที่มีดาว และการผ่านยุค</div>
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
          1 รอบเล่นจนทหารหมด หรือผ่านยุค • 1 ยุคมี 4 สเตจ: สเตจ 1–3 วิ่งยิง สเตจ 4 ทุ่งหอคอย ไปถึงแถวสุดท้ายถึงจะผ่านยุค (ไม่ต้องยิงทุกหอ) •
          ลากนิ้วซ้าย–ขวา ทหารยิงเอง 1.3 นัด/วินาที • ฝูงสูงสุด 20 ตัว • ทุกสเตจมีแท่นแคปซูล และมีแท่นสุดท้ายก่อนเข้าทุ่งหอคอยเสมอ •
          ยิงหุ่นไล่กา (ยิงไม่แตก) เติมหลอดซ้าย เต็มแล้วทุกแท่นได้แคปซูล +1 (สูงสุด 5, อยู่ตลอดรอบ) • ชนหุ่นไล่กาทหารไม่ตาย แต่หุ่นหายไป •
          ยิงแคปซูล/แท่นสะสม EXP เต็มแล้วทหารในแคปซูล Level +1 (สูงสุด 10) • เดินชนแคปซูลใบเดียว ทุกใบบนแท่นแตก ทหารทั้งหมดจะไปยืนรอหลังเส้นแบ่งสเตจถัดไป วิ่งถึงเส้นแล้วได้ทหารเข้าฝูง •
          ป้ายอัตรายิง/ระยะยิง: ยิงแผงไม้ (ถ้ามี) ให้พัง แล้วยิงค่าให้ขึ้น (ค่าจริง = ค่าบนป้าย × 0.1%) แล้ววิ่งผ่าน •
          ศัตรูชุดดำปาอาวุธ โดนแล้วตาย 1 ตัว • ชนหอคอยทหารตายทีละตัว • กองเงินต้องเดินเก็บ •
          ทหารหมดได้เงินที่เก็บมาไปอัปเกรด แล้วลองใหม่ • ผ่านยุคแล้วอัปเกรดรีเซ็ต • ใช้ดาวซื้ออัปเกรดถาวรที่ค่ายฝึก •
          ผ่านแต่ละสเตจได้ Token / Pickaxe / Bomb ไปสุ่ม ขุด และตีบวกอุปกรณ์ในหน้าทีม แท็บอุปกรณ์ (ของถาวร)
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
