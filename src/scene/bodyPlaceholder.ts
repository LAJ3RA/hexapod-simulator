import * as THREE from 'three';
import { degToRad } from '../kinematics/math';

/** Platzhalter-Körper, bis in Meilenstein 2 die echte Geometrie aus robot.json kommt. */
const BODY_RADIUS = 55; // mm
const BODY_THICKNESS = 25; // mm
const BODY_HEIGHT = 80; // mm über dem Boden (Mitte des Körpers)

export function createBodyPlaceholder(): THREE.Group {
  const group = new THREE.Group();
  group.position.z = BODY_HEIGHT;

  // Zylinder hat seine Achse entlang Y → um X drehen, damit sie nach oben (Z) zeigt
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_THICKNESS, 48),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.1, roughness: 0.6 }),
  );
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Sechs Beinansätze, vorerst gleichmäßig im 60°-Raster (beginnend bei 30° = vorne links)
  const mountMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
  for (let i = 0; i < 6; i++) {
    const angle = degToRad(30 + i * 60);
    const mount = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), mountMaterial);
    mount.position.set(BODY_RADIUS * Math.cos(angle), BODY_RADIUS * Math.sin(angle), 0);
    group.add(mount);
  }

  // Kleiner Pfeil nach vorne (+X), damit man die Blickrichtung erkennt
  group.add(
    new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, BODY_THICKNESS / 2), 80, 0xffffff),
  );

  return group;
}