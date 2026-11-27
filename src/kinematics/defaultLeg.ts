import type { LegGeometry } from './leg';
import { degToRad } from './math';

/**
 * Maße von Julians Hexapod V3. Die Grenzen sind vorläufige Annahmen
 * (Servo ±90°), bis die neue Firmware/Mechanik feststeht.
 * In Meilenstein 2 wandert das in robot.json.
 */
export const DEFAULT_LEG: LegGeometry = {
  coxaLength: 53,
  femurLength: 98,
  tibiaLength: 111,
  limits: {
    coxa: { min: degToRad(-60), max: degToRad(60) },
    femur: { min: degToRad(-90), max: degToRad(90) },
    tibia: { min: degToRad(-160), max: degToRad(0) },
  },
};