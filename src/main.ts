import './style.css';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { createScene } from './scene/createScene';
import { LegView } from './scene/legView';
import { DEFAULT_LEG } from './kinematics/defaultLeg';
import { inverseKinematics } from './kinematics/leg';
import { radToDeg } from './kinematics/math';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app nicht gefunden');

const { scene, camera, renderer, controls } = createScene(app);

// Bein auf einem "Sockel" 120 mm über dem Boden
const MOUNT_HEIGHT = 120;
const leg = new LegView(DEFAULT_LEG);
leg.root.position.z = MOUNT_HEIGHT;
scene.add(leg.root);

const pedestal = new THREE.Mesh(
  new THREE.BoxGeometry(40, 40, MOUNT_HEIGHT),
  new THREE.MeshStandardMaterial({ color: 0x334155 }),
);
pedestal.position.set(-20, 0, MOUNT_HEIGHT / 2);
scene.add(pedestal);

// Zielpunkt (relativ zur Coxa-Achse, in mm)
const target = { x: 150, y: 0, z: -90 };
const targetMarker = new THREE.Mesh(
  new THREE.SphereGeometry(8, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.5 }),
);
scene.add(targetMarker);

// Anzeige-Werte für das Panel
const readout = { coxa: '', femur: '', tibia: '', status: '' };

function update() {
  const result = inverseKinematics(DEFAULT_LEG, target);
  leg.setAngles(result.angles);

  targetMarker.position.set(target.x, target.y, target.z + MOUNT_HEIGHT);

  readout.coxa = `${radToDeg(result.angles.coxa).toFixed(1)}°`;
  readout.femur = `${radToDeg(result.angles.femur).toFixed(1)}°`;
  readout.tibia = `${radToDeg(result.angles.tibia).toFixed(1)}°`;

  let color = 0x22c55e; // grün = alles ok
  if (!result.reachable) {
    readout.status = 'Außer Reichweite';
    color = 0xef4444; // rot
  } else if (result.limitViolations.length > 0) {
    readout.status = `Grenze: ${result.limitViolations.join(', ')}`;
    color = 0xf59e0b; // orange
  } else {
    readout.status = 'OK';
  }
  (targetMarker.material as THREE.MeshBasicMaterial).color.setHex(color);
}

// Bedienpanel oben rechts
const gui = new GUI({ title: 'Bein – Fußposition (mm)' });
gui.add(target, 'x', -50, 280, 1).onChange(update);
gui.add(target, 'y', -200, 200, 1).onChange(update);
gui.add(target, 'z', -200, 150, 1).onChange(update);
const anglesFolder = gui.addFolder('Winkel');
anglesFolder.add(readout, 'coxa').listen().disable();
anglesFolder.add(readout, 'femur').listen().disable();
anglesFolder.add(readout, 'tibia').listen().disable();
gui.add(readout, 'status').name('Status').listen().disable();

update();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});