import {
  type Material,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RingGeometry,
} from 'three';
import { ENEMY_COLOR } from '../eras.ts';
import { makeBlobShadow } from './common.ts';
import { unitGeometry, unitMaterial } from './units.ts';

/** บอสยักษ์ท้ายด่าน */
export class Boss {
  readonly group = new Group();
  readonly body: Mesh;
  readonly scale: number;
  readonly radius: number;
  private readonly run = { value: 0 };
  private readonly wave: Mesh;
  private readonly waveMat: MeshBasicMaterial;
  private readonly shadow: Mesh;
  private jumpT = -1;
  private waveT = -1;
  private hurtT = 0;
  private deadT = -1;
  private readonly baseMat: Material;

  constructor(era: number, z: number, eraBoss: boolean) {
    this.scale = eraBoss ? 5.2 : 4.2;
    this.radius = 0.42 * this.scale;
    const geo = unitGeometry(era, ENEMY_COLOR).clone();
    geo.setAttribute('aPhase', new Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count), 1));
    this.baseMat = unitMaterial(this.run, 7);
    this.body = new Mesh(geo, this.baseMat);
    this.body.scale.setScalar(this.scale);
    this.body.rotation.y = Math.PI;
    this.group.add(this.body);

    if (eraBoss) {
      const gold = new MeshLambertMaterial({ color: 0xffcf33 });
      const crown = new Group();
      const band = new Mesh(new CylinderGeometry(0.2, 0.2, 0.1, 10, 1, true), gold);
      crown.add(band);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new Mesh(new ConeGeometry(0.05, 0.14, 4), gold);
        spike.position.set(Math.cos(a) * 0.18, 0.11, Math.sin(a) * 0.18);
        crown.add(spike);
      }
      crown.position.y = 1.27;
      this.body.add(crown);
    }

    this.shadow = makeBlobShadow();
    this.shadow.scale.setScalar(this.radius * 1.6);
    this.group.add(this.shadow);

    this.waveMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    this.wave = new Mesh(new RingGeometry(0.85, 1, 48), this.waveMat);
    this.wave.rotation.x = -Math.PI / 2;
    this.wave.position.y = 0.05;
    this.group.add(this.wave);

    this.group.position.set(0, 0, z);
  }

  get isJumping(): boolean {
    return this.jumpT >= 0;
  }

  /** เริ่มกระโดดกระแทก; คืนค่า true ตอนลงถึงพื้น (ผ่าน update) */
  stomp(): void {
    if (this.jumpT < 0 && this.deadT < 0) this.jumpT = 0;
  }

  hurt(): void {
    this.hurtT = 0.12;
  }

  die(): void {
    if (this.deadT < 0) this.deadT = 0;
  }

  /** คืนค่า true ในเฟรมที่บอสกระแทกพื้น */
  update(dt: number, t: number): boolean {
    let landed = false;
    if (this.deadT >= 0) {
      this.deadT += dt;
      const k = Math.min(1, this.deadT / 1.0);
      this.body.rotation.x = -k * (Math.PI / 2);
      this.body.position.y = -k * 0.6;
      this.shadow.scale.setScalar(this.radius * 1.6 * (1 - k * 0.4));
      return false;
    }
    if (this.jumpT >= 0) {
      this.jumpT += dt;
      const dur = 0.42;
      const k = this.jumpT / dur;
      if (k >= 1) {
        this.jumpT = -1;
        this.body.position.y = 0;
        this.waveT = 0;
        landed = true;
      } else {
        this.body.position.y = Math.sin(k * Math.PI) * 1.8;
      }
    } else {
      this.body.position.y = Math.abs(Math.sin(t * 3)) * 0.12;
    }
    if (this.waveT >= 0) {
      this.waveT += dt;
      const k = this.waveT / 0.55;
      if (k >= 1) {
        this.waveT = -1;
        this.waveMat.opacity = 0;
      } else {
        this.wave.scale.setScalar(this.radius + k * 7);
        this.waveMat.opacity = 0.75 * (1 - k);
      }
    }
    if (this.hurtT > 0) this.hurtT -= dt;
    const squash = this.hurtT > 0 ? 0.94 : 1;
    this.body.scale.set(this.scale * (2 - squash), this.scale * squash, this.scale * (2 - squash));
    return landed;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.body.geometry.dispose();
    this.baseMat.dispose();
    this.waveMat.dispose();
    this.wave.geometry.dispose();
    this.shadow.geometry.dispose();
    (this.shadow.material as MeshBasicMaterial).dispose();
  }
}
