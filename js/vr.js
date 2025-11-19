import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function setupVR(renderer, camera) {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");

  const btn = VRButton.createButton(renderer);

  // --- Custom Styling for VR Button ---
  btn.style.background = 'rgba(0, 0, 0, 0.8)';
  btn.style.border = '1px solid #00f3ff';
  btn.style.color = '#00f3ff';
  btn.style.fontFamily = '"Rajdhani", sans-serif';
  btn.style.fontSize = '16px';
  btn.style.fontWeight = '600';
  btn.style.letterSpacing = '2px';
  btn.style.padding = '12px 24px';
  btn.style.borderRadius = '4px';
  btn.style.textTransform = 'uppercase';
  btn.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.3)';
  btn.style.transition = 'all 0.3s ease';
  btn.style.bottom = '20px'; // Ensure it's visible
  btn.style.opacity = '1';

  btn.onmouseenter = () => {
    btn.style.background = 'rgba(0, 243, 255, 0.2)';
    btn.style.boxShadow = '0 0 25px rgba(0, 243, 255, 0.6)';
  };
  btn.onmouseleave = () => {
    btn.style.background = 'rgba(0, 0, 0, 0.8)';
    btn.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.3)';
  };

  // Append to VR container so it's centered relative to the 3D view, not the whole page
  const container = document.getElementById('vr-container');
  if (container) {
    container.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }

  // CUANDO EL USUARIO ENTRA A VR → USAR POSICION 0,0,0 (CENTRO DEL MODELO)
  renderer.xr.addEventListener("sessionstart", () => {
    // En modo VR con local-floor, queremos que el usuario esté en el origen (0,0,0)
    // y su altura física determine la altura de los ojos.
    // Si copiamos la cámara de escritorio (0, 1.6, 0), podríamos sumar altura doble.

    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.position.set(0, 0, 0);
    xrCamera.quaternion.set(0, 0, 0, 1);

    // Opcional: Si el usuario necesita mirar hacia algun lado especifico, rotamos aqui.
  });
}

export function startVRLoop(renderer, scene, camera, onFrame) {
  renderer.setAnimationLoop((time, frame) => {
    if (typeof onFrame === "function") onFrame(time, frame);
    renderer.render(scene, camera);
  });
}
