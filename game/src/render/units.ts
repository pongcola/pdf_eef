import {
  BoxGeometry,
  CapsuleGeometry,
  DataTexture,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,

  Object3D,
  SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ENEMY_SQUAD_COLOR, ERAS, RAINBOW_TEAM } from '../eras.ts';

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
  const add = (g: BufferGeometry, c: number, x: number, y: number, z: number, o: Parameters<typeof part>[5] = {}) => parts.push(part(g, c, x, y, z, o));
  // ศัตรูชุดดำ: ใช้สีมืด + จุดสีแดงตามรูป enemy_N
  const rival = team === ENEMY_SQUAD_COLOR;
  const RED = 0xe8433f;
  const DARK = 0x3a3a46;
  const ink = 0x2a1a14;
  const skin = 0xf6cfa8;
  const H = 0.93; // กลางหัว
  const HR = 0.225; // รัศมีหัว (หัวโตแบบ chibi)

  // ---------- ขา + เท้า (แกว่งตอนวิ่ง) ----------
  const legCol: Record<string, number> = {
    stone: skin, ancient: skin, medieval: rival ? DARK : 0xa8d8b0, gunpowder: rival ? 0x2b2b38 : 0xf2f2ee, modern: rival ? 0x2b2b38 : 0x6b5a45, future: rival ? 0x2b2b38 : 0xf5e6d3,
  };
  const footCol: Record<string, number> = {
    stone: 0x7a4a2b, ancient: 0x7a4a2b, medieval: rival ? 0x55555f : 0xf2a07a, gunpowder: 0x3a2a20, modern: 0x4a3a2a, future: rival ? 0x2b2b38 : 0xf5e6d3,
  };
  for (const [sx, sw] of [[-0.085, 1], [0.085, -1]] as const) {
    add(new CapsuleGeometry(0.07, 0.12, 4, 8), legCol[E.decor], sx, 0.2, 0, { swing: sw, pivot: 0.34 });
    add(new SphereGeometry(0.085, 8, 6), footCol[E.decor], sx, 0.07, -0.02, { sy: 0.65, sz: 1.3, swing: sw, pivot: 0.34 });
    if (E.decor === 'stone' || E.decor === 'ancient') add(new CylinderGeometry(0.076, 0.076, 0.05, 8), 0x7a4a2b, sx, 0.13, 0, { swing: sw, pivot: 0.34 });
    if (E.decor === 'future') add(new CylinderGeometry(0.075, 0.075, 0.025, 8), rival ? RED : 0x38f2ff, sx, 0.22, 0, { swing: sw, pivot: 0.34 });
  }
  // ---------- ลำตัว (สีทีม) + แขน ----------
  add(new CapsuleGeometry(0.17, 0.12, 4, 12), team, 0, 0.47, 0, { sz: 0.8 });
  add(new CapsuleGeometry(0.055, 0.17, 4, 8), team, -0.22, 0.5, 0, { rz: 0.35, swing: -0.8, pivot: 0.6 });
  add(new SphereGeometry(0.058, 8, 6), skin, -0.27, 0.38, 0, { swing: -0.8, pivot: 0.6 });
  add(new CapsuleGeometry(0.055, 0.17, 4, 8), team, 0.22, 0.52, -0.07, { rx: -0.9, rz: -0.2 });
  const HX = 0.25, HY = 0.47, HZ = -0.2; // มือขวา (ถืออาวุธ)
  add(new SphereGeometry(0.058, 8, 6), skin, HX, HY, HZ);

  // ---------- หัว + หน้า (หันไปทาง -Z) ----------
  const faceZ = -HR * 0.93;
  if (E.decor !== 'future') add(new SphereGeometry(HR, 16, 12), skin, 0, H, 0);
  const eyeY = H - 0.01;
  for (const sx of [-0.075, 0.075]) {
    add(new SphereGeometry(0.03, 8, 6), ink, sx, eyeY, faceZ - (E.decor === 'future' ? 0.08 : 0), { sy: 1.25, sz: 0.6 });
    add(new SphereGeometry(0.035, 8, 6), 0xf59aa0, sx * 1.45, eyeY - 0.055, faceZ * 0.92 - (E.decor === 'future' ? 0.08 : 0), { sz: 0.35 });
    // ศัตรู: คิ้วขมวด
    if (rival) add(new BoxGeometry(0.06, 0.014, 0.02), ink, sx, eyeY + 0.055, faceZ - 0.01 - (E.decor === 'future' ? 0.08 : 0), { rz: sx > 0 ? 0.45 : -0.45 });
  }
  add(new BoxGeometry(0.05, 0.014, 0.02), ink, 0, eyeY - 0.07, faceZ - (E.decor === 'future' ? 0.08 : 0));

  switch (E.decor) {
    case 'stone': {
      // ผมฟู + จุก
      const hair = 0x7a4a2b;
      add(new SphereGeometry(HR * 1.08, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, H + 0.01, 0.015);
      for (const [x, y, z] of [[-0.17, -0.05, 0.08], [0.17, -0.05, 0.08], [0, -0.04, 0.17], [-0.12, 0.08, -0.15], [0.12, 0.08, -0.15], [0, 0.11, -0.17]] as const)
        add(new SphereGeometry(0.08, 8, 6), hair, x, H + y, z);
      add(new SphereGeometry(0.075, 8, 6), hair, 0.03, H + HR + 0.05, 0.06);
      add(new CylinderGeometry(0.04, 0.04, 0.025, 8), 0xc9a46b, 0.03, H + HR + 0.0, 0.06);
      // ชุดหนังเสือดาวเฉียงไหล่ (ศัตรู: ผ้าคาดแดง)
      const pelt = rival ? RED : 0xf2b24a;
      add(new CylinderGeometry(0.182, 0.2, 0.2, 12), rival ? team : pelt, 0, 0.36, 0, { sz: 0.82 });
      add(new BoxGeometry(0.09, 0.42, 0.3), pelt, 0.02, 0.5, 0, { rz: 0.75 });
      for (const [x, y, z] of [[-0.1, 0.34, -0.15], [0.08, 0.38, -0.15], [0, 0.31, -0.16], [0.12, 0.3, -0.12], [-0.05, 0.55, -0.12], [0.1, 0.48, -0.13]] as const)
        add(new SphereGeometry(0.022, 6, 4), 0x5a3a20, x, y, z, { sz: 0.4 });
      add(new CylinderGeometry(0.19, 0.19, 0.03, 12), 0xc9a46b, 0, 0.44, 0, { sz: 0.82 });
      if (rival) {
        // หน้ากากกะโหลกสีดำบนหัว + ถือกระดูก
        add(new SphereGeometry(0.07, 8, 6), 0x2b2b38, 0.13, H + 0.16, -0.08);
        for (const sx of [0.08, 0.18]) add(new ConeGeometry(0.02, 0.06, 5), 0x2b2b38, sx, H + 0.23, -0.08);
        add(new CylinderGeometry(0.035, 0.035, 0.42, 6), 0xf2ead8, HX, HY + 0.05, HZ - 0.02, { rx: -1.1 });
        for (const e of [-1, 1]) for (const sx of [-0.03, 0.03]) add(new SphereGeometry(0.05, 8, 6), 0xf7f0e0, HX + sx, HY + 0.05 - e * 0.09, HZ - 0.02 + e * 0.18);
      } else {
        // กระบองปุ่ม
        add(new CylinderGeometry(0.035, 0.035, 0.2, 6), 0x8a5a33, HX, HY + 0.05, HZ - 0.05, { rx: -1.0 });
        add(new CylinderGeometry(0.09, 0.05, 0.28, 8), 0x8a5a33, HX, HY + 0.13, HZ - 0.24, { rx: -1.0 });
        for (const [x, z] of [[0.07, -0.28], [-0.06, -0.26], [0, -0.34]] as const) add(new SphereGeometry(0.035, 6, 4), 0x7a4a2b, HX + x, HY + 0.16, HZ + z);
      }
      break;
    }
    case 'ancient': {
      // หมวกทองครอบหัว + แก้มปิด + หงอน
      const helm = rival ? DARK : 0xf2b632;
      const crest = rival ? RED : 0xff9e7d;
      add(new SphereGeometry(HR * 1.08, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), helm, 0, H + 0.005, 0.01);
      for (const sx of [-1, 1]) add(new BoxGeometry(0.05, 0.16, 0.12), helm, sx * 0.19, H - 0.08, -0.1);
      add(new BoxGeometry(0.04, 0.1, 0.04), helm, 0, H + 0.03, faceZ - 0.01);
      add(new BoxGeometry(0.05, 0.06, 0.05), helm, 0, H + HR + 0.03, 0);
      for (let i = 0; i < 5; i++) add(new SphereGeometry(0.06, 8, 6), crest, 0, H + HR + 0.08 + Math.sin(i * 0.7) * 0.03, -0.1 + i * 0.07, { sx: 0.6 });
      // กระโปรงหนังจีบ + หมุดทอง
      add(new CylinderGeometry(0.185, 0.215, 0.13, 10), 0x7a4a2b, 0, 0.34, 0, { sz: 0.85 });
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; add(new SphereGeometry(0.014, 5, 4), 0xf2c94c, Math.sin(t) * 0.2, 0.3, Math.cos(t) * 0.17); }
      // โล่กลม (แขนซ้าย)
      add(new CylinderGeometry(0.2, 0.2, 0.04, 14), rival ? DARK : 0xf2b632, -0.3, 0.45, -0.05, { rz: Math.PI / 2 });
      add(new CylinderGeometry(0.08, 0.08, 0.05, 5), rival ? 0x55555f : 0xffe28a, -0.33, 0.45, -0.05, { rz: Math.PI / 2 });
      if (rival) {
        // โถดินเผาในมือ
        add(new SphereGeometry(0.1, 10, 8), 0xc8704e, HX, HY + 0.1, HZ - 0.02);
        add(new CylinderGeometry(0.045, 0.055, 0.07, 8), 0xb5603f, HX, HY + 0.2, HZ - 0.02);
      } else {
        // หอกสั้น (ไม่สูงเกินตัว)
        add(new CylinderGeometry(0.02, 0.02, 0.8, 5), 0x8a5a33, HX, HY + 0.18, HZ);
        add(new ConeGeometry(0.045, 0.14, 5), 0xc9dcea, HX, HY + 0.65, HZ);
        add(new CylinderGeometry(0.025, 0.025, 0.03, 6), 0x8ce99a, HX, HY + 0.57, HZ);
      }
      break;
    }
    case 'medieval': {
      // หมวกโดม + แถบ + ช่องตา + ผ้าคลุมคอ (หน้ายังเห็น)
      const metal = rival ? 0x55555f : 0xb9c3cf;
      add(new SphereGeometry(HR * 1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), metal, 0, H + 0.01, 0);
      add(new CylinderGeometry(HR * 1.12, HR * 1.12, 0.07, 14), metal, 0, H + 0.04, 0);
      add(new BoxGeometry(0.22, 0.03, 0.03), 0x4a2e20, 0, H + 0.045, -HR * 1.1);
      add(new CylinderGeometry(HR * 1.06, HR * 1.0, 0.2, 14, 1, true, Math.PI * 1.32, Math.PI * 1.36), metal, 0, H - 0.08, 0);
      add(new SphereGeometry(0.03, 6, 4), metal, 0, H + HR + 0.02, 0);
      add(new SphereGeometry(0.06, 8, 6), rival ? RED : 0xff9e7d, 0.02, H + HR + 0.08, 0.02, { sx: 0.5, sy: 1.4 });
      // เสื้อเกราะโซ่ (ขอบ) + ผ้าคลุมสีทีม + เข็มขัดทอง
      add(new CylinderGeometry(0.19, 0.2, 0.12, 12), rival ? 0x55555f : 0xc7d3d0, 0, 0.33, 0, { sz: 0.82 });
      add(new CylinderGeometry(0.18, 0.18, 0.03, 12), rival ? 0x5a3a20 : 0xf2c94c, 0, 0.41, 0, { sz: 0.82 });
      // โล่หยดน้ำ (แขนซ้าย) + หัวใจ
      add(new BoxGeometry(0.05, 0.22, 0.24), rival ? DARK : 0xc9dcea, -0.31, 0.47, -0.04);
      add(new ConeGeometry(0.12, 0.16, 4), rival ? DARK : 0xc9dcea, -0.31, 0.29, -0.04, { rx: Math.PI, ry: Math.PI / 4, sx: 0.4 });
      if (!rival) for (const z of [-0.03, 0.03]) add(new SphereGeometry(0.04, 8, 6), 0xff8f8f, -0.34, 0.5, -0.04 + z);
      if (rival) {
        // ลูกตุ้มหนาม
        add(new CylinderGeometry(0.02, 0.02, 0.26, 5), 0x6b4220, HX, HY + 0.1, HZ - 0.03, { rx: -0.6 });
        add(new SphereGeometry(0.075, 8, 6), 0x55555f, HX, HY + 0.22, HZ - 0.12);
        for (const [x, y, z] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, -1]] as const) add(new ConeGeometry(0.025, 0.05, 5), 0x6b6b75, HX + x * 0.08, HY + 0.22 + y * 0.08, HZ - 0.12 + z * 0.08, { rz: -x * 1.57, rx: z * 1.57 });
      } else {
        // ดาบสั้น
        add(new BoxGeometry(0.05, 0.36, 0.02), 0xd7dde4, HX, HY + 0.24, HZ - 0.08, { rx: -0.35 });
        add(new BoxGeometry(0.15, 0.035, 0.04), 0xf2c94c, HX, HY + 0.06, HZ - 0.02, { rx: -0.35 });
      }
      break;
    }
    case 'gunpowder': {
      // หมวกสามเหลี่ยม + ขอบทอง (ศัตรู: ขอบแดง)
      const trim = rival ? RED : 0xf2c94c;
      add(new SphereGeometry(HR * 1.02, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), 0x7a4a2b, 0, H + 0.02, 0.02);
      add(new CylinderGeometry(0.3, 0.3, 0.05, 3), trim, 0, H + 0.11, 0, { ry: Math.PI / 2 });
      add(new CylinderGeometry(0.28, 0.28, 0.09, 3), 0x2b2b30, 0, H + 0.15, 0, { ry: Math.PI / 2 });
      add(new SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x2b2b30, 0, H + 0.17, 0);
      // สายคาดขาวไขว้ + กระดุมทอง
      for (const z of [-0.145, 0.145]) for (const r of [0.75, -0.75]) add(new BoxGeometry(0.045, 0.34, 0.02), 0xf7f7f2, 0, 0.48, z, { rz: r });
      for (const [x, y] of [[-0.05, 0.42], [0.05, 0.42], [-0.05, 0.36], [0.05, 0.36]] as const) add(new SphereGeometry(0.016, 6, 4), rival ? RED : 0xf2c94c, x, y, -0.15);
      add(new CylinderGeometry(0.18, 0.2, 0.08, 12), rival ? 0x2b2b38 : 0xf2f2ee, 0, 0.32, 0, { sz: 0.82 });
      if (rival) {
        // ระเบิดลูกกลมไส้ชนวน
        add(new SphereGeometry(0.1, 10, 8), 0x2b2b38, HX, HY + 0.12, HZ);
        add(new CylinderGeometry(0.012, 0.012, 0.07, 5), 0xc9a46b, HX + 0.02, HY + 0.24, HZ, { rz: -0.4 });
        add(new SphereGeometry(0.03, 6, 4), 0xffa62b, HX + 0.04, HY + 0.28, HZ);
      } else {
        // ปืนพกคาบศิลา
        add(new BoxGeometry(0.06, 0.1, 0.12), 0xb5753f, HX, HY + 0.02, HZ - 0.02, { rx: 0.3 });
        add(new CylinderGeometry(0.025, 0.03, 0.26, 8), 0x9aa1ad, HX, HY + 0.07, HZ - 0.2, { rx: Math.PI / 2 });
        add(new BoxGeometry(0.03, 0.04, 0.04), 0xf2c94c, HX, HY + 0.11, HZ - 0.08);
      }
      break;
    }
    case 'modern': {
      if (rival) {
        // หมวกไหมพรมดำ
        add(new SphereGeometry(HR * 1.06, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x2b2b38, 0, H + 0.02, 0);
        add(new CylinderGeometry(HR * 1.08, HR * 1.08, 0.07, 14), 0x3a3a46, 0, H + 0.04, 0);
      } else {
        // หมวกเหล็กเขียว + แว่นกันลม
        add(new SphereGeometry(HR * 1.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), 0x6b7a45, 0, H + 0.01, 0);
        add(new CylinderGeometry(HR * 1.2, HR * 1.22, 0.04, 14), 0x5f6b3d, 0, H + 0.0, 0);
        add(new CylinderGeometry(HR * 1.16, HR * 1.16, 0.04, 14), 0x2b2b30, 0, H + 0.09, 0);
        for (const sx of [-0.07, 0.07]) add(new SphereGeometry(0.055, 8, 6), 0x3a3f48, sx, H + 0.1, -HR * 1.1, { sz: 0.5 });
      }
      // เสื้อกั๊ก + กระเป๋า + เป้
      const vest = rival ? 0x2b2b38 : 0x8a8a55;
      add(new BoxGeometry(0.3, 0.24, 0.07), vest, 0, 0.47, -0.13);
      add(new BoxGeometry(0.3, 0.24, 0.05), vest, 0, 0.47, 0.13);
      for (const x of [-0.08, 0.08]) add(new BoxGeometry(0.08, 0.06, 0.03), rival ? 0x3a3a46 : 0x7a7a48, x, 0.4, -0.17);
      if (rival) add(new BoxGeometry(0.07, 0.04, 0.02), RED, 0, 0.52, -0.175);
      add(new BoxGeometry(0.26, 0.26, 0.12), rival ? 0x2b2b38 : 0x7d7a4a, 0, 0.5, 0.2);
      add(new CylinderGeometry(0.18, 0.2, 0.06, 12), rival ? 0x2b2b38 : 0x6b5a45, 0, 0.32, 0, { sz: 0.82 });
      if (rival) {
        // ระเบิดมือ
        add(new SphereGeometry(0.075, 10, 8), 0x3a3f48, HX, HY + 0.1, HZ, { sy: 1.2 });
        add(new BoxGeometry(0.03, 0.06, 0.03), 0x9aa1ad, HX, HY + 0.2, HZ);
      } else {
        // ไรเฟิลสีเขียว ถือสองมือ
        add(new BoxGeometry(0.07, 0.1, 0.4), 0x7d9a5a, HX - 0.04, HY + 0.04, HZ - 0.08);
        add(new BoxGeometry(0.06, 0.12, 0.06), 0xa58a5a, HX - 0.04, HY - 0.05, HZ - 0.02);
        add(new CylinderGeometry(0.025, 0.025, 0.14, 6), 0x9aa1ad, HX - 0.04, HY + 0.05, HZ - 0.34, { rx: Math.PI / 2 });
        add(new CylinderGeometry(0.025, 0.025, 0.08, 6), 0x9aa1ad, HX - 0.04, HY + 0.12, HZ - 0.08, { rx: Math.PI / 2 });
      }
      break;
    }
    case 'future':
    default: {
      // หมวกอวกาศกลมใหญ่ + กระบังหน้าใส (เห็นหน้า)
      const shell = rival ? 0x2b2b38 : 0xf5e6d3;
      const glow = rival ? RED : 0x38f2ff;
      add(new SphereGeometry(HR * 1.18, 16, 12), shell, 0, H, 0);
      // กระบังหน้ายื่นออกมาด้านหน้าหมวก (เห็นหน้ายิ้มด้านใน)
      add(new SphereGeometry(HR * 0.82, 14, 10), rival ? 0xf6c9b8 : 0xd9f7ea, 0, H - 0.01, -0.17, { sz: 0.6, sy: 0.85 });
      add(new CylinderGeometry(HR * 0.84, HR * 0.84, 0.03, 18, 1, true), glow, 0, H - 0.01, -0.18, { rx: Math.PI / 2, sz: 0.85 });
      for (const sx of [-1, 1]) add(new CylinderGeometry(0.07, 0.07, 0.05, 10), shell, sx * HR * 1.17, H, 0, { rz: Math.PI / 2 });
      // เกราะไหล่ทรงเม็ดยา + เส้นนีออน
      for (const sx of [-1, 1]) add(new SphereGeometry(0.08, 10, 8), shell, sx * 0.2, 0.6, 0, { sy: 0.6 });
      add(new CylinderGeometry(0.18, 0.2, 0.08, 12), rival ? 0x2b2b38 : 0xf5e6d3, 0, 0.32, 0, { sz: 0.82 });
      add(new CylinderGeometry(0.182, 0.182, 0.02, 12), glow, 0, 0.37, 0, { sz: 0.82 });
      add(new BoxGeometry(0.22, 0.22, 0.1), shell, 0, 0.5, 0.17);
      if (rival) {
        // ลูกพลาสมาแดง
        add(new SphereGeometry(0.09, 10, 8), 0xff3b5c, HX, HY + 0.12, HZ);
      } else {
        // ปืนเลเซอร์ทรงของเล่น
        add(new CapsuleGeometry(0.05, 0.16, 4, 8), 0xf5e6d3, HX, HY + 0.06, HZ - 0.1, { rx: Math.PI / 2 });
        add(new BoxGeometry(0.05, 0.1, 0.05), 0xf5e6d3, HX, HY - 0.01, HZ - 0.02);
        add(new CylinderGeometry(0.045, 0.045, 0.04, 10), 0x38f2ff, HX, HY + 0.06, HZ - 0.24, { rx: Math.PI / 2 });
      }
      break;
    }
  }

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('merge failed');
  // ทหาร Lv.10: ส่วนที่เป็นสีทีม (เสื้อ แขน) เปลี่ยนสีรุ้งใน shader
  const rb = new Float32Array(merged.getAttribute('position').count);
  if (team === RAINBOW_TEAM) {
    const col = merged.getAttribute('color');
    const tc = new Color(team);
    for (let i = 0; i < rb.length; i++) {
      if (Math.abs(col.getX(i) - tc.r) + Math.abs(col.getY(i) - tc.g) + Math.abs(col.getZ(i) - tc.b) < 0.01) rb[i] = 1;
    }
  }
  merged.setAttribute('aRainbow', new Float32BufferAttribute(rb, 1));
  merged.computeBoundingSphere();
  geoCache.set(key, merged);
  return merged;
}

let ramp: DataTexture | null = null;
/** ไล่แสงแบบการ์ตูน 3 ระดับ */
function toonRamp(): DataTexture {
  if (ramp) return ramp;
  ramp = new DataTexture(new Uint8Array([150, 210, 255]), 3, 1, RedFormat);
  ramp.minFilter = ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

/** material ของตัวละครที่ขยับขา-แขนใน shader (ไม่ต้องมีโครงกระดูก) */
export function unitMaterial(run: { value: number }, speed = 13): MeshToonMaterial {
  const m = new MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp() });
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
attribute float aRainbow;
uniform float uTime;
uniform float uRun;`,
      )
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
if (aRainbow > 0.5) {
  float hh = fract(uTime * 0.35 + position.y * 0.9);
  vColor.rgb = clamp(abs(mod(hh * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0) * 0.8 + 0.2;
}`,
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
    (this.mesh.material as MeshToonMaterial).dispose();
    this.mesh.removeFromParent();
  }
}
