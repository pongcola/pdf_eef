import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
} from 'three';
import { TRACK_WIDTH } from '../config.ts';
import type { ObstacleSection } from '../game/level.ts';

const RED = new MeshLambertMaterial({ color: 0xe23b3b });
const STEEL = new MeshLambertMaterial({ color: 0xc9ced6 });
const DARK = new MeshLambertMaterial({ color: 0x33363d });
const WOOD = new MeshLambertMaterial({ color: 0x8a5a2b });
const YELLOW = new MeshLambertMaterial({ color: 0xffc928 });

export interface Obstacle {
  readonly group: Group;
  readonly z: number;
  update(t: number, dt: number): void;
  /** ตัวละครที่ตำแหน่ง (x, z) โดนหรือไม่ */
  hits(x: number, z: number): boolean;
}

class Saw implements Obstacle {
  readonly group = new Group();
  readonly z: number;
  private blade = new Group();
  private x = 0;
  private readonly sec: ObstacleSection;

  constructor(sec: ObstacleSection) {
    this.sec = sec;
    this.z = -sec.d;
    this.group.position.z = this.z;
    const groove = new Mesh(new BoxGeometry(TRACK_WIDTH - 0.4, 0.04, 0.4), DARK);
    groove.position.y = 0.02;
    this.group.add(groove);
    const disc = new Mesh(new CylinderGeometry(0.95, 0.95, 0.12, 24), STEEL);
    disc.rotation.x = Math.PI / 2;
    this.blade.add(disc);
    const hub = new Mesh(new CylinderGeometry(0.3, 0.3, 0.16, 12), RED);
    hub.rotation.x = Math.PI / 2;
    this.blade.add(hub);
    const toothGeo = new ConeGeometry(0.12, 0.3, 4);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const tooth = new Mesh(toothGeo, STEEL);
      tooth.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0);
      tooth.rotation.z = a - Math.PI / 2;
      this.blade.add(tooth);
    }
    this.blade.position.y = 0.8;
    this.group.add(this.blade);
  }

  update(t: number, dt: number): void {
    this.x = Math.sin(t * this.sec.speed + this.sec.phase) * (TRACK_WIDTH / 2 - 1.2);
    this.blade.position.x = this.x;
    this.blade.rotation.z -= dt * 14;
  }

  hits(x: number, z: number): boolean {
    return Math.abs(x - this.x) < 1.0 && Math.abs(z - this.z) < 0.32;
  }
}

class Wall implements Obstacle {
  readonly group = new Group();
  readonly z: number;
  private readonly x: number;
  private readonly half: number;

  constructor(sec: ObstacleSection) {
    this.z = -sec.d;
    this.x = sec.param;
    this.half = sec.width / 2;
    this.group.position.set(this.x, 0, this.z);
    const block = new Mesh(new BoxGeometry(sec.width, 1.1, 0.7), WOOD);
    block.position.y = 0.55;
    this.group.add(block);
    const stripe = new Mesh(new BoxGeometry(sec.width + 0.02, 0.22, 0.72), YELLOW);
    stripe.position.y = 0.95;
    this.group.add(stripe);
    const spikeGeo = new ConeGeometry(0.13, 0.5, 6);
    const n = Math.max(3, Math.round(sec.width / 0.42));
    for (let i = 0; i < n; i++) {
      for (const y of [0.3, 0.7]) {
        const s = new Mesh(spikeGeo, STEEL);
        s.rotation.x = Math.PI / 2;
        s.position.set(-sec.width / 2 + 0.21 + (i * (sec.width - 0.42)) / (n - 1), y, 0.55);
        this.group.add(s);
      }
    }
  }

  update(): void {}

  hits(x: number, z: number): boolean {
    return Math.abs(x - this.x) < this.half + 0.12 && Math.abs(z - this.z) < 0.5;
  }
}

class Hammer implements Obstacle {
  readonly group = new Group();
  readonly z: number;
  private arm = new Group();
  private hx = 0;
  private hy = 0;
  private readonly sec: ObstacleSection;
  private static readonly TOP = 4.4;
  private static readonly LEN = 3.6;

