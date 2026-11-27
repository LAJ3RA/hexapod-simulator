import { describe, expect, it } from 'vitest';
import { ROBOT } from '../config/robot';
import { forwardKinematics, type Vec3 } from './leg';
import { degToRad } from './math';
import {
  bodyToWorld,
  legToBody,
  neutralFeet,
  neutralPose,
  rotate,
  rotateInverse,
  solveRobot,
  worldToBody,
  type BodyPose,
} from './robot';

function expectVecClose(a: Vec3, b: Vec3, digits = 6) {
  expect(a.x).toBeCloseTo(b.x, digits);
  expect(a.y).toBeCloseTo(b.y, digits);
  expect(a.z).toBeCloseTo(b.z, digits);
}

describe('Drehungen', () => {
  it('Gier 90° dreht vorne (X) nach links (Y)', () => {
    expectVecClose(rotate({ x: 1, y: 0, z: 0 }, 0, 0, degToRad(90)), { x: 0, y: 1, z: 0 });
  });

  it('Roll 90° dreht links (Y) nach oben (Z)', () => {
    expectVecClose(rotate({ x: 0, y: 1, z: 0 }, degToRad(90), 0, 0), { x: 0, y: 0, z: 1 });
  });

  it('Nick 90° dreht vorne (X) nach unten (−Z)', () => {
    expectVecClose(rotate({ x: 1, y: 0, z: 0 }, 0, degToRad(90), 0), { x: 0, y: 0, z: -1 });
  });

  it('rotateInverse hebt rotate auf', () => {
    const p = { x: 12, y: -34, z: 56 };
    const r = rotate(p, 0.3, -0.2, 1.1);
    expectVecClose(rotateInverse(r, 0.3, -0.2, 1.1), p);
  });

  it('Welt → Körper → Welt ergibt den Ausgangspunkt', () => {
    const pose: BodyPose = { x: 10, y: -20, z: 130, roll: 0.1, pitch: -0.15, yaw: 0.4 };
    const p = { x: 200, y: 50, z: 0 };
    expectVecClose(bodyToWorld(pose, worldToBody(pose, p)), p);
  });
});

describe('Ganzer Roboter', () => {
  it('Grundhaltung: alle Beine erreichbar, Coxa = 0, alle Beine gleich', () => {
    const results = solveRobot(ROBOT, neutralPose(ROBOT), neutralFeet(ROBOT));
    for (const r of results) {
      expect(r.reachable).toBe(true);
      expect(r.limitViolations).toEqual([]);
      expect(r.angles.coxa).toBeCloseTo(0, 9);
      expect(r.angles.femur).toBeCloseTo(results[0].angles.femur, 9);
      expect(r.angles.tibia).toBeCloseTo(results[0].angles.tibia, 9);
    }
  });

  it('bei gekipptem Körper bleiben die Füße exakt an ihrer Stelle', () => {
    const feet = neutralFeet(ROBOT);
    const poses: BodyPose[] = [
      { x: 20, y: 0, z: 120, roll: 0, pitch: 0, yaw: 0 },
      { x: 0, y: -15, z: 140, roll: degToRad(10), pitch: degToRad(-8), yaw: degToRad(15) },
      { x: -10, y: 10, z: 100, roll: degToRad(-12), pitch: degToRad(12), yaw: degToRad(-20) },
    ];
    for (const pose of poses) {
      const results = solveRobot(ROBOT, pose, feet);
      results.forEach((r, i) => {
        expect(r.reachable).toBe(true);
        // Rückweg: Winkel → Fuß im Bein-System → Körper → Welt
        const footLeg = forwardKinematics(ROBOT.leg, r.angles).foot;
        const footWorld = bodyToWorld(pose, legToBody(ROBOT.mounts[i], footLeg));
        expectVecClose(footWorld, feet[i]);
      });
    }
  });
});