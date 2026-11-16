import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Fog,
  Group,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  OctahedronGeometry,
  PlaneGeometry,
  RepeatWrapping,
  type Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TRACK_WIDTH } from '../config.ts';
import type { EraDef } from '../eras.ts';
import { makeRng } from '../rng.ts';
import { hex } from './common.ts';
import { part } from './units.ts';

export const ARENA_RADIUS = 9;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(parts, false);
  if (!g) throw new Error('merge failed');
  return g;
}

interface DecorProto {
  geo: BufferGeometry;
  weight: number;
  scale: [number, number];
  /** ระยะห่างจากขอบถนนขั้นต่ำ */
  minOff: number;
  tint?: boolean;
}

const protoCache = new Map<string, DecorProto[]>();

function decorFor(era: EraDef): DecorProto[] {
  const cached = protoCache.get(era.decor);
  if (cached) return cached;
  const tree = () =>
    merge([
      part(new CylinderGeometry(0.18, 0.25, 1.4, 6), 0x7a5230, 0, 0.7, 0),
      part(new SphereGeometry(1.0, 7, 5), 0x3f9b3a, 0, 2.0, 0),
      part(new SphereGeometry(0.7, 7, 5), 0x52b545, 0.45, 2.5, 0.2),
    ]);
  const pine = () =>
    merge([
      part(new CylinderGeometry(0.15, 0.22, 1.0, 6), 0x6b4a2b, 0, 0.5, 0),
      part(new ConeGeometry(1.0, 1.8, 7), 0x2f7d3a, 0, 1.7, 0),
      part(new ConeGeometry(0.75, 1.4, 7), 0x3a9447, 0, 2.6, 0),
    ]);
  const rock = () => merge([part(new DodecahedronGeometry(0.9, 0), 0x9a958c, 0, 0.5, 0, { sy: 0.7 })]);
  let list: DecorProto[] = [];
  switch (era.decor) {
    case 'stone':
      list = [
        { geo: tree(), weight: 3, scale: [0.9, 1.6], minOff: 1.5 },
        { geo: pine(), weight: 2, scale: [1.0, 1.8], minOff: 1.5 },
        { geo: rock(), weight: 3, scale: [0.6, 2.2], minOff: 1.0 },
        {
          geo: merge([
            part(new ConeGeometry(1.4, 2.4, 7), 0xa8743f, 0, 1.2, 0),
            part(new BoxGeometry(0.5, 0.8, 0.1), 0x3b2614, 0, 0.4, 1.12),
          ]),
          weight: 1, scale: [0.9, 1.2], minOff: 3,
        },
      ];
      break;
    case 'ancient':
      list = [
        {
          geo: merge([
            part(new CylinderGeometry(0.12, 0.2, 3.0, 6), 0x9c6b3f, 0, 1.5, 0, { rz: 0.12 }),
            ...[0, 1, 2, 3, 4].map((i) =>
              part(new BoxGeometry(1.6, 0.06, 0.4), 0x46a33d, Math.cos((i * Math.PI * 2) / 5) * 0.7 + 0.18, 2.95, Math.sin((i * Math.PI * 2) / 5) * 0.7, { ry: (-i * Math.PI * 2) / 5, rz: -0.35 }),
            ),
          ]),
          weight: 3, scale: [0.9, 1.4], minOff: 1.2,
        },
        {
          geo: merge([
            part(new BoxGeometry(0.9, 0.25, 0.9), 0xf3ead2, 0, 0.12, 0),
            part(new CylinderGeometry(0.32, 0.36, 3.0, 10), 0xf3ead2, 0, 1.7, 0),
            part(new BoxGeometry(0.9, 0.25, 0.9), 0xf3ead2, 0, 3.3, 0),
          ]),
          weight: 2, scale: [0.9, 1.3], minOff: 1.0,
        },
        { geo: merge([part(new ConeGeometry(4, 4, 4), 0xe2bf6e, 0, 2, 0, { ry: Math.PI / 4 })]), weight: 1, scale: [1.2, 2.4], minOff: 8 },
        { geo: rock(), weight: 1, scale: [0.5, 1.2], minOff: 1.0 },
      ];
      break;
    case 'medieval':
      list = [
        { geo: pine(), weight: 3, scale: [1.0, 1.8], minOff: 1.2 },
        { geo: tree(), weight: 2, scale: [0.9, 1.4], minOff: 1.2 },
        {
          geo: merge([
            part(new CylinderGeometry(1.0, 1.1, 4.0, 10), 0xb7b2a8, 0, 2.0, 0),
            part(new ConeGeometry(1.3, 1.8, 10), 0xc8463d, 0, 4.9, 0),
            part(new BoxGeometry(0.3, 0.5, 0.1), 0x2a2420, 0, 2.8, 1.03),
          ]),
          weight: 1, scale: [1.0, 1.5], minOff: 4,
        },
      ];
      break;
    case 'gunpowder':
      list = [
        {
          geo: merge([
            part(new BoxGeometry(2.2, 1.6, 1.8), 0xf1e6d0, 0, 0.8, 0),
            part(new ConeGeometry(1.75, 1.2, 4), 0xa8432f, 0, 2.2, 0, { ry: Math.PI / 4, sz: 0.85 }),
            part(new BoxGeometry(0.45, 0.8, 0.05), 0x6b4220, 0, 0.4, 0.92),
            part(new BoxGeometry(0.4, 0.4, 0.05), 0x7fb6d9, 0.65, 1.0, 0.92),
            part(new BoxGeometry(0.4, 0.4, 0.05), 0x7fb6d9, -0.65, 1.0, 0.92),
          ]),
          weight: 2, scale: [0.9, 1.3], minOff: 3,
        },
        { geo: tree(), weight: 3, scale: [0.9, 1.5], minOff: 1.2 },
        {
          geo: merge([
            part(new CylinderGeometry(0.2, 0.26, 1.3, 8), 0x2f3237, 0, 0.55, -0.2, { rx: 1.25 }),
            part(new CylinderGeometry(0.4, 0.4, 0.12, 10), 0x6b4220, 0.35, 0.4, 0, { rz: Math.PI / 2 }),
            part(new CylinderGeometry(0.4, 0.4, 0.12, 10), 0x6b4220, -0.35, 0.4, 0, { rz: Math.PI / 2 }),
          ]),
          weight: 1, scale: [1.0, 1.2], minOff: 1.0,
        },
      ];
      break;
    case 'modern':
      list = [
        {
          geo: merge([
            part(new BoxGeometry(3, 8, 3), 0xc9d3dd, 0, 4, 0),
            ...[1.5, 3, 4.5, 6, 7.2].map((y) => part(new BoxGeometry(3.05, 0.5, 3.05), 0x6f8fb3, 0, y, 0)),
          ]),
          weight: 3, scale: [0.8, 1.6], minOff: 4, tint: true,
        },
        {
          geo: merge([
            part(new CylinderGeometry(0.07, 0.09, 3.2, 6), 0x3a3f46, 0, 1.6, 0),
            part(new BoxGeometry(0.9, 0.12, 0.25), 0x3a3f46, -0.35, 3.2, 0),
            part(new BoxGeometry(0.35, 0.1, 0.22), 0xfff3b0, -0.65, 3.12, 0),
          ]),
          weight: 2, scale: [1, 1], minOff: 0.6,
        },
        { geo: tree(), weight: 1, scale: [0.8, 1.2], minOff: 1.2 },
      ];
      break;
    case 'future':
      list = [
        {
          geo: merge([
            part(new BoxGeometry(2.4, 9, 2.4), 0x2b2160, 0, 4.5, 0),
            part(new BoxGeometry(2.5, 0.25, 2.5), 0x38f2ff, 0, 3, 0),
            part(new BoxGeometry(2.5, 0.25, 2.5), 0xff4fd8, 0, 6, 0),
            part(new BoxGeometry(2.5, 0.3, 2.5), 0x38f2ff, 0, 9, 0),
          ]),
          weight: 3, scale: [0.8, 1.7], minOff: 4, tint: true,
        },
        { geo: merge([part(new OctahedronGeometry(0.9, 0), 0x38f2ff, 0, 1.6, 0, { sy: 1.6 })]), weight: 2, scale: [0.6, 1.3], minOff: 1.2 },
        { geo: merge([part(new TorusGeometry(1.2, 0.12, 6, 18), 0xff4fd8, 0, 2.4, 0)]), weight: 1, scale: [0.8, 1.4], minOff: 2 },
      ];
      break;
  }
  protoCache.set(era.decor, list);
  return list;
}

