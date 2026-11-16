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
  BOSS_STOMP_INTERVAL,
  BOSS_STOMP_KILL,
  MAX_VISIBLE_ENEMIES,
  RUN_SPEED,
  TRACK_WIDTH,
} from '../config.ts';
import {
  incomeMult,
  loseReward,
  playerPower,
  startCrowd,
  UPGRADES,
  upgradeCost,
  winReward,
  type UpgradeId,
} from '../economy.ts';
import { ENEMY_COLOR, ERAS, eraIndexForLevel, PLAYER_COLOR } from '../eras.ts';
import { sfx, setMusic, setSound, suspendAudio, resumeAudio } from '../audio.ts';
import { buzz, exitApp, setVibration } from '../platform.ts';
import { clearSave, defaultSave, loadSave, writeSave, type SaveData } from '../save.ts';
import { consumeStamina, refreshStamina } from '../stamina.ts';
import { Boss } from '../render/boss.ts';
import { makeBlobShadow } from '../render/common.ts';
import { GatePair } from '../render/gates.ts';
import { createObstacle, type Obstacle } from '../render/obstacles.ts';
import { Particles } from '../render/particles.ts';
import { sharedTime, UnitSwarm } from '../render/units.ts';
import { ARENA_RADIUS, World } from '../render/world.ts';
import type { UI } from '../ui/ui.ts';
import { Crowd, formationOffset, formationRadius } from './crowd.ts';
import {
  applyGate,
  gateLabel,
  generateLevel,
  isGoodGate,
  type EnemySection,
  type GateSection,
  type LevelData,
} from './level.ts';

type State = 'menu' | 'run' | 'boss' | 'won' | 'lost' | 'result' | 'paused';

interface EnemyGroup {
  sec: EnemySection;
  count: number;
  swarm: UnitSwarm;
  members: { ox: number; oz: number }[];
  cx: number;
  cz: number;
  state: 'idle' | 'charge' | 'fight' | 'dead';
  shadow: Mesh;
  label: HTMLElement;
}

