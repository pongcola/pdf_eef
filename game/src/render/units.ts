import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ERAS } from '../eras.ts';

/** uniform เวลา ใช้ร่วมกันทุก material ของตัวละคร */
export const sharedTime = { value: 0 };

export function part(
  geo: BufferGeometry,
  color: number,
  x: number,
  y: number,
  z: number,
  opts: { swing?: number; pivot?: number; rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number } = {},
): BufferGeometry {
  if (opts.sx || opts.sy || opts.sz) geo.scale(opts.sx ?? 1, opts.sy ?? 1, opts.sz ?? 1);
  if (opts.rx) geo.rotateX(opts.rx);
  if (opts.ry) geo.rotateY(opts.ry);
  if (opts.rz) geo.rotateZ(opts.rz);
  geo.translate(x, y, z);
  if (geo.getAttribute('uv')) geo.deleteAttribute('uv');
  const n = geo.getAttribute('position').count;
  const c = new Color(color);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geo.setAttribute('aSwing', new Float32BufferAttribute(new Float32Array(n).fill(opts.swing ?? 0), 1));
  geo.setAttribute('aPivot', new Float32BufferAttribute(new Float32Array(n).fill(opts.pivot ?? 0), 1));
  return geo.index ? geo.toNonIndexed() : geo;
}

const geoCache = new Map<string, BufferGeometry>();

/**
 * สร้างโมเดลตัวละคร (low-poly) ของแต่ละยุค ด้านหน้าหันไปทาง -Z
 * สูงประมาณ 1.15 หน่วย
 */
export function unitGeometry(era: number, team: number): BufferGeometry {
  const key = `${era}:${team}`;
  const cached = geoCache.get(key);
  if (cached) return cached;
  const E = ERAS[era];
  const parts: BufferGeometry[] = [];
  const dark = 0x2a2420;

  // ขา (แกว่งตอนวิ่ง)
  parts.push(part(new BoxGeometry(0.13, 0.4, 0.14), E.legs, -0.09, 0.2, 0, { swing: 1, pivot: 0.4 }));
  parts.push(part(new BoxGeometry(0.13, 0.4, 0.14), E.legs, 0.09, 0.2, 0, { swing: -1, pivot: 0.4 }));
  // ลำตัว (สีทีม)
  parts.push(part(new BoxGeometry(0.38, 0.42, 0.24), team, 0, 0.61, 0));
  parts.push(part(new BoxGeometry(0.39, 0.06, 0.25), dark, 0, 0.43, 0));
  // แขน: ซ้ายแกว่ง ขวาถืออาวุธ
  parts.push(part(new BoxGeometry(0.1, 0.36, 0.12), team, -0.25, 0.62, 0, { swing: -0.8, pivot: 0.78 }));
  parts.push(part(new BoxGeometry(0.1, 0.36, 0.12), team, 0.25, 0.64, -0.06, { rx: -0.5 }));
  // หัว
  parts.push(part(new SphereGeometry(0.17, 10, 8), E.skin, 0, 0.99, 0));

  switch (E.decor) {
    case 'stone': {
      parts.push(part(new SphereGeometry(0.185, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), E.hat, 0, 1.0, 0.02));
      parts.push(part(new BoxGeometry(0.42, 0.12, 0.27), 0x8b5a2b, 0, 0.78, 0, { rz: 0.25 }));
      // กระบอง
      parts.push(part(new CylinderGeometry(0.05, 0.09, 0.62, 6), E.weapon, 0.3, 0.72, -0.3, { rx: -1.0 }));
      break;
    }
    case 'ancient': {
      parts.push(part(new SphereGeometry(0.19, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), E.metal, 0, 1.0, 0));
      parts.push(part(new BoxGeometry(0.05, 0.12, 0.34), team, 0, 1.2, 0.02));
      // หอก
      parts.push(part(new CylinderGeometry(0.025, 0.025, 1.4, 5), E.weapon, 0.3, 0.95, -0.12));
      parts.push(part(new ConeGeometry(0.06, 0.18, 5), E.metal, 0.3, 1.72, -0.12));
      // โล่กลม
      parts.push(part(new CylinderGeometry(0.24, 0.24, 0.05, 12), E.metal, -0.33, 0.66, -0.06, { rz: Math.PI / 2 }));
      parts.push(part(new CylinderGeometry(0.1, 0.1, 0.06, 10), team, -0.36, 0.66, -0.06, { rz: Math.PI / 2 }));
      break;
    }
    case 'medieval': {
      parts.push(part(new CylinderGeometry(0.19, 0.19, 0.26, 10), E.metal, 0, 1.03, 0));
      parts.push(part(new BoxGeometry(0.3, 0.04, 0.05), dark, 0, 1.02, -0.18));
      // ดาบ
      parts.push(part(new BoxGeometry(0.06, 0.62, 0.03), E.metal, 0.3, 0.92, -0.3, { rx: -0.5 }));
      parts.push(part(new BoxGeometry(0.2, 0.04, 0.05), 0xc9a227, 0.3, 0.62, -0.17, { rx: -0.5 }));
      // โล่
      parts.push(part(new BoxGeometry(0.06, 0.42, 0.3), team, -0.33, 0.62, -0.04));
      parts.push(part(new BoxGeometry(0.07, 0.3, 0.06), 0xffffff, -0.34, 0.64, -0.04));
      parts.push(part(new BoxGeometry(0.07, 0.06, 0.2), 0xffffff, -0.34, 0.7, -0.04));
      break;
    }
    case 'gunpowder': {
      parts.push(part(new CylinderGeometry(0.26, 0.26, 0.05, 3), E.hat, 0, 1.12, 0, { ry: Math.PI }));
      parts.push(part(new CylinderGeometry(0.13, 0.16, 0.12, 8), E.hat, 0, 1.19, 0));
      parts.push(part(new BoxGeometry(0.05, 0.44, 0.255), 0xffffff, 0, 0.62, 0, { rz: 0.6 }));
      // ปืนคาบศิลา
      parts.push(part(new BoxGeometry(0.06, 0.08, 0.95), E.weapon, 0.28, 0.75, -0.25, { rx: 0.35 }));
      parts.push(part(new CylinderGeometry(0.025, 0.025, 0.5, 5), E.metal, 0.28, 0.86, -0.6, { rx: Math.PI / 2 + 0.35 }));
      break;
    }
    case 'modern': {
      parts.push(part(new SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), E.hat, 0, 1.0, 0));
      parts.push(part(new BoxGeometry(0.42, 0.04, 0.42), E.hat, 0, 1.0, 0));
      parts.push(part(new BoxGeometry(0.3, 0.34, 0.14), 0x3c4a2e, 0, 0.66, 0.18));
      // ปืนไรเฟิล
      parts.push(part(new BoxGeometry(0.07, 0.11, 0.62), E.weapon, 0.22, 0.74, -0.3));
      parts.push(part(new BoxGeometry(0.05, 0.16, 0.06), E.weapon, 0.22, 0.64, -0.24));
      break;
    }
    case 'future': {
      parts.push(part(new SphereGeometry(0.205, 12, 8), E.hat, 0, 1.0, 0));
      parts.push(part(new BoxGeometry(0.3, 0.1, 0.08), E.metal, 0, 1.0, -0.17));
      parts.push(part(new BoxGeometry(0.16, 0.1, 0.3), E.hat, -0.27, 0.84, 0));
      parts.push(part(new BoxGeometry(0.16, 0.1, 0.3), E.hat, 0.27, 0.84, 0));
      // ปืนเลเซอร์
      parts.push(part(new BoxGeometry(0.1, 0.12, 0.5), E.weapon, 0.24, 0.74, -0.28));
      parts.push(part(new CylinderGeometry(0.04, 0.04, 0.12, 6), E.metal, 0.24, 0.76, -0.58, { rx: Math.PI / 2 }));
      break;
    }
  }

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('merge failed');
  merged.computeBoundingSphere();
  geoCache.set(key, merged);
  return merged;
}

