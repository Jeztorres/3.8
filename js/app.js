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
    scene.background = new THREE.Color(0x87ceeb); // Cielo azul
    scene.fog = new THREE.Fog(0xb0d4f1, 100, 500);

    // Configurar la cámara (posición de estudiante dentro del salón)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0); // Altura de ojos humano (1.6m) en el centro

    // Configurar el renderer con WebXR - optimizado para carga rápida
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Habilitar WebXR
    renderer.xr.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    // Agregar botón VR
    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);
    
    // Configurar posición VR - altura humana en el centro
    renderer.xr.addEventListener('sessionstart', () => {
        // Ajustar la posición base para VR a altura de ojos humano
        camera.position.set(0, 1.6, 0);
    });

    // Controles de órbita para modo desktop
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, -3); // Mirar hacia el frente del salón
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5; // Permitir acercarse
    controls.maxDistance = 20; // Limitar alejamiento
    controls.maxPolarAngle = Math.PI * 0.95; // Evitar que la cámara vaya bajo el suelo
    controls.update();

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Luz hemisférica para iluminación natural
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Agregar un plano de suelo si el modelo no tiene uno
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x505050,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Crear nubes
    createClouds();

    // Cargar el modelo GLB (KITCHEN) - Optimizado para carga rápida
    const loader = new GLTFLoader();
    const loadingElement = document.getElementById('loading');
    
    loader.load(
        'models/KITCHEN.glb',
        (gltf) => {
            model = gltf.scene;
            
            const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
            
            // Configurar sombras y materiales - procesamiento eficiente
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Procesar materiales (array o individual)
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    
                    materials.forEach(material => {
                        if (material) {
                            material.needsUpdate = true;
                            
                            // Cargar TODAS las texturas posibles con máxima calidad
                            // Textura base/difusa (color)
                            if (material.map) {
                                material.map.anisotropy = maxAnisotropy;
                                material.map.needsUpdate = true;
                            }
                            // Mapa de normales (detalles de superficie)
                            if (material.normalMap) {
                                material.normalMap.anisotropy = maxAnisotropy;
                                material.normalMap.needsUpdate = true;
                            }
                            // Mapa de rugosidad
                            if (material.roughnessMap) {
                                material.roughnessMap.anisotropy = maxAnisotropy;
                                material.roughnessMap.needsUpdate = true;
                            }
                            // Mapa metálico
                            if (material.metalnessMap) {
                                material.metalnessMap.anisotropy = maxAnisotropy;
                                material.metalnessMap.needsUpdate = true;
                            }
                            // Mapa emisivo (luces/brillo)
                            if (material.emissiveMap) {
                                material.emissiveMap.anisotropy = maxAnisotropy;
                                material.emissiveMap.needsUpdate = true;
                            }
                            // Mapa de oclusión ambiental
                            if (material.aoMap) {
                                material.aoMap.anisotropy = maxAnisotropy;
                                material.aoMap.needsUpdate = true;
                            }
                            // Mapa de desplazamiento/altura
                            if (material.displacementMap) {
                                material.displacementMap.anisotropy = maxAnisotropy;
                                material.displacementMap.needsUpdate = true;
                            }
                            // Mapa de transparencia/alpha
                            if (material.alphaMap) {
                                material.alphaMap.anisotropy = maxAnisotropy;
                                material.alphaMap.needsUpdate = true;
                            }
                            // Mapa de ambiente/reflexión
                            if (material.envMap) {
                                material.envMap.needsUpdate = true;
                            }
                            // Mapa de luz (lightmap)
                            if (material.lightMap) {
                                material.lightMap.anisotropy = maxAnisotropy;
                                material.lightMap.needsUpdate = true;
                            }
                            // Mapa de relieve (bump)
                            if (material.bumpMap) {
                                material.bumpMap.anisotropy = maxAnisotropy;
                                material.bumpMap.needsUpdate = true;
                            }
                            // Mapa especular
                            if (material.specularMap) {
                                material.specularMap.anisotropy = maxAnisotropy;
                                material.specularMap.needsUpdate = true;
                            }
                            // Mapa de brillo especular
                            if (material.specularIntensityMap) {
                                material.specularIntensityMap.anisotropy = maxAnisotropy;
                                material.specularIntensityMap.needsUpdate = true;
                            }
                            // Mapa de color especular
                            if (material.specularColorMap) {
                                material.specularColorMap.anisotropy = maxAnisotropy;
                                material.specularColorMap.needsUpdate = true;
                            }
                        }
                    });
                }
            });

            // Centrar y posicionar el modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Ajustar la escala si el modelo es muy grande o muy pequeño
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 10 / maxDim; // Ajustar a un tamaño razonable
            model.scale.multiplyScalar(scale);
            
            // Posicionar el modelo para que el usuario esté dentro
            box.setFromObject(model);
            box.getCenter(center);
            model.position.x = -center.x;
            model.position.y = 0; // Modelo en el suelo
            model.position.z = -center.z;

            scene.add(model);
            
            loadingElement.style.display = 'none';
            console.log('✓ Modelo KITCHEN.glb cargado con todas las texturas');
        },
        (xhr) => {
            // Progreso de carga
            if (xhr.lengthComputable) {
                const percent = (xhr.loaded / xhr.total) * 100;
                loadingElement.textContent = `Cargando: ${Math.round(percent)}%`;
            }
        },
        (error) => {
            console.error('Error al cargar el modelo:', error);
            loadingElement.textContent = 'Error al cargar el modelo';
            loadingElement.style.color = 'red';
        }
    );

    // Manejador de resize
    window.addEventListener('resize', onWindowResize);
}

function createClouds() {
    // Crear múltiples nubes con diferentes tamaños y posiciones
    const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        flatShading: true
    });

    for (let i = 0; i < 25; i++) {
        const cloud = new THREE.Group();
        
        // Crear cada nube con múltiples esferas
        const numSpheres = Math.floor(Math.random() * 4) + 3;
        for (let j = 0; j < numSpheres; j++) {
            const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
            const scale = Math.random() * 2 + 1;
            sphere.scale.set(scale, scale * 0.8, scale);
            sphere.position.x = (Math.random() - 0.5) * 4;
            sphere.position.y = (Math.random() - 0.5) * 1.5;
            sphere.position.z = (Math.random() - 0.5) * 4;
            cloud.add(sphere);
        }
        
        // Posicionar nubes en el cielo alrededor del salón
        cloud.position.x = (Math.random() - 0.5) * 200;
        cloud.position.y = Math.random() * 30 + 40;
        cloud.position.z = (Math.random() - 0.5) * 200;
        
        // Escala general de la nube
        const cloudScale = Math.random() * 3 + 2;
        cloud.scale.set(cloudScale, cloudScale, cloudScale);
        
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
    const time = clock.getElapsedTime();
    
    // Animar nubes (movimiento lento)
    clouds.forEach((cloud, index) => {
        cloud.position.x += Math.sin(time * 0.1 + index) * 0.01;
        cloud.position.z += Math.cos(time * 0.1 + index) * 0.01;
        
        // Si la nube se aleja mucho, reiniciar posición
        if (Math.abs(cloud.position.x) > 150) {
            cloud.position.x = -cloud.position.x;
        }
        if (Math.abs(cloud.position.z) > 150) {
            cloud.position.z = -cloud.position.z;
        }
    });
    
    // Actualizar controles solo si no estamos en VR
    if (!renderer.xr.isPresenting) {
        controls.update();
    }
    
    // Si el modelo tiene animaciones, actualizarlas aquí
    if (model && model.mixer) {
        model.mixer.update(delta);
    }
    
    renderer.render(scene, camera);
}
