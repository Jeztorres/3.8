import { createBasicScene, loadKitchenModel } from "./scene.js";
import { setupVR, startVRLoop } from "./vr.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const { scene, camera, renderer } = createBasicScene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.target.set(0, 1.4, 0);
controls.minDistance = 1.5;
controls.maxDistance = 6.0;
controls.maxPolarAngle = Math.PI * 0.85;

setupVR(renderer, camera);

loadKitchenModel(() => {
  startVRLoop(renderer, scene, camera, () => {
    controls.update();
  });
});
