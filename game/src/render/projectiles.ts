import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
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
export function projectileGeometry(era: number): { geo: BufferGeometry; tumble: boolean } {
  const E = ERAS[era];
  const m = (parts: BufferGeometry[]) => mergeGeometries(parts, false)!;
  switch (E.decor) {
    case 'stone': // หินกลมมน
      return { geo: m([part(new SphereGeometry(0.12, 10, 8), 0x9a958c, 0, 0, 0, { sy: 0.9 }), part(new SphereGeometry(0.06, 8, 6), 0xd8c7a8, -0.04, 0.05, -0.05)]), tumble: true };
    case 'ancient': // หอกซัดปลายทอง + พู่
      return {
        geo: m([
          part(new CylinderGeometry(0.025, 0.025, 0.6, 5), 0xc9945a, 0, 0, 0.08, { rx: Math.PI / 2 }),
          part(new ConeGeometry(0.06, 0.18, 6), 0xf2c94c, 0, 0, -0.3, { rx: -Math.PI / 2 }),
          part(new SphereGeometry(0.035, 6, 4), 0xff9e7d, 0.03, -0.03, -0.18),
        ]),
        tumble: false,
      };
    case 'medieval': // ขวานสองคมหมุน
      return {
        geo: m([
          part(new CylinderGeometry(0.03, 0.03, 0.42, 6), 0xc9945a, 0, 0, 0.06, { rx: Math.PI / 2 }),
          part(new BoxGeometry(0.035, 0.26, 0.14), 0xc9d1dc, 0, 0, -0.12),
          ...[-1, 1].map((e) => part(new CylinderGeometry(0.09, 0.09, 0.035, 10, 1, false, 0, Math.PI), 0xe2e8ef, 0, e * 0.13, -0.12, { rz: Math.PI / 2, ry: e > 0 ? 0 : Math.PI })),
        ]),
        tumble: true,
      };
    case 'gunpowder':
      // ลูกตะกั่ว + ควันกลมๆ ตามหลัง (ของเดิมดำล้วนมองไม่ค่อยเห็น)
      return {
        geo: m([
          part(new SphereGeometry(0.1, 10, 8), 0x3a3f48, 0, 0, 0),
          part(new SphereGeometry(0.035, 6, 4), 0xc9d1dc, -0.03, 0.04, -0.07),
          part(new SphereGeometry(0.09, 8, 6), 0xfff3dc, 0.02, 0.02, 0.18),
          part(new SphereGeometry(0.07, 8, 6), 0xf3e6cc, -0.03, 0.0, 0.3),
          part(new SphereGeometry(0.05, 8, 6), 0xeadcc0, 0.01, 0.02, 0.4),
        ]),
        tumble: false,
      };
    case 'modern': // กระสุนทองเหลือง + เปลวสั้นๆ
      return {
        geo: m([
          part(new CylinderGeometry(0.05, 0.05, 0.18, 8), 0xe8b04a, 0, 0, 0.03, { rx: Math.PI / 2 }),
          part(new SphereGeometry(0.05, 8, 6), 0xc98a4a, 0, 0, -0.06, { sz: 1.4 }),
          part(new ConeGeometry(0.045, 0.16, 6), 0xff9e7d, 0, 0, 0.2, { rx: Math.PI / 2 }),
        ]),
        tumble: false,
      };
    case 'future': // ลำแสงฟ้าหัวกลม
      return {
        geo: m([
          part(new SphereGeometry(0.07, 10, 8), 0xc9fbff, 0, 0, -0.18),
          part(new CylinderGeometry(0.045, 0.02, 0.5, 8), 0x6ff7ff, 0, 0, 0.1, { rx: Math.PI / 2 }),
        ]),
        tumble: false,
      };
  }
}

const throwCache = new Map<number, BufferGeometry>();
/** อาวุธที่ศัตรูชุดดำปาใส่ฝูง เปลี่ยนตามยุค */
export function enemyThrowGeometry(era: number): BufferGeometry {
  const c = throwCache.get(era);
  if (c) return c;
  const m = (parts: BufferGeometry[]) => mergeGeometries(parts, false)!;
  let g: BufferGeometry;
  switch (ERAS[era].decor) {
    case 'stone': // กระดูก
      g = m([
        part(new CylinderGeometry(0.05, 0.05, 0.5, 6), 0xf2ead8, 0, 0, 0, { rx: Math.PI / 2 }),
        ...[-1, 1].flatMap((e) => [-1, 1].map((sx) => part(new SphereGeometry(0.075, 8, 6), 0xf7f0e0, sx * 0.05, 0, e * 0.26))),
      ]);
      break;
    case 'ancient': // โถดินเผา
      g = m([
        part(new SphereGeometry(0.17, 10, 8), 0xc8704e, 0, 0, 0, { sy: 0.9 }),
        part(new CylinderGeometry(0.07, 0.09, 0.1, 10), 0xb5603f, 0, 0.17, 0),
        part(new CylinderGeometry(0.175, 0.175, 0.04, 12), 0xf2c94c, 0, 0.02, 0),
      ]);
      break;
    case 'medieval': // ลูกตุ้มหนาม (หนามมน)
      g = m([
        part(new SphereGeometry(0.14, 10, 8), 0x8c9096, 0, 0, 0),
        ...[[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(([x, y, z]) =>
          part(new SphereGeometry(0.05, 6, 4), 0xb9bec4, x * 0.15, y * 0.15, z * 0.15)),
        part(new CylinderGeometry(0.03, 0.03, 0.22, 6), 0x6b4220, 0, -0.24, 0),
      ]);
      break;
    case 'gunpowder': // ระเบิดลูกกลมไส้ชนวน
      g = m([
        part(new SphereGeometry(0.16, 12, 10), 0x2b2b38, 0, 0, 0),
        part(new CylinderGeometry(0.05, 0.05, 0.06, 8), 0x55555f, 0, 0.17, 0),
        part(new CylinderGeometry(0.015, 0.015, 0.1, 5), 0xc9a46b, 0.02, 0.24, 0, { rz: -0.4 }),
        part(new SphereGeometry(0.045, 6, 4), 0xffa62b, 0.05, 0.3, 0),
      ]);
      break;
    case 'modern': // ระเบิดมือ
      g = m([
        part(new SphereGeometry(0.13, 10, 8), 0x55663f, 0, 0, 0, { sy: 1.25 }),
        ...[-0.06, 0.02, 0.1].map((y) => part(new CylinderGeometry(0.135, 0.135, 0.02, 10), 0x3f4d2e, 0, y - 0.02, 0)),
        part(new CylinderGeometry(0.05, 0.05, 0.06, 8), 0x9aa1ad, 0, 0.18, 0),
        part(new BoxGeometry(0.03, 0.18, 0.05), 0x9aa1ad, 0.07, 0.1, 0, { rz: -0.25 }),
      ]);
      break;
    case 'future': // ลูกพลาสมาสีแดง
    default:
      g = m([
        part(new SphereGeometry(0.16, 12, 10), 0xff3b5c, 0, 0, 0),
        part(new SphereGeometry(0.09, 10, 8), 0xffd1dc, 0.03, 0.04, -0.06),
      ]);
      break;
  }
  throwCache.set(era, g);
  return g;
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
