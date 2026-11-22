// ภาพทหาร 3D แบบนิ่ง (render ครั้งเดียวเป็นรูป PNG) ใช้ในหน้าสวมใส่อุปกรณ์
import { AmbientLight, DirectionalLight, Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { PLAYER_COLOR } from '../eras.ts';
import { unitGeometry, unitMaterial } from './units.ts';

const cache = new Map<number, string>();

export function troopPortrait(era: number): string {
  const hit = cache.get(era);
  if (hit) return hit;
  let url = '';
  try {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const r = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setClearColor(0x000000, 0);
    const scene = new Scene();
    scene.add(new AmbientLight(0xffffff, 1.4));
    const d = new DirectionalLight(0xffffff, 2.2);
    d.position.set(2, 4, 3);
    scene.add(d);
    const cam = new PerspectiveCamera(30, 1, 0.1, 20);
    cam.position.set(0, 0.95, 2.45);
    cam.lookAt(0, 0.68, 0);
    const mat = unitMaterial({ value: 0 });
    const m = new Mesh(unitGeometry(era, PLAYER_COLOR), mat);
    // ด้านหน้าโมเดลหันไปทาง -Z → หมุนให้หันหน้าเข้ากล้อง เอียงเล็กน้อย
    m.rotation.y = Math.PI + 0.35;
    scene.add(m);
    r.render(scene, cam);
    url = canvas.toDataURL('image/png');
    mat.dispose();
    r.dispose();
    r.forceContextLoss();
  } catch {
    url = '';
  }
  cache.set(era, url);
  return url;
}
