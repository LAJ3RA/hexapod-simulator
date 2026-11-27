import './style.css';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { createScene } from './scene/createScene';
import { RobotView } from './scene/robotView';
import { ROBOT } from './config/robot';
import { neutralFeet, neutralPose, solveRobot, type BodyPose } from './kinematics/robot';
import { degToRad, radToDeg } from './kinematics/math';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app nicht gefunden');

const { scene, camera, renderer, controls } = createScene(app);
camera.position.set(-550, -600, 420);
controls.target.set(0, 0, 80);
controls.update();

// Roboter
const robot = new RobotView(ROBOT);
scene.add(robot.root);

// Füße stehen fest auf dem Boden (Welt-Koordinaten)
const feet = neutralFeet(ROBOT);
const footMarkers = feet.map((f) => {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(10, 24),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 }),
  );
  m.position.set(f.x, f.y, 0.5); // knapp über dem Raster
  scene.add(m);
  return m;
});

// Schieberegler arbeiten in Grad, die Kinematik in Bogenmaß
const neutral = neutralPose(ROBOT);
const ui = { x: 0, y: 0, z: neutral.z, roll: 0, pitch: 0, yaw: 0 };
const readout = { status: '', angles: ROBOT.mounts.map(() => '') };

function update() {
  const pose: BodyPose = {
    x: ui.x,
    y: ui.y,
    z: ui.z,
    roll: degToRad(ui.roll),
    pitch: degToRad(ui.pitch),
    yaw: degToRad(ui.yaw),
  };
  robot.setPose(pose);

  const results = solveRobot(ROBOT, pose, feet);
  const problems: string[] = [];

  results.forEach((r, i) => {
    robot.setLegAngles(i, r.angles);

    const a = r.angles;
    readout.angles[i] =
      `${radToDeg(a.coxa).toFixed(0)}° / ${radToDeg(a.femur).toFixed(0)}° / ${radToDeg(a.tibia).toFixed(0)}°`;

    let color = 0x22c55e;
    if (!r.reachable) {
      color = 0xef4444;
      problems.push(`B${ROBOT.mounts[i].id}: Reichweite`);
    } else if (r.limitViolations.length > 0) {
      color = 0xf59e0b;
      problems.push(`B${ROBOT.mounts[i].id}: ${r.limitViolations.join('+')}`);
    }
    (footMarkers[i].material as THREE.MeshBasicMaterial).color.setHex(color);
  });

  readout.status = problems.length === 0 ? 'OK' : problems.join(', ');
}

// Bedienpanel
const gui = new GUI({ title: ROBOT.name });
const bodyFolder = gui.addFolder('Körperhaltung');
bodyFolder.add(ui, 'x', -80, 80, 1).name('vor/zurück (mm)').onChange(update);
bodyFolder.add(ui, 'y', -80, 80, 1).name('links/rechts (mm)').onChange(update);
bodyFolder.add(ui, 'z', 30, 280, 1).name('Höhe (mm)').onChange(update);
bodyFolder.add(ui, 'roll', -30, 30, 0.5).name('Roll (°)').onChange(update);
bodyFolder.add(ui, 'pitch', -30, 30, 0.5).name('Nick (°)').onChange(update);
bodyFolder.add(ui, 'yaw', -30, 30, 0.5).name('Gier (°)').onChange(update);
bodyFolder
  .add(
    {
      reset: () => {
        Object.assign(ui, { x: 0, y: 0, z: neutral.z, roll: 0, pitch: 0, yaw: 0 });
        bodyFolder.controllersRecursive().forEach((c) => c.updateDisplay());
        update();
      },
    },
    'reset',
  )
  .name('Zurücksetzen');

gui.add(readout, 'status').name('Status').listen().disable();

const anglesFolder = gui.addFolder('Winkel Coxa / Femur / Tibia');
ROBOT.mounts.forEach((m, i) => {
  anglesFolder.add(readout.angles, i).name(`${m.id} ${m.name}`).listen().disable();
});
anglesFolder.close();

update();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});