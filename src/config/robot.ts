import raw from './robot.json';
import type { RobotConfig } from '../kinematics/robot';
import { degToRad } from '../kinematics/math';

/** Liest robot.json und rechnet Grad in Bogenmaß um. */
function loadRobot(): RobotConfig {
  const range = ([min, max]: number[]) => ({ min: degToRad(min), max: degToRad(max) });

  return {
    name: raw.name,
    leg: {
      coxaLength: raw.leg.coxa,
      femurLength: raw.leg.femur,
      tibiaLength: raw.leg.tibia,
      limits: {
        coxa: range(raw.leg.limits.coxa),
        femur: range(raw.leg.limits.femur),
        tibia: range(raw.leg.limits.tibia),
      },
    },
    mounts: raw.legs.map((l) => ({
      id: l.id,
      name: l.name,
      position: { x: l.mount[0], y: l.mount[1], z: l.mount[2] },
      angle: degToRad(l.angle),
    })),
    body: {
      thickness: raw.body.thickness,
      outline: raw.body.outline.map(([x, y]) => ({ x, y })),
    },
    stance: { ...raw.stance },
  };
}

export const ROBOT = loadRobot();