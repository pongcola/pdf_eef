import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  type Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  BASE_FIRE_RATE,
  BASE_RANGE,
  BOSS_STOMP_INTERVAL,
  BOSS_STOMP_KILL,
  ELITE_DAMAGE,
  LEVELS_PER_CYCLE,
  PROJECTILE_SPEED,
  RUN_SPEED,
  TRACK_WIDTH,
  WHEEL_CHANCE,
} from '../config.ts';
import {
  capacity,
  incomeMult,
  loseReward,
  playerPower,
  startTroops,
  UPGRADES,
  upgradeCost,
  winReward,
  type UpgradeId,
} from '../economy.ts';
import { ELITE_COLOR, ENEMY_COLOR, ERAS, eraIndexForLevel, PLAYER_COLOR } from '../eras.ts';
import { sfx, setMusic, setSound, suspendAudio, resumeAudio } from '../audio.ts';
import { buzz, exitApp, setVibration } from '../platform.ts';
import { clearSave, defaultSave, loadSave, writeSave, type SaveData } from '../save.ts';
import { consumeStamina, refreshStamina } from '../stamina.ts';
import { Boss } from '../render/boss.ts';
import { makeBlobShadow } from '../render/common.ts';
import { createObstacle, type Obstacle } from '../render/obstacles.ts';
import { Particles } from '../render/particles.ts';
import { Projectiles } from '../render/projectiles.ts';
import {
  BlockTarget,
  CageTarget,
  CrystalTarget,
  RecruitPad,
  StatGate,
  type Target,
} from '../render/targets.ts';
import { sharedTime, UnitSwarm } from '../render/units.ts';
import { World } from '../render/world.ts';
import type { UI } from '../ui/ui.ts';
import { generateLevel, STAT_LABEL, type LevelData } from './level.ts';
import { Squad } from './squad.ts';

type State = 'menu' | 'run' | 'bonus' | 'boss' | 'won' | 'lost' | 'result' | 'paused';

interface EnemyUnit {
  x: number;
  z: number;
  hp: number;
  alive: boolean;
}

interface EnemyGroup {
  z: number;
  units: EnemyUnit[];
  swarm: UnitSwarm;
  charging: boolean;
}

const BOSS_STOP = 10.5;

export class Game {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(60, 1, 0.1, 260);
  save: SaveData;
  private ui: UI;

  private state: State = 'menu';
  private pausedFrom: State = 'run';
  private level!: LevelData;
  private world: World | null = null;
  private hazards: Obstacle[] = [];
  private blocks: BlockTarget[] = [];
  private cages: CageTarget[] = [];
  private pads: RecruitPad[] = [];
  private crystals: CrystalTarget[] = [];
  private gates: StatGate[] = [];
  private targets: Target[] = [];
  private active: Target[] = [];
  private enemies: EnemyGroup[] = [];
  private boss: Boss | null = null;
  private bossPending = 0;
  private bossPendT = 0;

  private squad = new Squad();
  private swarm: UnitSwarm | null = null;
  private eliteSwarm: UnitSwarm | null = null;
  private projectiles: Projectiles | null = null;
  private swarmEra = -1;
  private shadow: Mesh;
  private particles = new Particles();

  private cap = 8;
  private baseDmg = 1;
  private rateMul = 1;
  private rangeMul = 1;
  private powMul = 1;
  private collected = 0;

  private t = 0;
  private dist = 0;
  private speed = 0;
  private stuckT = 0;
  private bonusT = 0;
  private bossHp = 0;
  private stompTimer = 0;
  private bossTime = 0;
  private hurtFx = 0;
  private endTimer = 0;
  private shake = 0;
  private dragging = false;
  private lastX = 0;
  private hintTimer = 0;
  private reachedCastle = false;
  private pendingReward = 0;
  private camPos = new Vector3(0, 8, 12);
  private camLook = new Vector3(0, 0, -6);
  private tmpV = new Vector3();

  constructor(canvas: HTMLCanvasElement, ui: UI) {
    this.ui = ui;
    this.save = loadSave(Date.now());
    this.applySettings();

    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.add(new HemisphereLight(0xffffff, 0x8a7f6a, 1.6));
    this.scene.add(new AmbientLight(0xffffff, 0.35));
    const sun = new DirectionalLight(0xffffff, 2.0);
    sun.position.set(6, 12, 8);
    this.scene.add(sun);
    this.scene.add(this.particles.mesh);
    this.shadow = makeBlobShadow();
    this.scene.add(this.shadow);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput(canvas);
    this.buildLevel();
    this.toMenu();
  }

  // ---------- ตั้งค่า / บันทึก ----------

  private applySettings(): void {
    setSound(this.save.settings.sound);
    setMusic(this.save.settings.music);
    setVibration(this.save.settings.vibration);
  }