const v3 = new Vector3();

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
  private gates: { sec: GateSection; obj: GatePair }[] = [];
  private obstacles: Obstacle[] = [];
  private enemies: EnemyGroup[] = [];
  private boss: Boss | null = null;
  private crowdSwarm: UnitSwarm | null = null;
  private swarmEra = -1;
  private crowd = new Crowd();
  private crowdShadow: Mesh;
  private particles = new Particles();

  private t = 0;
  private dist = 0;
  private speed = 0;
  private battle: EnemyGroup | null = null;
  private battleTick = 0;
  private bossHp = 0;
  private bossDps = 0;
  private stompTimer = 0;
  private bossTime = 0;
  private hitFx = 0;
  private endTimer = 0;
  private shake = 0;
  private dragging = false;
  private lastX = 0;
  private hintTimer = 0;
  private camPos = new Vector3(0, 8, 12);
  private camLook = new Vector3(0, 0, -6);
  private pPower = 1;

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

    this.crowdShadow = makeBlobShadow();
    this.scene.add(this.crowdShadow);

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
      if (this.state !== 'run') return;
      const scale = (TRACK_WIDTH * 1.35) / Math.max(320, window.innerWidth);
      const lim = this.crowd.maxX();
      this.crowd.targetX = Math.max(-lim, Math.min(lim, this.crowd.targetX + dx * scale));
      if (this.hintTimer > 0 && Math.abs(dx) > 2) this.hintTimer = Math.min(this.hintTimer, 0.3);
    });
    const end = () => (this.dragging = false);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ---------- สร้างด่าน ----------

  private stats() {
    return {
      startCrowd: startCrowd(this.save.upgrades.start),
      power: playerPower(this.save.upgrades.power),
      failStreak: this.save.failStreak,
    };
  }

  private clearLevel(): void {
    this.world?.dispose();
    this.world = null;
    for (const g of this.gates) {
      g.obj.group.removeFromParent();
      g.obj.dispose();
    }
    this.gates = [];
    for (const o of this.obstacles) o.group.removeFromParent();
    this.obstacles = [];
    for (const e of this.enemies) {
      e.swarm.dispose();
      e.shadow.removeFromParent();
      e.label.remove();
    }
    this.enemies = [];
    this.boss?.dispose();
    this.boss = null;
    this.battle = null;
    this.particles.clear();
  }

  buildLevel(): void {
    this.clearLevel();
    const stats = this.stats();
    this.pPower = stats.power;
    this.level = generateLevel(this.save.level, stats);
    const L = this.level;
    const era = ERAS[L.era];

    this.world = new World(this.scene, era, L.bossD, L.level * 31 + 7);

    for (const sec of L.sections) {
      if (sec.type === 'gates') {
        const obj = new GatePair(-sec.d, sec.left, sec.right);
        this.scene.add(obj.group);
        this.gates.push({ sec, obj });
      } else if (sec.type === 'obstacle') {
        const o = createObstacle(sec);
        this.scene.add(o.group);
        this.obstacles.push(o);
      } else {
        const vis = Math.min(sec.count, MAX_VISIBLE_ENEMIES);
        const swarm = new UnitSwarm(L.era, ENEMY_COLOR, vis);
        swarm.run.value = 0;
        this.scene.add(swarm.mesh);
        const members = [];
        for (let i = 0; i < vis; i++) {
          const [ox, oz] = formationOffset(i);
          members.push({ ox, oz });
        }
        const shadow = makeBlobShadow();
        this.scene.add(shadow);
        this.enemies.push({
          sec,
          count: sec.count,
          swarm,
          members,
          cx: 0,
          cz: -sec.d,
          state: 'idle',
          shadow,
          label: this.ui.makeLabel('enemy'),
        });
      }
    }

    this.boss = new Boss(L.era, -L.bossD, L.eraBoss);
    this.scene.add(this.boss.group);

    if (this.swarmEra !== L.era || !this.crowdSwarm) {
      this.crowdSwarm?.dispose();
      this.crowdSwarm = new UnitSwarm(L.era, PLAYER_COLOR, 310);
      this.scene.add(this.crowdSwarm.mesh);
      this.swarmEra = L.era;
    }

    this.crowd.reset(stats.startCrowd);
    this.crowd.z = 0;
    this.dist = 0;
    this.speed = 0;
    this.t = 0;
    this.shake = 0;
    this.snapCamera();
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
        return {
          id: u.id,
          name: u.nameTh,
          icon: u.icon,
          lvl,
          desc: u.describe(lvl),
          next: u.describe(lvl + 1),
          cost,
          affordable: this.save.coins >= cost,
        };
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
    if (id !== 'income') this.buildLevel();
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
    this.ui.showHud(this.level.level, this.level.eraBoss);
    this.ui.showHint(true);
    sfx.click();
  }

  pause(): void {
    if (this.state !== 'run' && this.state !== 'boss') return;
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
    if (this.state === 'run' || this.state === 'boss') this.pause();
    else if (this.state === 'paused') this.resume();
    else if (this.state === 'result') this.quitToMenu();
    else if (this.state === 'menu') exitApp();
  }

  // ---------- ลูปหลัก ----------

  update(dt: number): void {
    const running = this.state !== 'paused';
    if (running) {
      sharedTime.value += dt;
      this.t += dt;
      switch (this.state) {
        case 'run':
          this.updateRun(dt);
          break;
        case 'boss':
          this.updateBoss(dt);
          break;
        case 'won':
        case 'lost':
          this.updateEnd(dt);
          break;
        default:
          break;
      }
      for (const o of this.obstacles) {
        if (Math.abs(o.z - this.crowd.z) < 90) o.update(this.t, dt);
      }
      for (const g of this.gates) g.obj.update(dt);
      this.crowd.update(dt);
      this.particles.update(dt);
    }
    this.renderUnits();
    this.updateCamera(dt);
    this.updateLabels();
    if (this.state === 'menu') this.ui.tickMenu(this.save, Date.now());
    this.renderer.render(this.scene, this.camera);
  }

  private updateRun(dt: number): void {
    const L = this.level;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.ui.showHint(false);
    }

    // เคลื่อนที่
    const targetSpeed = this.battle ? 0 : RUN_SPEED;
    this.speed += (targetSpeed - this.speed) * (1 - Math.exp(-dt * (this.battle ? 12 : 4)));
    this.dist += this.speed * dt;
    this.crowd.z = -this.dist;
    const lim = this.crowd.maxX();
    this.crowd.targetX = Math.max(-lim, Math.min(lim, this.crowd.targetX));
    this.crowd.x += (this.crowd.targetX - this.crowd.x) * (1 - Math.exp(-dt * 12));
    this.crowdSwarm!.run.value = Math.min(1, this.speed / 3 + (this.battle ? 1 : 0));
    this.ui.setProgress(Math.min(1, this.dist / (L.bossD - ARENA_RADIUS)));

    // ประตู
    for (const g of this.gates) {
      if (g.obj.passed || this.dist < g.sec.d) continue;
      const leftSide = this.crowd.x < 0;
      const op = leftSide ? g.sec.left : g.sec.right;
      g.obj.pass(leftSide ? 0 : 1);
      const before = this.crowd.count;
      const after = applyGate(op, before);
      this.crowd.setCount(after);
      const good = isGoodGate(op);
      const p = this.project(this.crowd.x, 2.4, this.crowd.z);
      this.ui.floatText(gateLabel(op), p.x, p.y, good);
      if (good) {
        sfx.gateGood();
        buzz('light');
        this.particles.burst(this.crowd.x, 1, this.crowd.z, 0x7fd0ff, 14, 5, 0.12);
      } else {
        sfx.gateBad();
        buzz('medium');
        this.particles.burst(this.crowd.x, 1, this.crowd.z, 0xff5a5a, 16, 5, 0.14);
      }
      this.ui.bumpCrowd();
      if (this.crowd.count <= 0) return this.lose();
    }

    // สิ่งกีดขวาง
    for (const o of this.obstacles) {
      if (Math.abs(o.z - this.crowd.z) > this.crowd.radius() + 1.5) continue;
      for (let i = this.crowd.members.length - 1; i >= 0; i--) {
        const m = this.crowd.members[i];
        const wx = this.clampX(this.crowd.x + m.ox);
        const wz = this.crowd.z + m.oz;
        if (o.hits(wx, wz)) {
          this.crowd.killMember(i);
          this.particles.burst(wx, 0.6, wz, PLAYER_COLOR, 5, 4);
          sfx.pop();
          buzz('light');
        }
      }
      if (this.crowd.count <= 0) return this.lose();
    }

    // กลุ่มศัตรู
    const front = this.crowd.z - this.crowd.radius();
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      const eRad = formationRadius(e.members.length);
      const eFront = e.cz + eRad;
      const gap = front - eFront;
      if (e.state === 'idle' && gap < 14) {
        e.state = 'charge';
        e.swarm.run.value = 1;
      }
      if (e.state === 'charge' || e.state === 'fight') {
        // วิ่งเข้าหาฝูงผู้เล่น
        e.cx += (this.crowd.x - e.cx) * (1 - Math.exp(-dt * 3));
      }
      if (e.state === 'charge') {
        e.cz += 4.5 * dt;
        if (gap < 0.6) {
          e.state = 'fight';
          this.battle = e;
          this.battleTick = 0;
        }
      }
    }
    if (this.battle) this.updateBattle(dt);

    // ถึงลานบอส
    if (this.dist >= L.bossD - ARENA_RADIUS + 0.5 && !this.battle) this.startBoss();
  }

  private updateBattle(dt: number): void {
    const e = this.battle!;
    const L = this.level;
    // ศัตรูวิ่งเข้าประชิด
    const front = this.crowd.z - this.crowd.radius();
    const eFront = e.cz + formationRadius(e.members.length);
    if (front - eFront > 0.3) e.cz += 6 * dt;
    this.battleTick += dt;
    while (this.battleTick >= 0.05 && e.count > 0 && this.crowd.count > 0) {
      this.battleTick -= 0.05;
      const effEnemy = (e.count * L.enemyPower) / this.pPower;
      const chunk = Math.min(this.crowd.count, Math.max(1, Math.ceil(Math.min(this.crowd.count, effEnemy) * 0.07)));
      const lostPos = this.crowd.removePeople(chunk, 'front');
      for (const p of lostPos) this.particles.burst(this.clampX(p.x), 0.6, p.z, PLAYER_COLOR, 3, 3.5);
      const enemyLoss = (chunk * this.pPower) / L.enemyPower;
      this.shrinkEnemy(e, enemyLoss);
      sfx.pop();
    }
    buzz('light');
    if (e.count <= 0.001) {
      e.state = 'dead';
      e.count = 0;
      e.label.style.display = 'none';
      e.shadow.visible = false;
      e.swarm.mesh.visible = false;
      this.battle = null;
      this.ui.bumpCrowd();
    }
    if (this.crowd.count <= 0) this.lose();
  }

  private shrinkEnemy(e: EnemyGroup, loss: number): void {
    const before = e.count;
    e.count = Math.max(0, e.count - loss);
    const want = Math.min(Math.ceil(e.count - 1e-6), MAX_VISIBLE_ENEMIES);
    const kill = e.members.length - want;
    if (kill <= 0) {
      if (before <= MAX_VISIBLE_ENEMIES || !e.members.length) return;
      // จำนวนจริงเยอะกว่าที่วาด: แนวหน้าล้ม แล้วมีคนจากด้านหลังมาแทน
      const idx = this.frontEnemy(e);
      const m = e.members[idx];
      this.particles.burst(e.cx + m.ox, 0.6, e.cz + m.oz, ENEMY_COLOR, 3, 3.5);
      const r = formationRadius(e.members.length);
      m.ox = (Math.random() - 0.5) * r;
      m.oz = -r;
      return;
    }
    for (let k = 0; k < kill && e.members.length; k++) {
      const idx = this.frontEnemy(e);
      const m = e.members[idx];
      this.particles.burst(e.cx + m.ox, 0.6, e.cz + m.oz, ENEMY_COLOR, 3, 3.5);
      e.members.splice(idx, 1);
    }
  }

  private frontEnemy(e: EnemyGroup): number {
    let idx = 0;
    let best = -Infinity;
    for (let i = 0; i < e.members.length; i++) {
      if (e.members[i].oz > best) {
        best = e.members[i].oz;
        idx = i;
      }
    }
    return idx;
  }

  private startBoss(): void {
    const boss = this.boss!;
    this.state = 'boss';
    this.crowd.rebase(0, boss.group.position.z);
    this.crowd.mode = 'ring';
    this.crowd.ringInner = Math.round((boss.radius + 0.55) * 10) / 10;
    this.crowd.targetX = 0;
    this.bossHp = this.level.bossHp;
    this.stompTimer = -0.6;
    this.bossTime = 0;
    this.crowdSwarm!.run.value = 1;
    this.ui.showHint(false);
    this.ui.showBossBar(this.level.eraBoss);
    this.ui.setProgress(1);
  }

  private updateBoss(dt: number): void {
    const boss = this.boss!;
    this.bossTime += dt;
    if (this.bossTime > 0.5) {
      const dmg = this.crowd.count * this.pPower * dt;
      this.bossHp = Math.max(0, this.bossHp - dmg);
      this.bossDps = this.crowd.count * this.pPower;
      this.hitFx += dt;
      if (this.hitFx > 0.12) {
        this.hitFx = 0;
        boss.hurt();
        sfx.hit();
        const a = Math.random() * Math.PI * 2;
        this.particles.burst(Math.cos(a) * boss.radius, 1 + Math.random() * 2, boss.group.position.z + Math.sin(a) * boss.radius, 0xffe066, 3, 3, 0.1, 0.4);
      }
    }
    this.stompTimer += dt;
    if (this.stompTimer >= BOSS_STOMP_INTERVAL && this.bossHp > 0) {
      this.stompTimer = 0;
      boss.stomp();
    }
    if (boss.update(dt, this.t)) {
      const kill = Math.max(1, Math.ceil(this.crowd.count * BOSS_STOMP_KILL));
      const lost = this.crowd.removePeople(kill, 'random');
      for (const p of lost) this.particles.burst(p.x, 0.6, p.z, PLAYER_COLOR, 3, 5);
      sfx.stomp();
      buzz('heavy');
      this.shake = 0.35;
    }
    this.ui.setBossHp(this.bossHp / this.level.bossHp, this.bossHp);
    if (this.bossHp <= 0) {
      boss.die();
      this.state = 'won';
      this.endTimer = 1.7;
      sfx.win();
      buzz('heavy');
      this.particles.confetti(0, 3, boss.group.position.z, 90);
      this.ui.hideBossBar();
      return;
    }
    if (this.crowd.count <= 0) this.lose();
  }

  private lose(): void {
    if (this.state === 'lost') return;
    this.state = 'lost';
    this.endTimer = 1.1;
    this.battle = null;
    this.crowd.count = 0;
    this.crowd.members = [];
    sfx.lose();
    buzz('heavy');
    this.ui.hideBossBar();
    this.ui.showHint(false);
  }

  private updateEnd(dt: number): void {
    this.boss?.update(dt, this.t);
    if (this.state === 'won' && Math.random() < dt * 3) {
      this.particles.confetti((Math.random() - 0.5) * 8, 4, this.boss!.group.position.z + (Math.random() - 0.5) * 6, 12);
    }
    this.endTimer -= dt;
    if (this.endTimer <= 0) this.finish(this.state === 'won');
  }

  private finish(win: boolean): void {
    const L = this.level;
    const survivors = Math.round(this.crowd.count);
    const prevEra = L.era;
    let reward: number;
    if (win) {
      reward = winReward(L.level, survivors, L.eraBoss, this.save.upgrades.income);
      this.save.level = L.level + 1;
      this.save.bestLevel = Math.max(this.save.bestLevel, this.save.level);
      this.save.failStreak = 0;
    } else {
      const progress = Math.min(1, this.dist / L.bossD);
      reward = loseReward(L.level, progress, this.save.upgrades.income);
      this.save.failStreak++;
    }
    this.save.coins += reward;
    refreshStamina(this.save.stamina, Date.now());
    writeSave(this.save);
    const newEra = eraIndexForLevel(this.save.level);
    const evolved = win && newEra > prevEra ? ERAS[newEra] : null;
    if (evolved) sfx.evolve();
    this.state = 'result';
    this.ui.hideHud();
    this.ui.showResult({
      win,
      level: L.level,
      reward,
      survivors,
      evolved,
      income: incomeMult(this.save.upgrades.income),
      save: this.save,
    });
  }

  // ---------- การแสดงผล ----------

  private clampX(x: number): number {
    const lim = TRACK_WIDTH / 2 - 0.3;
    return Math.max(-lim, Math.min(lim, x));
  }

  private renderUnits(): void {
    const sw = this.crowdSwarm;
    if (!sw) return;
    const t = sharedTime.value;
    const ring = this.crowd.mode === 'ring';
    const celebrate = this.state === 'won' || this.state === 'result';
    const runAnim = this.state === 'run' || this.state === 'boss' || celebrate;
    if (this.state === 'menu') sw.run.value = 0;
    sw.begin();
    const cx = this.crowd.x;
    const cz = this.crowd.z;
    for (let i = 0; i < this.crowd.members.length; i++) {
      const m = this.crowd.members[i];
      let x = cx + m.ox;
      let z = cz + m.oz;
      let rot = 0;
      let y = 0;
      if (ring) {
        rot = Math.atan2(m.ox, m.oz);
        // พุ่งเข้าโจมตี
        if (this.state === 'boss' && this.bossTime > 0.5) {
          const lunge = Math.max(0, Math.sin(t * 12 + i * 1.7)) * 0.18;
          const len = Math.hypot(m.ox, m.oz) || 1;
          x -= (m.ox / len) * lunge;
          z -= (m.oz / len) * lunge;
        }
      } else {
        x = this.clampX(x);
      }
      if (celebrate) y = Math.max(0, Math.sin(t * 9 + i * 0.9)) * 0.5;
      else if (runAnim) y = Math.abs(Math.sin(t * 13 + i)) * 0.05;
      sw.push(x, y, z, rot, m.s);
    }
    sw.end();
    const r = this.crowd.radius();
    this.crowdShadow.visible = !ring && this.crowd.members.length > 0;
    this.crowdShadow.position.set(cx, 0.02, cz);
    this.crowdShadow.scale.setScalar(r * 1.15);

    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      const near = Math.abs(e.cz - cz) < 110;
      e.swarm.mesh.visible = near;
      e.shadow.visible = near;
      if (!near) continue;
      e.swarm.begin();
      for (let i = 0; i < e.members.length; i++) {
        const m = e.members[i];
        const y = e.state === 'idle' ? 0 : Math.abs(Math.sin(t * 13 + i)) * 0.05;
        e.swarm.push(this.clampX(e.cx + m.ox), y, e.cz + m.oz, Math.PI, 1);
      }
      e.swarm.end();
      const er = formationRadius(e.members.length);
      e.shadow.position.set(e.cx, 0.02, e.cz);
      e.shadow.scale.setScalar(er * 1.15);
    }
  }

  private snapCamera(): void {
    this.computeCamera(this.camPos, this.camLook);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  private computeCamera(pos: Vector3, look: Vector3): void {
    const aspect = this.camera.aspect;
    const f = Math.max(0.95, Math.min(1.3, 0.58 / aspect));
    if (this.state === 'boss' || this.state === 'won' || (this.state === 'lost' && this.crowd.mode === 'ring') ||
        (this.state === 'paused' && this.pausedFrom === 'boss') || (this.state === 'result' && this.crowd.mode === 'ring')) {
      const bz = this.boss ? this.boss.group.position.z : 0;
      pos.set(0, 12 * f, bz + 15 * f);
      look.set(0, 1.2, bz - 1);
      return;
    }
    if (this.state === 'menu') {
      const sway = Math.sin(this.t * 0.35) * 1.2;
      pos.set(sway, 6.2 * f, this.crowd.z + 9.5 * f);
      look.set(0, 0.6, this.crowd.z - 5);
      return;
    }
    const r = Math.min(this.crowd.radius(), 5);
    const cx = this.crowd.x * 0.45;
    pos.set(cx, (7 + r * 0.95) * f, this.crowd.z + (9 + r * 1.15) * f);
    look.set(cx, 0.5, this.crowd.z - 6.5);
  }

  private updateCamera(dt: number): void {
    const pos = v3.set(0, 0, 0);
    const look = new Vector3();
    this.computeCamera(pos, look);
    const k = 1 - Math.exp(-dt * (this.state === 'run' ? 8 : 3));
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

  private updateLabels(): void {
    const showCrowd = this.state === 'run' || this.state === 'boss' || this.state === 'menu' || this.state === 'paused';
    if (showCrowd && this.crowd.count > 0) {
      const ring = this.crowd.mode === 'ring';
      const bz = this.boss ? this.boss.group.position.z : 0;
      const p = ring
        ? this.project(0, 0.3, bz + this.crowd.ringInner + 3.2)
        : this.project(this.crowd.x, 1.9 + Math.min(1.5, this.crowd.radius() * 0.25), this.crowd.z);
      this.ui.setCrowdLabel(Math.round(this.crowd.count), p.x, p.y, p.vis);
    } else {
      this.ui.setCrowdLabel(0, 0, 0, false);
    }
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      const p = this.project(e.cx, 2.1, e.cz);
      const show = p.vis && this.state !== 'menu' && Math.abs(e.cz - this.crowd.z) < 70;
      this.ui.setLabel(e.label, Math.ceil(e.count - 1e-6), p.x, p.y, show);
    }
    if (this.boss && this.state === 'boss') {
      const p = this.project(0, this.boss.scale * 1.45 + 0.6, this.boss.group.position.z);
      this.ui.placeBossBar(p.x, p.y);
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

  /** DPS ปัจจุบันต่อบอส (ใช้แสดงผล) */
  get dps(): number {
    return this.bossDps;
  }
}
