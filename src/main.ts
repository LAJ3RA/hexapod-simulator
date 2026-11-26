import './style.css';
import { createScene } from './scene/createScene';
import { createBodyPlaceholder } from './scene/bodyPlaceholder';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app nicht gefunden');

const { scene, camera, renderer, controls } = createScene(app);
scene.add(createBodyPlaceholder());

// Wird vom Browser vor jedem Bild aufgerufen (~60x pro Sekunde)
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});