function stripedTexture(a: number, b: number, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = hex(a);
  g.fillRect(0, 0, w, h);
  g.fillStyle = hex(b);
  draw(g);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** ฉาก: ถนน ขอบถนน พื้น ลานบอส และของตกแต่งตามยุค */
export class World {
  readonly group = new Group();
  private disposables: { dispose(): void }[] = [];

  constructor(scene: Scene, era: EraDef, bossD: number, seed: number) {
    scene.background = new Color(era.sky);
    scene.fog = new Fog(era.fog, 38, 120);

    const start = -25;
    const end = bossD - ARENA_RADIUS + 1;
    const len = end - start;

    // ถนน
    const trackTex = stripedTexture(era.track, era.trackLine, 128, 128, (g) => {
      if (era.decor === 'modern') {
        g.fillRect(60, 10, 8, 50);
        g.fillRect(4, 0, 6, 128);
        g.fillRect(118, 0, 6, 128);
      } else if (era.decor === 'future') {
        g.fillRect(0, 0, 128, 4);
        g.fillRect(0, 0, 4, 128);
        g.fillRect(62, 0, 4, 128);
      } else {
        g.fillRect(0, 0, 64, 64);
        g.fillRect(64, 64, 64, 64);
      }
    });
    trackTex.repeat.set(2, len / 5);
    const trackMat = new MeshLambertMaterial({ map: trackTex });
    const track = new Mesh(new BoxGeometry(TRACK_WIDTH, 1, len), trackMat);
    track.position.set(0, -0.5, -(start + end) / 2);
    this.group.add(track);
    this.disposables.push(trackTex, trackMat, track.geometry);

    // ขอบถนน
    const railTex = stripedTexture(era.rail, era.railAlt, 16, 64, (g) => g.fillRect(0, 0, 16, 32));
    railTex.repeat.set(1, len / 2);
    const railMat = new MeshLambertMaterial({ map: railTex });
    const railGeo = new BoxGeometry(0.45, 0.5, len);
    for (const s of [-1, 1]) {
      const r = new Mesh(railGeo, railMat);
      r.position.set(s * (TRACK_WIDTH / 2 + 0.22), 0.0, -(start + end) / 2);
      this.group.add(r);
    }
    this.disposables.push(railTex, railMat, railGeo);

    // พื้นรอบๆ
    const groundMat = new MeshLambertMaterial({ color: era.ground });
    const ground = new Mesh(new PlaneGeometry(400, len + 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -1.2, -(start + end) / 2);
    this.group.add(ground);
    this.disposables.push(groundMat, ground.geometry);

    // ลานบอส
    const arenaMat = new MeshLambertMaterial({ color: era.track });
    const arena = new Mesh(new CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 0.3, 1, 40), arenaMat);
    arena.position.set(0, -0.5, -bossD);
    this.group.add(arena);
    const ringMat = new MeshLambertMaterial({ color: era.rail });
    const ring = new Mesh(new TorusGeometry(ARENA_RADIUS, 0.22, 6, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.02, -bossD);
    this.group.add(ring);
    this.disposables.push(arenaMat, arena.geometry, ringMat, ring.geometry);

    // เส้นเริ่ม
    const startTex = stripedTexture(0xffffff, 0x222222, 64, 16, (g) => {
      for (let x = 0; x < 64; x += 16) {
        g.fillRect(x, 0, 8, 8);
        g.fillRect(x + 8, 8, 8, 8);
      }
    });
    startTex.repeat.set(4, 1);
    const startMat = new MeshLambertMaterial({ map: startTex });
    const startLine = new Mesh(new PlaneGeometry(TRACK_WIDTH, 1.2), startMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.01, -6);
    this.group.add(startLine);
    this.disposables.push(startTex, startMat, startLine.geometry);

    // ของตกแต่งสองข้างทาง
    const rng = makeRng(seed);
    const protos = decorFor(era);
    const totalW = protos.reduce((a, p) => a + p.weight, 0);
    const span = bossD + 80;
    const count = Math.round(span * 0.9);
    const buckets: { x: number; z: number; ry: number; s: number; tint: number }[][] = protos.map(() => []);
    for (let i = 0; i < count; i++) {
      let r = rng() * totalW;
      let k = 0;
      while (r > protos[k].weight) {
        r -= protos[k].weight;
        k++;
      }
      const p = protos[k];
      const side = rng() < 0.5 ? -1 : 1;
      const off = TRACK_WIDTH / 2 + p.minOff + rng() * 22;
      const d = -30 + rng() * span;
      // ไม่วางทับลานบอส
      if (Math.hypot(side * off, d - bossD) < ARENA_RADIUS + 3) continue;
      buckets[k].push({
        x: side * off,
        z: -d,
        ry: rng() * Math.PI * 2,
        s: p.scale[0] + rng() * (p.scale[1] - p.scale[0]),
        tint: 0.75 + rng() * 0.35,
      });
    }
    const o = new Object3D();
    const col = new Color();
    protos.forEach((p, k) => {
      const items = buckets[k];
      if (!items.length) return;
      const mat = new MeshLambertMaterial({ vertexColors: true });
      const im = new InstancedMesh(p.geo, mat, items.length);
      items.forEach((it, i) => {
        o.position.set(it.x, -0.05, it.z);
        o.rotation.set(0, it.ry, 0);
        o.scale.setScalar(it.s);
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
        if (p.tint) im.setColorAt(i, col.setScalar(it.tint));
      });
      im.computeBoundingSphere();
      this.group.add(im);
      this.disposables.push(mat);
    });

    scene.add(this.group);
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
