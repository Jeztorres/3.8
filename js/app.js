import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer, controls;
let model;
let clouds = [];
const clock = new THREE.Clock();

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xb0d4f1, 100, 500);

    // Cámara VR SIEMPRE EN ORIGEN
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;

    document.getElementById('container').appendChild(renderer.domElement);

    // VR BUTTON
    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);

    // Al entrar VR, subir usuario a 1.6m
    renderer.xr.addEventListener("sessionstart", () => {
        const space = renderer.xr.getReferenceSpace();
        renderer.xr.setReferenceSpace(
            space.getOffsetReferenceSpace(
                new XRRigidTransform({ x: 0, y: 1.6, z: 0 })
            )
        );
    });

    // OrbitControls solo fuera de VR
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, -3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.95;

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4));

    // Suelo base
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x505050 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    createClouds();

    // Cargar cocina
    const loader = new GLTFLoader();
    const loadingEl = document.getElementById('loading');

    loader.load(
        'models/KITCHEN.glb',
        (gltf) => {
            model = gltf.scene;

            const maxAni = renderer.capabilities.getMaxAnisotropy();

            // optimizar texturas
            model.traverse((c) => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                    if (c.material && c.material.map) {
                        c.material.map.anisotropy = maxAni;
                    }
                }
            });

            // Calcular bounding box
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Ajustar escala
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 10 / maxDim;
            model.scale.multiplyScalar(scale);

            // Recalcular
            box.setFromObject(model);
            box.getCenter(center);

            // 💥 POSICIÓN AJUSTADA: Dentro de la cocina
            model.position.set(
                -center.x,       // Centrado en X
                -center.y + 0.1, // Ajuste vertical piso
                -center.z + 0.5  // ACERCAR (antes -1.5)
            );

            // Mirar hacia adentro
            model.rotation.y = Math.PI;

            scene.add(model);

            loadingEl.style.display = 'none';
            console.log("✓ Cocina VR Lista");
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                loadingEl.textContent = `Cargando: ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
            }
        },
        (err) => {
            console.error(err);
            loadingEl.textContent = "❌ Error al cargar";
        }
    );

    window.addEventListener('resize', onWindowResize);
}

function createClouds() {
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.7,
        transparent: true
    });

    for (let i = 0; i < 25; i++) {
        const cloud = new THREE.Group();

        for (let j = 0; j < 3; j++) {
            const sp = new THREE.Mesh(geo, mat);
            const s = Math.random() * 2 + 1;
            sp.scale.set(s, s * 0.8, s);
            sp.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 4
            );
            cloud.add(sp);
        }

        cloud.position.set(
            (Math.random() - 0.5) * 200,
            Math.random() * 30 + 40,
            (Math.random() - 0.5) * 200
        );

        const sc = Math.random() * 3 + 2;
        cloud.scale.set(sc, sc, sc);

        clouds.push(cloud);
        scene.add(cloud);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    if (!renderer.xr.isPresenting) controls.update();
    renderer.render(scene, camera);
}


