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
    // Crear la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xb0d4f1, 100, 500);

    // Cámara VR SIEMPRE INICIA EN ORIGEN
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 0); // NO elevamos aquí

    // Configurar Renderer WebXR
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

    // VR Button
    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);

    // AL ENTRAR VR → Ajustar altura a 1.6m
    renderer.xr.addEventListener("sessionstart", () => {
        const refSpace = renderer.xr.getReferenceSpace();
        renderer.xr.setReferenceSpace(
            refSpace.getOffsetReferenceSpace(
                new XRRigidTransform({ x: 0, y: 1.6, z: 0 })
            )
        );
    });

    // OrbitControls solo fuera de VR
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, -3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.update();

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Suelo por si el modelo no trae uno
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.8, metalness: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Nubes
    createClouds();

    // Cargar modelo GLB
    const loader = new GLTFLoader();
    const loadingElement = document.getElementById('loading');

    loader.load(
        'models/KITCHEN.glb',
        (gltf) => {
            model = gltf.scene;

            const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const materials = Array.isArray(child.material) ? child.material : [child.material];

                    materials.forEach(material => {
                        if (material && material.map) {
                            material.map.anisotropy = maxAnisotropy;
                        }
                    });
                }
            });

            // CENTRAR MODELO Y AJUSTAR ESCALA
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 10 / maxDim;
            model.scale.multiplyScalar(scale);

            box.setFromObject(model);
            box.getCenter(center);

            // POSICIONAR COCINA ALREDEDOR DEL USUARIO
            model.position.set(
                -center.x,
                -center.y,
                -center.z - 1.5 // distancia hacia adelante
            );

            // 🔥 Acomoda el frente hacia ti
            model.rotation.y = Math.PI;

            scene.add(model);

            loadingElement.style.display = 'none';
            console.log('✓ Modelo cargado y alineado para VR');
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                loadingElement.textContent = `Cargando: ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
            }
        },
        (error) => {
            console.error('Error:', error);
            loadingElement.textContent = 'Error al cargar el modelo';
            loadingElement.style.color = 'red';
        }
    );

    window.addEventListener('resize', onWindowResize);
}

function createClouds() {
    const cloudGeom = new THREE.SphereGeometry(1, 8, 8);
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        flatShading: true
    });

    for (let i = 0; i < 25; i++) {
        const cloud = new THREE.Group();
        const num = Math.floor(Math.random() + 3);

        for (let j = 0; j < num; j++) {
            const sp = new THREE.Mesh(cloudGeom, cloudMat);
            const s = Math.random() * 2 + 1;
            sp.scale.set(s, s * 0.8, s);
            sp.position.x = (Math.random() - 0.5) * 4;
            sp.position.y = (Math.random() - 0.5) * 1.5;
            sp.position.z = (Math.random() - 0.5) * 4;
            cloud.add(sp);
        }

        cloud.position.x = (Math.random() - 0.5) * 200;
        cloud.position.y = Math.random() * 30 + 40;
        cloud.position.z = (Math.random() - 0.5) * 200;

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
    const delta = clock.getDelta();

    // Animación nubes
    clouds.forEach((cloud, i) => {
        cloud.position.x += Math.sin(clock.elapsedTime * 0.1 + i) * 0.01;
        cloud.position.z += Math.cos(clock.elapsedTime * 0.1 + i) * 0.01;
    });

    // Solo usar OrbitControls si NO estamos en VR
    if (!renderer.xr.isPresenting) {
        controls.update();
    }

    renderer.render(scene, camera);
}

