import { describe, expect, it } from 'vitest';
import { ROBOT } from '../config/robot';
import { forwardKinematics, inverseKinematics, type Vec3 } from './leg';
import { degToRad } from './math';

const leg = ROBOT.leg;
const C = leg.coxaLength;
const F = leg.femurLength;
const T = leg.tibiaLength;

function expectVecClose(actual: Vec3, expected: Vec3, digits = 6) {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
  expect(actual.z).toBeCloseTo(expected.z, digits);
}

describe('Vorwärtskinematik', () => {
  it('alle Winkel 0 → Bein gestreckt nach außen', () => {
    const { foot } = forwardKinematics(leg, { coxa: 0, femur: 0, tibia: 0 });
    expectVecClose(foot, { x: C + F + T, y: 0, z: 0 });
  });

  it('Femur 90° hoch, Tibia 90° zurück → Unterschenkel waagerecht', () => {
    const j = forwardKinematics(leg, { coxa: 0, femur: degToRad(90), tibia: degToRad(-90) });
    expectVecClose(j.tibia, { x: C, y: 0, z: F });
    expectVecClose(j.foot, { x: C + T, y: 0, z: F });
  });

  it('Coxa 90° → Bein zeigt in +Y', () => {
    const { foot } = forwardKinematics(leg, { coxa: degToRad(90), femur: 0, tibia: 0 });
    expectVecClose(foot, { x: 0, y: C + F + T, z: 0 });
  });
});

describe('Inverse Kinematik', () => {
  it('IK → FK trifft das Ziel (Gitter typischer Fußpositionen)', () => {
    for (let x = 80; x <= 220; x += 20) {
      for (let y = -100; y <= 100; y += 25) {
        for (let z = -140; z <= 0; z += 20) {
          const target = { x, y, z };
          const ik = inverseKinematics(leg, target);
          if (!ik.reachable) continue;
          const { foot } = forwardKinematics(leg, ik.angles);
          expectVecClose(foot, target);
        }
      }
    }
  });

  it('FK → IK ergibt dieselben Winkel', () => {
    const samples = [
      { coxa: 0, femur: 0.3, tibia: -1.8 },
      { coxa: 0.5, femur: -0.2, tibia: -1.2 },
      { coxa: -0.8, femur: 0.9, tibia: -2.4 },
    ];
    for (const angles of samples) {
      const { foot } = forwardKinematics(leg, angles);
      const ik = inverseKinematics(leg, foot);
      expect(ik.reachable).toBe(true);
      expect(ik.angles.coxa).toBeCloseTo(angles.coxa, 6);
      expect(ik.angles.femur).toBeCloseTo(angles.femur, 6);
      expect(ik.angles.tibia).toBeCloseTo(angles.tibia, 6);
    }
  });

  it('meldet zu weit entfernte Ziele als unerreichbar', () => {
    const ik = inverseKinematics(leg, { x: C + F + T + 10, y: 0, z: 0 });
    expect(ik.reachable).toBe(false);
  });

  it('meldet zu nahe Ziele als unerreichbar', () => {
    const ik = inverseKinematics(leg, { x: C, y: 0, z: 5 });
    expect(ik.reachable).toBe(false);
  });

  it('erkennt überschrittene Gelenkgrenzen', () => {
    // Ziel weit seitlich → Coxa müsste > 60° drehen
    const ik = inverseKinematics(leg, { x: 20, y: 150, z: -80 });
    expect(ik.limitViolations).toContain('coxa');
  });
});