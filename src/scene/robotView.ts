import * as THREE from 'three';
import type { LegAngles } from '../kinematics/leg';
import type { BodyPose, RobotConfig } from '../kinematics/robot';
import { LegView } from './legView';

/**
 * 3D-Roboter: ein Körper, an dem sechs LegViews hängen.
 * Bewegt sich der Körper, bewegen sich die Beinansätze automatisch mit.
 */
export class RobotView {
  readonly root = new THREE.Group(); // = Körper-Koordinatensystem
  private readonly legs: LegView[] = [];

  constructor(cfg: RobotConfig) {
    // Körperplatte aus dem Umriss in robot.json
    const shape = new THREE.Shape(cfg.body.outline.map((p) => new THREE.Vector2(p.x, p.y)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: cfg.body.thickness, bevelEnabled: false });
    geometry.translate(0, 0, -cfg.body.thickness / 2); // mittig um die Gelenkebene
    const body = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.1, roughness: 0.7 }),
    );
    this.root.add(body);

    // Pfeil nach vorne
    this.root.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, cfg.body.thickness / 2 + 2),
        90,
        0xef4444,
        20,
        12,
      ),
    );

    // Sechs Beine an ihren Ansätzen, jeweils in ihre Grundrichtung gedreht
    for (const mount of cfg.mounts) {
      const leg = new LegView(cfg.leg);
      leg.root.position.set(mount.position.x, mount.position.y, mount.position.z);
      leg.root.rotation.z = mount.angle;
      this.root.add(leg.root);
      this.legs.push(leg);
    }
  }

  setPose(pose: BodyPose): void {
    this.root.position.set(pose.x, pose.y, pose.z);
    // 'ZYX' = erst Gier, dann Nick, dann Roll – dieselbe Reihenfolge wie rotate() in robot.ts
    this.root.rotation.set(pose.roll, pose.pitch, pose.yaw, 'ZYX');
  }

  setLegAngles(index: number, angles: LegAngles): void {
    this.legs[index].setAngles(angles);
  }
}