  constructor(sec: ObstacleSection) {
    this.sec = sec;
    this.z = -sec.d;
    this.group.position.z = this.z;
    const postGeo = new BoxGeometry(0.4, Hammer.TOP + 0.3, 0.4);
    for (const x of [-TRACK_WIDTH / 2 - 0.3, TRACK_WIDTH / 2 + 0.3]) {
      const p = new Mesh(postGeo, RED);
      p.position.set(x, (Hammer.TOP + 0.3) / 2, 0);
      this.group.add(p);
    }
    const beam = new Mesh(new BoxGeometry(TRACK_WIDTH + 1.2, 0.4, 0.4), RED);
    beam.position.y = Hammer.TOP + 0.1;
    this.group.add(beam);
    const rod = new Mesh(new BoxGeometry(0.14, Hammer.LEN, 0.14), DARK);
    rod.position.y = -Hammer.LEN / 2;
    this.arm.add(rod);
    const head = new Mesh(new CylinderGeometry(0.6, 0.6, 1.3, 14), STEEL);
    head.rotation.x = Math.PI / 2;
    head.position.y = -Hammer.LEN;
    this.arm.add(head);
    for (const zz of [-0.66, 0.66]) {
      const cap = new Mesh(new CylinderGeometry(0.62, 0.62, 0.12, 14), RED);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(0, -Hammer.LEN, zz);
      this.arm.add(cap);
    }
    this.arm.position.y = Hammer.TOP;
    this.group.add(this.arm);
  }

  update(t: number): void {
    const a = Math.sin(t * this.sec.speed * 1.4 + this.sec.phase) * 1.05;
    this.arm.rotation.z = a;
    this.hx = Math.sin(a) * Hammer.LEN;
    this.hy = Hammer.TOP - Math.cos(a) * Hammer.LEN;
  }

  hits(x: number, z: number): boolean {
    return this.hy < 1.6 && Math.abs(x - this.hx) < 0.75 && Math.abs(z - this.z) < 0.8;
  }
}

class Spinner implements Obstacle {
  readonly group = new Group();
  readonly z: number;
  private bar = new Group();
  private angle = 0;
  private static readonly HALF = 4.3;
  private readonly sec: ObstacleSection;

  constructor(sec: ObstacleSection) {
    this.sec = sec;
    this.z = -sec.d;
    this.group.position.z = this.z;
    const post = new Mesh(new CylinderGeometry(0.35, 0.45, 1.2, 12), DARK);
    post.position.y = 0.6;
    this.group.add(post);
    const b = new Mesh(new BoxGeometry(Spinner.HALF * 2, 0.3, 0.3), RED);
    this.bar.add(b);
    const stripeGeo = new BoxGeometry(0.5, 0.32, 0.32);
    for (let i = -3; i <= 3; i += 2) {
      const s = new Mesh(stripeGeo, YELLOW);
      s.position.x = i * 1.1;
      this.bar.add(s);
    }
    this.bar.position.y = 0.6;
    this.group.add(this.bar);
  }

  update(t: number): void {
    this.angle = t * this.sec.speed * this.sec.param + this.sec.phase;
    this.bar.rotation.y = this.angle;
  }

  hits(x: number, z: number): boolean {
    const dx = x;
    const dz = z - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.55) return true;
    if (dist > Spinner.HALF + 0.2) return false;
    // ระยะจากจุดถึงเส้นคาน (คานหมุนรอบแกน y)
    const cx = Math.cos(this.angle);
    const cz = -Math.sin(this.angle);
    const along = dx * cx + dz * cz;
    const perp = Math.abs(-dx * cz + dz * cx);
    return Math.abs(along) <= Spinner.HALF && perp < 0.3;
  }
}

export function createObstacle(sec: ObstacleSection): Obstacle {
  switch (sec.kind) {
    case 'saw':
      return new Saw(sec);
    case 'wall':
      return new Wall(sec);
    case 'hammer':
      return new Hammer(sec);
    case 'spinner':
      return new Spinner(sec);
  }
}
