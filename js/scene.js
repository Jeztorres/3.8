import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export let scene, camera, renderer, world;

export function createBasicScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue
  scene.fog = new THREE.Fog(0x87CEEB, 10, 50); // Soft fog

  world = new THREE.Group();
  scene.add(world);

  // --- Environment: Grass & Trees ---

  // 1. Grass Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05; // Just below the model
  ground.receiveShadow = true;
  scene.add(ground);

  // 2. Simple Trees Function
  function createTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    treeGroup.add(trunk);

    // Leaves (Cone)
    const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 2.5;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    return treeGroup;
  }

  // Scatter some trees around (outside the kitchen area)
  // Kitchen is roughly at 0,0. Let's put trees further out.
  const treePositions = [
    [5, 5], [-5, 8], [8, -6], [-7, -5],
    [10, 0], [-10, 2], [0, -10], [3, 12]
  ];

  treePositions.forEach(pos => {
    scene.add(createTree(pos[0], pos[1]));
  });

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 1.6, 0); // Inside the model

  renderer = new THREE.WebGLRenderer({ antialias: true });

  const container = document.getElementById('vr-container');
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemiLight.position.set(0, 5, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(3, 6, 2);
  scene.add(dirLight);

  window.addEventListener("resize", () => {
    const container = document.getElementById('vr-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return { scene, camera, renderer };
}

export function loadKitchenModel(onLoaded = () => { }) {
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
      const loadingText = document.querySelector("#loading .loading-text");
      if (loadingText) {
        loadingText.innerText = "Error al cargar la cocina.";
        loadingText.style.color = "#ef4444"; // Red color for error
      } else {
        document.getElementById("loading").innerText = "Error al cargar la cocina.";
      }
      // Stop spinner
      const spinner = document.querySelector(".loader");
      if (spinner) spinner.style.display = "none";
    }
  );
}
