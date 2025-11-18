import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function setupVR(renderer, camera) {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");

  const btn = VRButton.createButton(renderer);
  document.body.appendChild(btn);

  // CUANDO EL USUARIO ENTRA A VR → USAR POSICIÓN ACTUAL
  renderer.xr.addEventListener("sessionstart", () => {
    const pos = camera.position.clone();
    const rot = camera.quaternion.clone();

    const xrCamera = renderer.xr.getCamera(camera);

    xrCamera.position.copy(pos);
    xrCamera.quaternion.copy(rot);
  });
}

export function startVRLoop(renderer, scene, camera, onFrame) {
  renderer.setAnimationLoop((time, frame) => {
    if (typeof onFrame === "function") onFrame(time, frame);
    renderer.render(scene, camera);
  });
}
