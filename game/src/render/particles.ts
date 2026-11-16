import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
} from 'three';

interface P {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; max: number; size: number; spin: number;
}

const tmp = new Object3D();
const tmpColor = new Color();

/** อนุภาคกล่องเล็กๆ (ตอนตัวละครตาย, พลุฉลองชัยชนะ) */
export class Particles {
  readonly mesh: InstancedMesh;
  private ps: P[] = [];
  private readonly cap: number;
  private next = 0;

  constructor(cap = 600) {
    this.cap = cap;
    this.mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), cap);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    for (let i = 0; i < cap; i++) {
      this.ps.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0, spin: 0 });
      this.mesh.setColorAt(i, tmpColor.set(0xffffff));
    }
  }

  burst(x: number, y: number, z: number, color: number, count: number, speed = 4, size = 0.14, life = 0.7): void {
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.cap;
      const p = this.ps[i];
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      p.x = x; p.y = y; p.z = z;
      p.vx = Math.cos(a) * s;
      p.vz = Math.sin(a) * s;
      p.vy = speed * (0.8 + Math.random() * 0.9);
      p.max = p.life = life * (0.7 + Math.random() * 0.6);
      p.size = size * (0.7 + Math.random() * 0.6);
      p.spin = Math.random() * 10;
      this.mesh.setColorAt(i, tmpColor.set(color));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  confetti(x: number, y: number, z: number, count: number): void {
    const colors = [0xff4f6d, 0xffd23f, 0x3ddc97, 0x3fa7ff, 0xb46bff, 0xffffff];
    for (let k = 0; k < count; k++) {
      this.burst(x + (Math.random() - 0.5) * 6, y, z + (Math.random() - 0.5) * 6, colors[k % colors.length], 1, 7, 0.18, 1.6);
    }
  }

  update(dt: number): void {
    let n = 0;
    for (let i = 0; i < this.cap; i++) {
      const p = this.ps[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy -= 16 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.05) {
        p.y = 0.05;
        p.vy *= -0.3;
        p.vx *= 0.7;
        p.vz *= 0.7;
      }
      const s = p.size * Math.min(1, (p.life / p.max) * 2);
      tmp.position.set(p.x, p.y, p.z);
      tmp.rotation.set(p.spin * p.life, p.spin * 0.7 * p.life, 0);
      tmp.scale.setScalar(Math.max(0.0001, s));
      tmp.updateMatrix();
      this.mesh.setMatrixAt(i, tmp.matrix);
      n = i + 1;
    }
    // วาดเฉพาะช่วงที่มีอนุภาคมีชีวิต (ที่ตายแล้วถูกย่อเหลือ 0)
    for (let i = 0; i < n; i++) {
      if (this.ps[i].life <= 0) {
        tmp.scale.setScalar(0);
        tmp.updateMatrix();
        this.mesh.setMatrixAt(i, tmp.matrix);
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear(): void {
    for (const p of this.ps) p.life = 0;
    this.mesh.count = 0;
  }
}
