import * as THREE from 'three';
import type { LegAngles, LegGeometry } from '../kinematics/leg';

/**
 * 3D-Bein als verschachtelte Gruppen – genau wie die echte Mechanik:
 * Dreht sich ein Gelenk, bewegt sich alles dahinter automatisch mit.
 *
 *   root → coxaJoint (dreht um Z) → femurJoint (dreht um Y) → tibiaJoint (dreht um Y) → Fuß
 */
export class LegView {
  readonly root = new THREE.Group();
  private readonly coxaJoint = new THREE.Group();
  private readonly femurJoint = new THREE.Group();
  private readonly tibiaJoint = new THREE.Group();

  constructor(geo: LegGeometry) {
    const coxaMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const femurMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const tibiaMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

    // Coxa
    this.root.add(this.coxaJoint);
    this.coxaJoint.add(link(geo.coxaLength, 18, coxaMat));
    this.coxaJoint.add(jointMarker(jointMat, 'z'));

    // Femur sitzt am Ende der Coxa
    this.femurJoint.position.x = geo.coxaLength;
    this.coxaJoint.add(this.femurJoint);
    this.femurJoint.add(link(geo.femurLength, 14, femurMat));
    this.femurJoint.add(jointMarker(jointMat, 'y'));

    // Tibia sitzt am Ende des Femurs
    this.tibiaJoint.position.x = geo.femurLength;
    this.femurJoint.add(this.tibiaJoint);
    this.tibiaJoint.add(link(geo.tibiaLength, 10, tibiaMat));
    this.tibiaJoint.add(jointMarker(jointMat, 'y'));

    // Fußspitze
    const foot = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), tibiaMat);
    foot.position.x = geo.tibiaLength;
    this.tibiaJoint.add(foot);
  }

  setAngles(a: LegAngles): void {
    this.coxaJoint.rotation.z = a.coxa;
    // Drehung um +Y würde X nach unten (−Z) drehen – wir wollen "positiv = nach oben", daher Minus
    this.femurJoint.rotation.y = -a.femur;
    this.tibiaJoint.rotation.y = -a.tibia;
  }
}

/** Quader von 0 bis length entlang X. */
function link(length: number, thickness: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, thickness), material);
  mesh.position.x = length / 2;
  return mesh;
}

/** Kleiner Zylinder, der die Drehachse eines Gelenks zeigt. */
function jointMarker(material: THREE.Material, axis: 'y' | 'z'): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 24, 24), material);
  // CylinderGeometry steht entlang Y; für eine Z-Achse um X kippen
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  return mesh;
}