import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export let scene, camera, renderer, world;

export function createBasicScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  world = new THREE.Group();
  scene.add(world);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 1.7, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  document.body.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemiLight.position.set(0, 5, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(3, 6, 2);
  scene.add(dirLight);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

export function loadKitchenModel(onLoaded = () => {}) {
  const loader = new GLTFLoader();

  loader.load(
    "./assets/models/KITCHEN.glb",
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const minY = box.min.y;

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= minY;

      world.add(model);

      document.getElementById("loading").style.display = "none";

      onLoaded(model);
    },
    undefined,
    (err) => {
      console.error("Error cargando modelo:", err);
      document.getElementById("loading").innerText = "Error al cargar la cocina.";
    }
  );
}