  toggleSetting(key: 'sound' | 'music' | 'vibration'): void {
    this.save.settings[key] = !this.save.settings[key];
    this.applySettings();
    writeSave(this.save);
    this.ui.renderSettings(this.save.settings);
  }

  resetProgress(): void {
    clearSave();
    this.save = defaultSave(Date.now());
    writeSave(this.save);
    this.applySettings();
    this.buildLevel();
    this.toMenu();
  }

  // ---------- การควบคุม ----------

  private bindInput(el: HTMLElement): void {
    el.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      this.lastX = e.clientX;
      if (this.state !== 'run' && this.state !== 'bonus') return;
      const scale = (TRACK_WIDTH * 1.35) / Math.max(320, window.innerWidth);
      const lim = this.squad.maxX();
      this.squad.targetX = Math.max(-lim, Math.min(lim, this.squad.targetX + dx * scale));
      if (this.hintTimer > 0 && Math.abs(dx) > 2) this.hintTimer = Math.min(this.hintTimer, 0.3);
    });
    const end = () => (this.dragging = false);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ---------- สร้างด่าน ----------

  private clearLevel(): void {
    this.world?.dispose();
    this.world = null;
    for (const t of this.targets) {
      t.dispose();
      t.label?.remove();
      t.label = null;
    }
    for (const p of this.pads) p.dispose();
    for (const h of this.hazards) h.group.removeFromParent();
    for (const e of this.enemies) e.swarm.dispose();
    this.boss?.dispose();
    this.boss = null;
    this.targets = [];
    this.active = [];
    this.blocks = [];
    this.cages = [];
    this.pads = [];
    this.crystals = [];
    this.gates = [];
    this.hazards = [];
    this.enemies = [];
    this.particles.clear();
    this.projectiles?.clear();
  }

  buildLevel(): void {
    this.clearLevel();
    const up = this.save.upgrades;
    this.cap = capacity(up.capacity);
    this.baseDmg = playerPower(up.power);
    const start = Math.min(startTroops(up.troop), this.cap);
    this.level = generateLevel(this.save.level, this.save.cycle, {
      startTroops: start,
      capacity: this.cap,
      power: this.baseDmg,
      failStreak: this.save.failStreak,
    });
    const L = this.level;
    const era = L.era;
    this.world = new World(this.scene, ERAS[era], { finishD: L.finishD, endD: L.endD, arena: L.eraBoss }, L.hard * 31 + 7);

    for (const it of L.items) {
      const z = -it.d;
      switch (it.type) {
        case 'block': {
          const b = new BlockTarget(era, it.x, z, it.hp, it.coins);
          this.blocks.push(b);
          this.addTarget(b);
          break;
        }
        case 'cage': {
          const c = new CageTarget(era, it.x, z, it.hp, it.prisoners);
          this.cages.push(c);
          this.addTarget(c);
          break;
        }
        case 'stat': {
          const g = new StatGate(it.x, z, it.kind, it.value);
          this.gates.push(g);
          this.addTarget(g);
          break;
        }
        case 'recruit': {
          const p = new RecruitPad(era, it.x, z, it.capsules, it.capsuleHp);
          this.pads.push(p);
          this.scene.add(p.group);
          for (const c of p.capsules) this.targets.push(c);
          break;
        }
        case 'crystal': {
          const c = new CrystalTarget(it.x, z, it.hp, it.coins, it.tier);
          this.crystals.push(c);
          this.addTarget(c);
          break;
        }
        case 'enemies': {
          const swarm = new UnitSwarm(era, ENEMY_COLOR, it.count);
          swarm.run.value = 0;
          this.scene.add(swarm.mesh);
          const units: EnemyUnit[] = [];
          for (let i = 0; i < it.count; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;
            units.push({ x: it.x + (col - 1.5) * 0.7 + (row % 2) * 0.3, z: z - row * 0.7, hp: it.hp, alive: true });
          }
          this.enemies.push({ z, units, swarm, charging: false });
          break;
        }
        case 'obstacle': {
          const o = createObstacle(it);
          this.scene.add(o.group);
          this.hazards.push(o);
          break;
        }
      }
    }

    if (L.eraBoss) {
      this.boss = new Boss(era, -L.endD, true);
      this.scene.add(this.boss.group);
    }

    if (this.swarmEra !== era || !this.swarm) {
      this.swarm?.dispose();
      this.eliteSwarm?.dispose();
      this.projectiles?.dispose();
      this.swarm = new UnitSwarm(era, PLAYER_COLOR, 120);
      this.eliteSwarm = new UnitSwarm(era, ELITE_COLOR, 120);
      this.projectiles = new Projectiles(era);
      this.scene.add(this.swarm.mesh, this.eliteSwarm.mesh, this.projectiles.mesh);
      this.swarmEra = era;
    }

    this.squad.reset(start);
    this.squad.z = 0;
    this.rateMul = this.rangeMul = this.powMul = 1;
    this.collected = 0;
    this.dist = 0;
    this.speed = 0;
    this.t = 0;
    this.shake = 0;
    this.stuckT = 0;
    this.bonusT = 0;
    this.reachedCastle = false;
    this.snapCamera();
  }

  private addTarget(t: Target): void {
    this.scene.add(t.group);
    this.targets.push(t);
  }

  // ---------- สถานะเกม ----------

  toMenu(): void {
    this.state = 'menu';
    this.ui.hideHud();
    this.ui.hideBossBar();
    this.refreshMenu();
  }

  refreshMenu(): void {
    const now = Date.now();
    refreshStamina(this.save.stamina, now);
    this.ui.showMenu({
      save: this.save,
      now,
      era: ERAS[eraIndexForLevel(this.save.level)],
      upgrades: UPGRADES.map((u) => {
        const lvl = this.save.upgrades[u.id];
        const cost = upgradeCost(u, lvl);
        return { id: u.id, name: u.nameTh, icon: u.icon, color: u.color, lvl, desc: u.describe(lvl), cost, affordable: this.save.coins >= cost };
      }),
    });
  }

  buyUpgrade(id: UpgradeId): void {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const lvl = this.save.upgrades[id];
    const cost = upgradeCost(def, lvl);
    if (this.save.coins < cost) {
      this.ui.toast('เหรียญไม่พอ');
      return;
    }
    this.save.coins -= cost;
    this.save.upgrades[id] = lvl + 1;
    writeSave(this.save);
    sfx.coin();
    buzz('light');
    if (id !== 'economy') this.buildLevel();
    this.refreshMenu();
  }

  /** เริ่มเล่นด่านปัจจุบัน (ใช้ stamina) */
  play(): void {
    if (!consumeStamina(this.save.stamina, Date.now())) {
      this.ui.toast('Stamina หมด รอสักครู่นะ');
      if (this.state !== 'menu') {
        this.ui.hideResult();
        this.buildLevel();
      }
      this.toMenu();
      return;
    }
    writeSave(this.save);
    if (this.state !== 'menu' || this.dist > 0) this.buildLevel();
    this.state = 'run';
    this.hintTimer = 2.6;
    this.ui.hideMenu();
    this.ui.hideResult();
    this.ui.showHud(this.level.level, this.level.cycle, this.level.eraBoss);
    this.ui.showHint(true);
    this.updateHud();
    sfx.click();
  }

  pause(): void {
    if (this.state !== 'run' && this.state !== 'boss' && this.state !== 'bonus') return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    this.dragging = false;
    this.ui.showPause(true);
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = this.pausedFrom;
    this.ui.showPause(false);
  }

  quitToMenu(): void {
    this.ui.showPause(false);
    this.ui.hideResult();
    this.buildLevel();
    this.toMenu();
  }

  onAppPause(): void {
    this.pause();
    suspendAudio();
  }

  onAppResume(): void {
    resumeAudio();
    if (this.state === 'menu') this.refreshMenu();
  }

  onBack(): void {
    if (this.ui.closeOverlays()) return;
    if (this.state === 'run' || this.state === 'boss' || this.state === 'bonus') this.pause();
    else if (this.state === 'paused') this.resume();
    else if (this.state === 'result') this.quitToMenu();
    else if (this.state === 'menu') exitApp();
  }

  /** วงล้อหยุดแล้ว: ให้รางวัลเพิ่มตามตัวคูณ คืนค่ารางวัลรวม */
  claimWheel(mult: number): number {
    const extra = Math.round(this.pendingReward * (mult - 1));
    this.save.coins += extra;
    writeSave(this.save);
    sfx.coin();
    return this.pendingReward + extra;
  }

  // ---------- ลูปหลัก ----------

  update(dt: number): void {
    const running = this.state !== 'paused';
    if (running) {
      sharedTime.value += dt;
      this.t += dt;
      if (this.state === 'run' || this.state === 'bonus' || this.state === 'boss') this.updatePlay(dt);
      else if (this.state === 'won' || this.state === 'lost') this.updateEnd(dt);
      for (const h of this.hazards) if (Math.abs(h.z - this.squad.z) < 90) h.update(this.t, dt);
      for (const t of this.targets) if (Math.abs(t.z - this.squad.z) < 90) t.update(dt, this.t);
      this.squad.update(dt);
      this.particles.update(dt);
    }
    this.renderUnits();
    this.updateCamera(dt);
    this.updateLabels(dt);
    if (this.state === 'menu') this.ui.tickMenu(this.save, Date.now());
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlay(dt: number): void {
    const L = this.level;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.ui.showHint(false);
    }

    // ---- เคลื่อนที่ ----
    let target = RUN_SPEED;
    if (this.state === 'boss' && this.dist >= L.endD - BOSS_STOP) target = 0;
    if (this.state === 'bonus') {
      if (this.blockedByCrystal()) {
        target = 0;
        this.stuckT += dt;
      } else this.stuckT = 0;
    }
    this.speed += (target - this.speed) * (1 - Math.exp(-dt * (target === 0 ? 14 : 5)));
    if (this.state === 'boss') this.dist = Math.min(this.dist + this.speed * dt, L.endD - BOSS_STOP);
    else this.dist += this.speed * dt;
    this.squad.z = -this.dist;
    const lim = this.squad.maxX();
    this.squad.targetX = Math.max(-lim, Math.min(lim, this.squad.targetX));
    this.squad.x += (this.squad.targetX - this.squad.x) * (1 - Math.exp(-dt * 12));
    const moving = this.speed > 0.5;
    this.swarm!.run.value = moving ? 1 : 0.25;
    this.eliteSwarm!.run.value = moving ? 1 : 0.25;
    this.ui.setProgress(Math.min(1, this.dist / L.finishD));

    // ---- ยิง ----
    this.active = this.targets.filter((t) => t.alive && t.z < this.squad.z + 1 && t.z > this.squad.z - 60);
    this.fire(dt);
    this.projectiles!.update(dt, PROJECTILE_SPEED, (x, z0, z1, dmg) => this.projectileHit(x, z0, z1, dmg));

    if (this.state === 'run') {
      this.troopCollisions();
      if (this.squad.count === 0) return this.lose();
      this.checkGates();
      this.checkPads();
      this.updateEnemies(dt);
      if (this.squad.count === 0) return this.lose();
      if (this.dist >= L.finishD) {
        if (L.eraBoss) this.startBoss();
        else this.startBonus();
      }
    } else if (this.state === 'bonus') {
      this.bonusT += dt;
      if (this.dist >= L.endD - 3) {
        this.reachedCastle = true;
        const bonus = Math.round(40 * L.hard);
        this.collected += bonus;
        const p = this.project(0, 4, -L.endD);
        this.ui.floatText(`ทะลวงปราสาท! +${bonus}`, p.x, p.y, true);
        this.win();
      } else if (this.stuckT > 2.6 || this.bonusT > 35) {
        this.win();
      }
    } else {
      this.updateBoss(dt);
    }
    this.updateHud();
  }

  private fire(dt: number): void {
    const interval = 1 / (BASE_FIRE_RATE * this.rateMul);
    const range = BASE_RANGE * this.rangeMul;
    const dmg = this.baseDmg * this.powMul;
    let shots = 0;
    for (const tr of this.squad.troops) {
      tr.cool -= dt;
      if (tr.cool > 0) continue;
      tr.cool += interval * (0.85 + Math.random() * 0.3);
      if (tr.cool < 0) tr.cool = interval * Math.random();
      const x = this.clampX(this.squad.x + tr.ox) + 0.22;
      this.projectiles!.fire(x, 0.85, this.squad.z + tr.oz - 0.4, tr.elite ? dmg * ELITE_DAMAGE : dmg, range, tr.elite);
      shots++;
    }
    if (shots) sfx.shoot();
  }

  private projectileHit(x: number, z0: number, z1: number, dmg: number): boolean {
    let best: Target | null = null;
    for (const t of this.active) {
      if (!t.alive) continue;
      if (t.z - t.halfD > z0 || t.z + t.halfD < z1) continue;
      if (Math.abs(x - t.x) > t.halfW) continue;
      if (!best || t.z > best.z) best = t;
    }
    // ศัตรู
    for (const g of this.enemies) {
      if (Math.abs(g.z - z1) > 14) continue;
      for (const u of g.units) {
        if (!u.alive || u.z - 0.35 > z0 || u.z + 0.35 < z1 || Math.abs(u.x - x) > 0.4) continue;
        if (best && best.z > u.z) continue;
        u.hp -= dmg;
        if (u.hp <= 0) {
          u.alive = false;
          this.particles.burst(u.x, 0.6, u.z, ENEMY_COLOR, 6, 4);
          sfx.pop();
        }
        return true;
      }
    }
    if (best) {
      if (best.hit(dmg)) this.onDestroyed(best);
      else if (best.kind === 'stat') sfx.tick();
      return true;
    }
    // บอส
    if (this.boss && this.state === 'boss' && this.bossHp > 0) {
      const bz = this.boss.group.position.z;
      if (z1 <= bz + this.boss.radius && Math.abs(x) < this.boss.radius * 1.2) {
        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.bossPending += dmg;
        this.hurtFx += 1;
        if (this.hurtFx > 6) {
          this.hurtFx = 0;
          this.boss.hurt();
          sfx.hit();
        }
        return true;
      }
    }
    return false;
  }

  private onDestroyed(t: Target): void {
    t.label?.remove();
    t.label = null;
    const p = this.project(t.x, 2.2, t.z);
    if (t instanceof BlockTarget) {
      t.group.visible = false;
      this.particles.burst(t.x, 1, t.z, 0x9a8f80, 18, 6, 0.2, 0.9);
      this.collected += t.coins;
      this.ui.coinPop(`+${t.coins}`, p.x, p.y);
      sfx.breakBlock();
      buzz('light');
    } else if (t instanceof CageTarget) {
      t.group.visible = false;
      this.particles.burst(t.x, 1, t.z, 0x4a4f5a, 18, 6, 0.16, 0.9);
      for (const s of t.prisonerSpots()) this.addTroop(false, s.x, s.z);
      this.ui.floatText(`+${t.prisoners} 🧍`, p.x, p.y, true);
      sfx.join();
      buzz('medium');
    } else if (t instanceof CrystalTarget) {
      t.group.visible = false;
      this.particles.burst(t.x, 1.4, t.z, t.color, 22, 7, 0.2, 1.0);
      this.collected += t.coins;
      this.ui.coinPop(`+${t.coins}`, p.x, p.y);
      sfx.breakBlock();
    } else if (t.kind === 'capsule') {
      (t as unknown as { shatter(): void }).shatter();
      this.particles.burst(t.x, 1, t.z, 0xcff6ff, 14, 5, 0.12, 0.7);
      sfx.breakBlock();
    }
  }

  private addTroop(elite: boolean, wx: number, wz: number): void {
    if (this.squad.count < this.cap) {
      this.squad.add(elite, wx, wz);
      return;
    }
    if (elite && this.squad.promote()) return;
    // ฝูงเต็ม: แปลงเป็นเหรียญ
    this.collected += elite ? 8 : 3;
    const p = this.project(wx, 1.5, wz);
    this.ui.coinPop(`เต็ม +${elite ? 8 : 3}`, p.x, p.y);
  }

  /** สถิติการตายของทหาร (ใช้ตรวจความยาก) */
  readonly deaths = { block: 0, hazard: 0, enemy: 0, boss: 0 };

  private killTroop(i: number, cause: 'block' | 'hazard' | 'enemy' | 'boss'): void {
    this.deaths[cause]++;
    const tr = this.squad.troops[i];
    const wx = this.clampX(this.squad.x + tr.ox);
    const wz = this.squad.z + tr.oz;
    this.squad.remove(i);
    this.particles.burst(wx, 0.6, wz, tr.elite ? ELITE_COLOR : PLAYER_COLOR, 6, 4);
    sfx.pop();
    buzz('light');
  }

  private troopCollisions(): void {
    const r = this.squad.radiusZ();
    const solid: Target[] = [...this.blocks, ...this.cages];
    for (const b of solid) {
      if (!b.alive || Math.abs(b.z - this.squad.z) > r + 1.6) continue;
      for (let i = this.squad.troops.length - 1; i >= 0; i--) {
        const tr = this.squad.troops[i];
        const wx = this.clampX(this.squad.x + tr.ox);
        const wz = this.squad.z + tr.oz;
        if (Math.abs(wx - b.x) < b.halfW + 0.15 && Math.abs(wz - b.z) < b.halfD + 0.2) {
          this.killTroop(i, 'block');
          if (b.hit(this.baseDmg * this.powMul * 3)) {
            this.onDestroyed(b);
            break;
          }
        }
      }
    }
    for (const h of this.hazards) {
      if (Math.abs(h.z - this.squad.z) > r + 1.5) continue;
      for (let i = this.squad.troops.length - 1; i >= 0; i--) {
        const tr = this.squad.troops[i];
        const wx = this.clampX(this.squad.x + tr.ox);
        if (h.hits(wx, this.squad.z + tr.oz)) this.killTroop(i, 'hazard');
      }
    }
  }

  private checkGates(): void {
    for (const g of this.gates) {
      if (g.applied || this.squad.z > g.z) continue;
      g.applied = true;
      g.alive = false;
      g.label?.remove();
      if (Math.abs(this.squad.x - g.x) > 2.05) continue;
      const v = Math.round(g.value);
      const k = Math.max(0.3, 1 + v / 100);
      if (g.stat === 'rate') this.rateMul = Math.max(0.3, this.rateMul * k);
      else if (g.stat === 'range') this.rangeMul = Math.max(0.4, this.rangeMul * k);
      else this.powMul = Math.max(0.3, this.powMul * k);
      const p = this.project(this.squad.x, 2.4, this.squad.z);
      this.ui.floatText(`${STAT_LABEL[g.stat]} ${v >= 0 ? '+' : ''}${v}%`, p.x, p.y, v >= 0);
      if (v >= 0) {
        sfx.gateGood();
        this.particles.burst(this.squad.x, 1, this.squad.z, 0x7dffb0, 14, 5, 0.12);
      } else {
        sfx.gateBad();
        this.particles.burst(this.squad.x, 1, this.squad.z, 0xff6b6b, 14, 5, 0.12);
      }
      buzz('medium');
    }
  }

  private checkPads(): void {
    const r = this.squad.radiusX();
    for (const p of this.pads) {
      if (p.collected || this.squad.z > p.z) continue;
      p.collected = true;
      if (Math.abs(this.squad.x - p.x) > 1.6 + r * 0.5) continue;
      let got = 0;
      for (const c of p.capsules) {
        if (c.alive) continue;
        c.unit.visible = false;
        this.addTroop(true, c.x, c.z);
        got++;
      }
      if (got) {
        const pp = this.project(p.x, 2, p.z);
        this.ui.floatText(`+${got} ทหารพิเศษ`, pp.x, pp.y, true);
        sfx.join();
        buzz('medium');
      }
    }
  }

  private updateEnemies(dt: number): void {
    const rx = this.squad.radiusX();
    const rz = this.squad.radiusZ();
    for (const g of this.enemies) {
      if (!g.charging) {
        if (g.z - this.squad.z > -13) {
          g.charging = true;
          g.swarm.run.value = 1;
        } else continue;
      }
      for (const u of g.units) {
        if (!u.alive) continue;
        const dx = this.squad.x - u.x;
        const dz = this.squad.z - u.z;
        const d = Math.hypot(dx, dz) || 1;
        u.x += (dx / d) * 4.5 * dt;
        u.z += (dz / d) * 4.5 * dt;
        if (u.z > this.squad.z + 4) u.alive = false;
        // ชนขอบฝูง (วงรี)
        const inside = (dx / (rx + 0.1)) ** 2 + (dz / (rz + 0.1)) ** 2 < 1;
        if (inside && this.squad.count) {
          // ชนแล้วตายทั้งคู่: เลือกทหารที่ใกล้ที่สุด
          let bi = 0;
          let bd = Infinity;
          for (let i = 0; i < this.squad.troops.length; i++) {
            const tr = this.squad.troops[i];
            const dd = Math.hypot(this.squad.x + tr.ox - u.x, this.squad.z + tr.oz - u.z);
            if (dd < bd) {
              bd = dd;
              bi = i;
            }
          }
          this.killTroop(bi, 'enemy');
          u.alive = false;
          this.particles.burst(u.x, 0.6, u.z, ENEMY_COLOR, 6, 4);
        }
      }
    }
  }

  private blockedByCrystal(): boolean {
    const front = this.squad.z - this.squad.radiusZ() * 0.8;
    const rx = this.squad.radiusX();
    for (const c of this.crystals) {
      if (!c.alive) continue;
      const gap = front - (c.z + c.halfD);
      if (gap < -1 || gap > 0.2) continue;
      if (Math.abs(c.x - this.squad.x) < c.halfW + rx * 0.8) return true;
    }
    return false;
  }

  private startBonus(): void {
    this.state = 'bonus';
    this.ui.showHint(false);
    this.ui.toast('ทุ่งสมบัติ! ยิงคริสตัลเก็บเหรียญ 💎');
    sfx.gateGood();
  }

  private startBoss(): void {
    this.state = 'boss';
    this.bossHp = this.level.bossHp;
    this.stompTimer = -1;
    this.bossTime = 0;
    this.squad.targetX = 0;
    this.ui.showHint(false);
    this.ui.showBossBar(true);
  }

  private updateBoss(dt: number): void {
    const boss = this.boss!;
    const L = this.level;
    this.squad.targetX = 0;
    const atStop = this.dist >= L.endD - BOSS_STOP - 0.05;
    if (atStop) {
      this.bossTime += dt;
      this.stompTimer += dt;
      if (this.stompTimer >= BOSS_STOMP_INTERVAL && this.bossHp > 0) {
        this.stompTimer = 0;
        boss.stomp();
      }
    }
    if (boss.update(dt, this.t)) {
      const n = this.squad.count;
      // ฝูงเล็กเสียตามสัดส่วน (มีโอกาสไม่เสียเลย) บอสยิ่งสู้นานยิ่งแรง
      const exp = n * BOSS_STOMP_KILL * (1 + this.bossTime / 10);
      const kill = Math.min(n, Math.floor(exp) + (Math.random() < exp % 1 ? 1 : 0));
      for (let k = 0; k < kill; k++) this.killTroop(Math.floor(Math.random() * this.squad.count), 'boss');
      sfx.stomp();
      buzz('heavy');
      this.shake = 0.35;
    }
    this.ui.setBossHp(this.bossHp / L.bossHp, this.bossHp);
    if (this.bossHp <= 0) {
      boss.die();
      this.particles.confetti(0, 3, boss.group.position.z, 90);
      this.ui.hideBossBar();
      this.win();
      return;
    }
    if (this.squad.count === 0) this.lose();
  }

  private win(): void {
    this.state = 'won';
    this.endTimer = 1.6;
    sfx.win();
    buzz('heavy');
    this.ui.showHint(false);
    const z = this.boss ? this.boss.group.position.z : this.squad.z - 4;
    this.particles.confetti(this.squad.x, 3, z, 60);
  }

  private lose(): void {
    if (this.state === 'lost') return;
    this.state = 'lost';
    this.endTimer = 1.2;
    this.squad.troops = [];
    sfx.lose();
    buzz('heavy');
    this.ui.hideBossBar();
    this.ui.showHint(false);
  }

  private updateEnd(dt: number): void {
    this.boss?.update(dt, this.t);
    this.projectiles!.update(dt, PROJECTILE_SPEED, () => false);
    if (this.state === 'won' && Math.random() < dt * 3) {
      this.particles.confetti(this.squad.x + (Math.random() - 0.5) * 6, 4, this.squad.z - 5, 10);
    }
    this.endTimer -= dt;
    if (this.endTimer <= 0) this.finish(this.state === 'won');
  }

  private finish(win: boolean): void {
    const L = this.level;
    const up = this.save.upgrades;
    let reward: number;
    let newCycle = false;
    if (win) {
      reward = winReward(L.level, this.collected, L.eraBoss, L.cycle, up.economy);
      this.save.level = L.level + 1;
      this.save.failStreak = 0;
      if (this.save.level > LEVELS_PER_CYCLE) {
        // เคลียร์ครบทุกยุค: เริ่มรอบใหม่ที่ยากขึ้น ทหารเริ่มต้นเหลือ 1 ตัว
        this.save.cycle += 1;
        this.save.level = 1;
        this.save.upgrades.troop = 0;
        newCycle = true;
      }
    } else {
      reward = loseReward(this.collected, up.economy);
      this.save.failStreak++;
    }
    this.save.coins += reward;
    this.pendingReward = reward;
    refreshStamina(this.save.stamina, Date.now());
    writeSave(this.save);
    const newEra = eraIndexForLevel(this.save.level);
    const evolved = win && !newCycle && newEra > L.era ? ERAS[newEra] : null;
    if (evolved || newCycle) sfx.evolve();
    this.state = 'result';
    this.ui.hideHud();
    this.ui.showResult({
      win,
      level: L.level,
      reward,
      collected: this.collected,
      survivors: this.squad.count,
      evolved,
      newCycle: newCycle ? this.save.cycle : 0,
      castle: this.reachedCastle,
      wheel: win && Math.random() < WHEEL_CHANCE,
      income: incomeMult(up.economy),
      save: this.save,
    });
  }

  // ---------- การแสดงผล ----------

  private clampX(x: number): number {
    const lim = TRACK_WIDTH / 2 - 0.35;
    return Math.max(-lim, Math.min(lim, x));
  }

  private renderUnits(): void {
    const sw = this.swarm;
    const ew = this.eliteSwarm;
    if (!sw || !ew) return;
    const t = sharedTime.value;
    const celebrate = this.state === 'won' || (this.state === 'result' && this.squad.count > 0);
    if (this.state === 'menu') {
      sw.run.value = 0;
      ew.run.value = 0;
    }
    sw.begin();
    ew.begin();
    const sx = this.squad.x;
    const sz = this.squad.z;
    for (let i = 0; i < this.squad.troops.length; i++) {
      const tr = this.squad.troops[i];
      const x = this.clampX(sx + tr.ox);
      const z = sz + tr.oz;
      let y = 0;
      if (celebrate) y = Math.max(0, Math.sin(t * 9 + i * 0.9)) * 0.45;
      else if (this.speed > 0.5) y = Math.abs(Math.sin(t * 13 + i)) * 0.05;
      (tr.elite ? ew : sw).push(x, y, z, 0, tr.s * (tr.elite ? 1.12 : 1));
    }
    sw.end();
    ew.end();
    this.shadow.visible = this.squad.count > 0;
    this.shadow.position.set(sx, 0.02, sz);
    this.shadow.scale.set(this.squad.radiusX() * 1.2, this.squad.radiusZ() * 1.1, 1);

    for (const g of this.enemies) {
      const near = Math.abs(g.z - sz) < 90;
      g.swarm.mesh.visible = near;
      if (!near) continue;
      g.swarm.begin();
      for (const u of g.units) {
        if (!u.alive) continue;
        const rot = g.charging ? Math.atan2(-(sx - u.x), -(sz - u.z)) : Math.PI;
        g.swarm.push(this.clampX(u.x), 0, u.z, rot, 1);
      }
      g.swarm.end();
    }
  }

  private snapCamera(): void {
    this.computeCamera(this.camPos, this.camLook);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  private computeCamera(pos: Vector3, look: Vector3): void {
    const f = Math.max(0.95, Math.min(1.3, 0.58 / this.camera.aspect));
    const st = this.state === 'paused' ? this.pausedFrom : this.state;
    const bossView = this.boss && (st === 'boss' || ((st === 'won' || st === 'result' || st === 'lost') && this.level.eraBoss && this.dist >= this.level.finishD));
    if (bossView && this.boss) {
      const bz = this.boss.group.position.z;
      pos.set(0, 9.5 * f, this.squad.z + 8.5 * f);
      look.set(0, 2.2, bz + 3);
      return;
    }
    if (st === 'menu') {
      const sway = Math.sin(this.t * 0.35) * 1.0;
      pos.set(sway, 5.2 * f, this.squad.z + 7.5 * f);
      look.set(0, 0.8, this.squad.z - 4);
      return;
    }
    const r = Math.min(this.squad.radiusZ() * 0.7, 4);
    const cx = this.squad.x * 0.4;
    pos.set(cx, (6.4 + r * 0.8) * f, this.squad.z + (8.2 + r * 1.0) * f);
    look.set(cx, 0.6, this.squad.z - 8);
  }

  private updateCamera(dt: number): void {
    const pos = this.tmpV.set(0, 0, 0);
    const look = new Vector3();
    this.computeCamera(pos, look);
    const k = 1 - Math.exp(-dt * (this.state === 'run' || this.state === 'bonus' ? 8 : 3));
    this.camPos.lerp(pos, k);
    this.camLook.lerp(look, k);
    this.camera.position.copy(this.camPos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const s = this.shake * 0.9;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(this.camLook);
  }

  private project(x: number, y: number, z: number): { x: number; y: number; vis: boolean } {
    const p = new Vector3(x, y, z).project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
      vis: p.z < 1 && p.z > -1,
    };
  }

  private updateHud(): void {
    this.ui.setHudStats({
      coins: this.collected,
      troops: this.squad.count,
      cap: this.cap,
      rate: this.rateMul,
      range: this.rangeMul,
      power: this.powMul,
    });
  }

  private updateLabels(dt: number): void {
    const playing = this.state === 'run' || this.state === 'bonus' || this.state === 'boss' || this.state === 'paused' || this.state === 'menu';
    if (playing && this.squad.count > 0) {
      const p = this.project(this.squad.x, 1.9, this.squad.z - this.squad.radiusZ() * 0.4);
      this.ui.setCrowdLabel(this.squad.count, p.x, p.y, p.vis);
    } else {
      this.ui.setCrowdLabel(0, 0, 0, false);
    }

    const sz = this.squad.z;
    for (const t of this.targets) {
      const showable = t.kind !== 'stat' && t.alive && t.z < sz + 1 && t.z > sz - 45 && this.state !== 'menu';
      if (!showable) {
        if (t.label) t.label.style.display = 'none';
      } else {
        t.label ??= this.ui.makeLabel('hp');
        const y = t.kind === 'crystal' ? 3.0 : t.kind === 'capsule' ? 2.1 : 2.35;
        const p = this.project(t.x, y, t.z);
        this.ui.setLabel(t.label, Math.ceil(t.hp), p.x, p.y, p.vis);
      }
      if (t.pending > 0) {
        t.pendT += dt;
        if (t.pendT > 0.16) {
          t.pendT = 0;
          const p = this.project(t.x + (Math.random() - 0.5) * 1.2, 1.4 + Math.random(), t.z);
          if (p.vis && this.state !== 'paused') this.ui.damageNumber(Math.round(t.pending), p.x, p.y);
          t.pending = 0;
        }
      }
    }
    if (this.boss && this.state === 'boss') {
      const p = this.project(0, this.boss.scale * 1.45 + 0.6, this.boss.group.position.z);
      this.ui.placeBossBar(p.x, p.y);
      this.bossPendT += dt;
      if (this.bossPending > 0 && this.bossPendT > 0.16) {
        this.bossPendT = 0;
        const q = this.project((Math.random() - 0.5) * 2.5, 2 + Math.random() * 3, this.boss.group.position.z + 1);
        this.ui.damageNumber(Math.round(this.bossPending), q.x, q.y);
        this.bossPending = 0;
      }
    }
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.7 ? 66 : 55;
    this.camera.updateProjectionMatrix();
  }
}
