import { describe, expect, it } from 'vitest';
import { clamp, degToRad, radToDeg } from './math';

describe('math', () => {
  it('rechnet Grad in Bogenmaß um', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('Hin- und Rückrechnung ergibt den Ausgangswert', () => {
    for (const deg of [-135, -45, 0, 30, 90, 179]) {
      expect(radToDeg(degToRad(deg))).toBeCloseTo(deg);
    }
  });

  it('begrenzt Werte auf einen Bereich', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});