/** material ของตัวละครที่ขยับขา-แขนใน shader (ไม่ต้องมีโครงกระดูก) */
export function unitMaterial(run: { value: number }, speed = 13): MeshLambertMaterial {
  const m = new MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedTime;
    shader.uniforms.uRun = run;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aSwing;
attribute float aPivot;
attribute float aPhase;
uniform float uTime;
uniform float uRun;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
if (aSwing != 0.0) {
  float ang = sin(uTime * ${speed.toFixed(1)} + aPhase) * 0.75 * aSwing * uRun;
  float c = cos(ang);
  float s = sin(ang);
  float py = transformed.y - aPivot;
  float pz = transformed.z;
  transformed.y = aPivot + py * c - pz * s;
  transformed.z = py * s + pz * c;
}`,
      );
  };
  m.customProgramCacheKey = () => `unit-${speed}`;
  return m;
}

const tmpObj = new Object3D();
const hidden = new Matrix4().makeScale(0, 0, 0);

/** กลุ่มตัวละครแบบ InstancedMesh (วาดหลายร้อยตัวในครั้งเดียว) */
export class UnitSwarm {
  readonly mesh: InstancedMesh;
  readonly run = { value: 1 };
  readonly capacity: number;
  private used = 0;

  constructor(era: number, team: number, capacity: number) {
    this.capacity = capacity;
    const geo = unitGeometry(era, team).clone();
    const phases = new Float32Array(capacity);
    for (let i = 0; i < capacity; i++) phases[i] = Math.random() * Math.PI * 2;
    geo.setAttribute('aPhase', new InstancedBufferAttribute(phases, 1));
    this.mesh = new InstancedMesh(geo, unitMaterial(this.run), capacity);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < capacity; i++) this.mesh.setMatrixAt(i, hidden);
    this.mesh.count = 0;
  }

  begin(): void {
    this.used = 0;
  }

  push(x: number, y: number, z: number, rotY: number, scale: number): void {
    if (this.used >= this.capacity) return;
    tmpObj.position.set(x, y, z);
    tmpObj.rotation.set(0, rotY, 0);
    tmpObj.scale.setScalar(scale);
    tmpObj.updateMatrix();
    this.mesh.setMatrixAt(this.used++, tmpObj.matrix);
  }

  end(): void {
    this.mesh.count = this.used;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshLambertMaterial).dispose();
    this.mesh.removeFromParent();
  }
}
