import {
  CanvasTexture,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Texture,
} from 'three';

let shadowTex: Texture | null = null;

function getShadowTexture(): Texture {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.42)');
  grd.addColorStop(0.7, 'rgba(0,0,0,0.22)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  shadowTex = new CanvasTexture(c);
  shadowTex.colorSpace = SRGBColorSpace;
  return shadowTex;
}

/** เงาวงกลมนุ่มๆ ใต้ฝูง/บอส (ถูกกว่าเงาจริงมาก) */
export function makeBlobShadow(): Mesh {
  const m = new Mesh(
    new CircleGeometry(1, 24),
    new MeshBasicMaterial({ map: getShadowTexture(), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}
