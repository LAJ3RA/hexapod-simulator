/**
 * Kinematik des ganzen Roboters: Körperhaltung + sechs Beine.
 *
 * Drei Koordinatensysteme:
 *   Welt   – fest am Boden. Hier stehen die Füße.
 *   Körper – bewegt sich mit dem Körper (Position + Roll/Nick/Gier).
 *   Bein   – Ursprung an der Coxa-Achse, X zeigt in Grundrichtung des Beins.
 *
 * Für jedes Bein: Fuß (Welt) → Körper → Bein → inverse Kinematik.
 */
import { inverseKinematics, type IkResult, type LegGeometry, type Vec3 } from './leg';

export interface LegMount {
  id: number;
  name: string;
  position: Vec3; // Coxa-Achse im Körper-System (mm)
  angle: number; // Grundrichtung des Beins (rad), 0 = nach vorne
}

export interface RobotConfig {
  name: string;
  leg: LegGeometry;
  mounts: LegMount[];
  body: { thickness: number; outline: { x: number; y: number }[] };
  stance: { footDistance: number; bodyHeight: number };
}

/** Lage des Körpers in der Welt. Winkel in rad, Reihenfolge Gier → Nick → Roll. */
export interface BodyPose {
  x: number;
  y: number;
  z: number;
  roll: number; // um X (vorne), positiv = rechte Seite hoch
  pitch: number; // um Y (links), positiv = Nase runter
  yaw: number; // um Z (oben), positiv = nach links drehen
}

/** Dreht einen Punkt: R = Rz(yaw) · Ry(pitch) · Rx(roll). */
export function rotate(p: Vec3, roll: number, pitch: number, yaw: number): Vec3 {
  const [cr, sr] = [Math.cos(roll), Math.sin(roll)];
  const [cp, sp] = [Math.cos(pitch), Math.sin(pitch)];
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
  // Roll (um X)
  const x1 = p.x;
  const y1 = cr * p.y - sr * p.z;
  const z1 = sr * p.y + cr * p.z;
  // Nick (um Y)
  const x2 = cp * x1 + sp * z1;
  const y2 = y1;
  const z2 = -sp * x1 + cp * z1;
  // Gier (um Z)
  return { x: cy * x2 - sy * y2, y: sy * x2 + cy * y2, z: z2 };
}

/** Umkehrung von rotate (Reihenfolge rückwärts, Winkel negativ). */
export function rotateInverse(p: Vec3, roll: number, pitch: number, yaw: number): Vec3 {
  const a = rotate(p, 0, 0, -yaw);
  const b = rotate(a, 0, -pitch, 0);
  return rotate(b, -roll, 0, 0);
}

export function bodyToWorld(pose: BodyPose, p: Vec3): Vec3 {
  const r = rotate(p, pose.roll, pose.pitch, pose.yaw);
  return { x: r.x + pose.x, y: r.y + pose.y, z: r.z + pose.z };
}

export function worldToBody(pose: BodyPose, p: Vec3): Vec3 {
  const d = { x: p.x - pose.x, y: p.y - pose.y, z: p.z - pose.z };
  return rotateInverse(d, pose.roll, pose.pitch, pose.yaw);
}

export function bodyToLeg(mount: LegMount, p: Vec3): Vec3 {
  const d = { x: p.x - mount.position.x, y: p.y - mount.position.y, z: p.z - mount.position.z };
  return rotate(d, 0, 0, -mount.angle);
}

export function legToBody(mount: LegMount, p: Vec3): Vec3 {
  const r = rotate(p, 0, 0, mount.angle);
  return { x: r.x + mount.position.x, y: r.y + mount.position.y, z: r.z + mount.position.z };
}

/** Grundhaltung: Körper mittig in Standhöhe, nicht gekippt. */
export function neutralPose(cfg: RobotConfig): BodyPose {
  return { x: 0, y: 0, z: cfg.stance.bodyHeight, roll: 0, pitch: 0, yaw: 0 };
}

/** Fußpositionen (Welt) der Grundhaltung: jedes Bein in Grundrichtung, Fuß auf dem Boden. */
export function neutralFeet(cfg: RobotConfig): Vec3[] {
  return cfg.mounts.map((m) => ({
    x: m.position.x + Math.cos(m.angle) * cfg.stance.footDistance,
    y: m.position.y + Math.sin(m.angle) * cfg.stance.footDistance,
    z: 0,
  }));
}

/** Berechnet die Gelenkwinkel aller Beine für eine Körperhaltung und feste Fußpositionen. */
export function solveRobot(cfg: RobotConfig, pose: BodyPose, feetWorld: Vec3[]): IkResult[] {
  return cfg.mounts.map((mount, i) => {
    const footInBody = worldToBody(pose, feetWorld[i]);
    const footInLeg = bodyToLeg(mount, footInBody);
    return inverseKinematics(cfg.leg, footInLeg);
  });
}