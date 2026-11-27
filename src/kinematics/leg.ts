/**
 * Kinematik eines einzelnen Beins (Coxa – Femur – Tibia).
 *
 * Bein-Koordinatensystem (Ursprung = Coxa-Drehachse):
 *   X = vom Körper weg nach außen, Y = 90° gegen den Uhrzeigersinn dazu, Z = oben.
 *
 * Winkel (Bogenmaß):
 *   coxa  = Drehung um Z. 0 = Bein zeigt genau nach außen, positiv = gegen den Uhrzeigersinn.
 *   femur = Neigung des Oberschenkels. 0 = waagerecht, positiv = nach oben.
 *   tibia = Knick relativ zum Femur. 0 = gestreckt, negativ = Unterschenkel nach unten geknickt.
 *
 * Bewusst ohne three.js – dieselbe Rechnung soll später in die C++-Firmware.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LegAngles {
  coxa: number;
  femur: number;
  tibia: number;
}

export interface JointRange {
  min: number; // rad
  max: number; // rad
}

export interface LegGeometry {
  coxaLength: number; // mm, Coxa-Achse → Femur-Achse
  femurLength: number; // mm, Femur-Achse → Tibia-Achse
  tibiaLength: number; // mm, Tibia-Achse → Fußspitze
  limits: {
    coxa: JointRange;
    femur: JointRange;
    tibia: JointRange;
  };
}

/** Positionen aller Gelenke – praktisch zum Zeichnen und zum Prüfen. */
export interface LegJoints {
  coxa: Vec3; // Coxa-Achse (Ursprung)
  femur: Vec3; // Femur-Achse
  tibia: Vec3; // Knie
  foot: Vec3; // Fußspitze
}

export interface IkResult {
  angles: LegAngles;
  /** false = Ziel liegt außerhalb der Reichweite; angles zeigen dann die bestmögliche Annäherung */
  reachable: boolean;
  /** Namen der Gelenke, die ihre Grenzen überschreiten würden */
  limitViolations: (keyof LegAngles)[];
}

/** Vorwärtskinematik: Winkel → Positionen aller Gelenke. */
export function forwardKinematics(geo: LegGeometry, a: LegAngles): LegJoints {
  // Zuerst in der senkrechten Ebene des Beins rechnen: r = waagerechter Abstand, z = Höhe
  const rFemur = geo.coxaLength;
  const rKnee = rFemur + geo.femurLength * Math.cos(a.femur);
  const zKnee = geo.femurLength * Math.sin(a.femur);
  const rFoot = rKnee + geo.tibiaLength * Math.cos(a.femur + a.tibia);
  const zFoot = zKnee + geo.tibiaLength * Math.sin(a.femur + a.tibia);

  // Dann die Ebene um den Coxa-Winkel um Z drehen
  const c = Math.cos(a.coxa);
  const s = Math.sin(a.coxa);
  const toXYZ = (r: number, z: number): Vec3 => ({ x: r * c, y: r * s, z });

  return {
    coxa: { x: 0, y: 0, z: 0 },
    femur: toXYZ(rFemur, 0),
    tibia: toXYZ(rKnee, zKnee),
    foot: toXYZ(rFoot, zFoot),
  };
}

/** Inverse Kinematik: gewünschte Fußposition → Winkel (Knie zeigt nach oben). */
export function inverseKinematics(geo: LegGeometry, target: Vec3): IkResult {
  const F = geo.femurLength;
  const T = geo.tibiaLength;

  // 1) Coxa: Richtung in der Draufsicht
  const coxa = Math.atan2(target.y, target.x);

  // 2) In die senkrechte Bein-Ebene wechseln, gemessen ab der Femur-Achse
  const r = Math.hypot(target.x, target.y) - geo.coxaLength;
  const z = target.z;
  let d = Math.hypot(r, z); // Abstand Femur-Achse → Fuß

  // 3) Reichweite prüfen: Dreieck Femur–Tibia–d muss existieren
  const maxReach = F + T;
  const minReach = Math.abs(F - T);
  let reachable = true;
  if (d > maxReach) {
    d = maxReach; // so weit wie möglich strecken
    reachable = false;
  } else if (d < minReach) {
    d = minReach;
    reachable = false;
  }

  // 4) Kosinussatz im Dreieck Femur / Tibia / d
  //    alpha = Winkel am Femur-Gelenk zwischen d und Femur
  //    gamma = Innenwinkel am Knie
  const cosAlpha = clampUnit((F * F + d * d - T * T) / (2 * F * d));
  const cosGamma = clampUnit((F * F + T * T - d * d) / (2 * F * T));
  const alpha = Math.acos(cosAlpha);
  const gamma = Math.acos(cosGamma);

  const femur = Math.atan2(z, r) + alpha; // Knie oberhalb der Verbindungslinie
  const tibia = gamma - Math.PI; // gestreckt (gamma = 180°) → 0, sonst negativ

  const angles: LegAngles = { coxa, femur, tibia };
  return { angles, reachable, limitViolations: checkLimits(geo, angles) };
}

/** Liefert alle Gelenke, deren Winkel außerhalb der Servogrenzen liegt. */
export function checkLimits(geo: LegGeometry, a: LegAngles): (keyof LegAngles)[] {
  const joints: (keyof LegAngles)[] = ['coxa', 'femur', 'tibia'];
  return joints.filter((j) => a[j] < geo.limits[j].min || a[j] > geo.limits[j].max);
}

function clampUnit(v: number): number {
  return Math.min(1, Math.max(-1, v)); // schützt acos vor Rundungsfehlern wie 1.0000000002
}