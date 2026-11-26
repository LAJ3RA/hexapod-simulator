/** Grundlegende Hilfsfunktionen. Bewusst ohne three.js, damit sie sich leicht nach C++ übertragen lassen. */

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}