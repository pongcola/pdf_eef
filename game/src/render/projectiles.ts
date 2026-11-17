import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ERAS } from '../eras.ts';
import { part } from './units.ts';

interface Shot {
  x: number;
  y: number;
  z: number;
  vx: number;
  travelled: number;
  range: number;
  dmg: number;
  big: boolean;
  alive: boolean;
  spin: number;
}

/** อาวุธที่ขว้าง/ยิงออกไป เปลี่ยนตามยุค (หันไปทาง -Z) */
function projectileGeometry(era: number): { geo: BufferGeometry; tumble: boolean } {
  const E = ERAS[era];
  const m = (parts: BufferGeometry[]) => mergeGeometries(parts, false)!;
  switch (E.decor) {
    case 'stone':
      return { geo: m([part(new DodecahedronGeometry(0.13, 0), 0x8d8a85, 0, 0, 0)]), tumble: true };
    case 'ancient':
      return {
        geo: m([
          part(new CylinderGeometry(0.025, 0.025, 0.75, 5), E.weapon, 0, 0, 0.05, { rx: Math.PI / 2 }),
          part(new ConeGeometry(0.06, 0.18, 5), E.metal, 0, 0, -0.4, { rx: -Math.PI / 2 }),
        ]),
        tumble: false,
      };
    case 'medieval':
      return {
        geo: m([
          part(new BoxGeometry(0.05, 0.05, 0.42), E.weapon, 0, 0, 0.06),
          part(new BoxGeometry(0.04, 0.24, 0.16), E.metal, 0, 0.08, -0.14),
        ]),
        tumble: true,
      };
    case 'gunpowder':
      return { geo: m([part(new SphereGeometry(0.08, 8, 6), 0x2a2a2a, 0, 0, 0)]), tumble: false };
    case 'modern':
      return {
        geo: m([
          part(new CylinderGeometry(0.045, 0.045, 0.22, 6), 0xd9a83a, 0, 0, 0.04, { rx: Math.PI / 2 }),
          part(new ConeGeometry(0.045, 0.1, 6), 0xc27a2c, 0, 0, -0.12, { rx: -Math.PI / 2 }),
        ]),
        tumble: false,
      };
    case 'future':
      return { geo: m([part(new BoxGeometry(0.07, 0.07, 0.7), 0x6ff7ff, 0, 0, 0)]), tumble: false };
  }
}

const tmp = new Object3D();

export class Projectiles {
  readonly mesh: InstancedMesh;
  private shots: Shot[] = [];
  private readonly cap: number;
  private tumble: boolean;
  private free: number[] = [];

  constructor(era: number, cap = 700) {
    this.cap = cap;
    const { geo, tumble } = projectileGeometry(era);
    this.tumble = tumble;
    this.mesh = new InstancedMesh(geo, new MeshLambertMaterial({ vertexColors: true }), cap);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    for (let i = 0; i < cap; i++) {
      this.shots.push({ x: 0, y: 0, z: 0, vx: 0, travelled: 0, range: 0, dmg: 0, big: false, alive: false, spin: 0 });
      this.free.push(cap - 1 - i);
    }
  }

  fire(x: number, y: number, z: number, dmg: number, range: number, big: boolean): void {
    const i = this.free.pop();
    if (i === undefined) return;
    const s = this.shots[i];
    s.x = x;
    s.y = y;
    s.z = z;
    s.vx = (Math.random() - 0.5) * 0.6;
    s.travelled = 0;
    s.range = range;
    s.dmg = dmg;
    s.big = big;
    s.alive = true;
    s.spin = Math.random() * 6;
  }

  /**
   * ขยับกระสุน; hit(x, z0, z1, dmg) คืนค่า true ถ้าโดนเป้า (กระสุนหายไป)
   */
  update(dt: number, speed: number, hit: (x: number, z0: number, z1: number, dmg: number) => boolean): void {
    let n = 0;
    const step = speed * dt;
    for (let i = 0; i < this.cap; i++) {
      const s = this.shots[i];
      if (!s.alive) continue;
      const z0 = s.z;
      s.z -= step;
      s.x += s.vx * dt;
      s.travelled += step;
      s.spin += dt * 18;
      if (hit(s.x, z0, s.z, s.dmg) || s.travelled >= s.range) {
        s.alive = false;
        this.free.push(i);
        continue;
      }
      // ตกลงเล็กน้อยตอนใกล้สุดระยะ
      const k = s.travelled / s.range;
      tmp.position.set(s.x, s.y - k * k * 0.5, s.z);
      tmp.rotation.set(this.tumble ? -s.spin : 0, 0, 0);
      tmp.scale.setScalar(s.big ? 1.45 : 1);
      tmp.updateMatrix();
      this.mesh.setMatrixAt(n++, tmp.matrix);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear(): void {
    this.free = [];
    for (let i = 0; i < this.cap; i++) {
      this.shots[i].alive = false;
      this.free.push(this.cap - 1 - i);
    }
    this.mesh.count = 0;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshLambertMaterial).dispose();
  }
}
