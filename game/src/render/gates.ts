import {
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { TRACK_WIDTH } from '../config.ts';
import { gateLabel, isGoodGate, type GateOp } from '../game/level.ts';

const PANEL_W = TRACK_WIDTH / 2 - 0.3;
const PANEL_H = 2.4;
const postGeo = new BoxGeometry(0.28, PANEL_H + 0.5, 0.28);
const panelGeo = new PlaneGeometry(PANEL_W, PANEL_H);

function panelTexture(op: GateOp): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 176;
  const g = c.getContext('2d')!;
  const good = isGoodGate(op);
  const r = 22;
  g.beginPath();
  g.roundRect(6, 6, c.width - 12, c.height - 12, r);
  const grd = g.createLinearGradient(0, 0, 0, c.height);
  if (good) {
    grd.addColorStop(0, 'rgba(90,190,255,0.85)');
    grd.addColorStop(1, 'rgba(30,110,255,0.75)');
  } else {
    grd.addColorStop(0, 'rgba(255,120,110,0.85)');
    grd.addColorStop(1, 'rgba(225,40,50,0.75)');
  }
  g.fillStyle = grd;
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.stroke();
  g.font = '800 104px Kanit, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 12;
  g.strokeStyle = good ? 'rgba(10,50,140,0.9)' : 'rgba(120,10,20,0.9)';
  const label = gateLabel(op);
  g.strokeText(label, c.width / 2, c.height / 2 + 6);
  g.fillStyle = '#ffffff';
  g.fillText(label, c.width / 2, c.height / 2 + 6);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class GatePair {
  readonly group = new Group();
  private panels: Mesh[] = [];
  private mats: MeshBasicMaterial[] = [];
  private chosen = -1;
  private fade = 0;
  passed = false;

  constructor(z: number, left: GateOp, right: GateOp) {
    this.group.position.z = z;
    const ops = [left, right];
    const postMat = new MeshLambertMaterial({ color: 0xffffff });
    for (let i = 0; i < 2; i++) {
      const mat = new MeshBasicMaterial({
        map: panelTexture(ops[i]),
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
      });
      const m = new Mesh(panelGeo, mat);
      m.position.set(i === 0 ? -PANEL_W / 2 - 0.15 : PANEL_W / 2 + 0.15, PANEL_H / 2 + 0.25, 0);
      m.renderOrder = 2;
      this.group.add(m);
      this.panels.push(m);
      this.mats.push(mat);
    }
    for (const x of [-TRACK_WIDTH / 2 + 0.05, 0, TRACK_WIDTH / 2 - 0.05]) {
      const p = new Mesh(postGeo, postMat);
      p.position.set(x, (PANEL_H + 0.5) / 2, 0);
      this.group.add(p);
    }
  }

  /** side: 0 = ซ้าย, 1 = ขวา */
  pass(side: number): void {
    this.passed = true;
    this.chosen = side;
    this.fade = 1;
  }

  update(dt: number): void {
    if (!this.passed || this.fade <= 0) return;
    this.fade = Math.max(0, this.fade - dt * 2.2);
    for (let i = 0; i < 2; i++) {
      this.mats[i].opacity = this.fade;
      if (i === this.chosen) this.panels[i].scale.setScalar(1 + (1 - this.fade) * 0.35);
    }
    if (this.fade === 0) this.group.visible = false;
  }

  dispose(): void {
    for (const m of this.mats) {
      m.map?.dispose();
      m.dispose();
    }
  }
}
