import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Koordinatensystem des Simulators (wie im Roboter):
 *   X = vorne, Y = links, Z = oben, Einheit = Millimeter.
 * three.js nimmt standardmäßig Y als "oben" – das stellen wir hier um.
 */
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export function createScene(container: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1f24);

  // Kamera: Öffnungswinkel 45°, sichtbar von 1 mm bis 5 m
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    1,
    5000,
  );
  camera.position.set(-380, -420, 320);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Maussteuerung: links drehen, rechts verschieben, Rad zoomen
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 60);
  controls.enableDamping = true;
  controls.update();

  // Licht
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(300, -200, 600);
  scene.add(sun);

  // Boden-Raster: 1 m × 1 m, 50-mm-Kästchen. GridHelper liegt in XZ → in XY drehen
  const grid = new THREE.GridHelper(1000, 20, 0x777777, 0x3a3a3a);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);

  // Achsenkreuz: rot = X (vorne), grün = Y (links), blau = Z (oben)
  scene.add(new THREE.AxesHelper(120));

  // Bei Fenstergröße-Änderung Kamera und Zeichenfläche anpassen
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return { scene, camera, renderer, controls };
}