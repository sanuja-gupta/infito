import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let renderer, scene, camera, controls, animFrameId;

export function loadThreeScene(glbPath, containerId = 'three-canvas-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    destroyScene();
    container.innerHTML = '';

    // ── RENDERER ──────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 520;
    renderer.setSize(w, h);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── SCENE ─────────────────────────────────────────────
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f0f1a');

    // ── CAMERA ────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 3, 7);

    // ── LIGHTS ────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcceeff, 0.6);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // ── GROUND ────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── GRID ──────────────────────────────────────────────
    const grid = new THREE.GridHelper(20, 20, 0x333355, 0x222233);
    grid.position.y = -1.49;
    scene.add(grid);

    // ── ORBIT CONTROLS ────────────────────────────────────
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 50;
    controls.enablePan = true;
    controls.target.set(0, 1, 0);

    // ── LOADING INDICATOR ─────────────────────────────────
    const loader_el = document.createElement('div');
    loader_el.id = 'three-loader';
    loader_el.style.cssText = `
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        color:#c0392b; font-family:monospace; font-size:13px;
        z-index:10;
    `;
    loader_el.textContent = 'Loading 3D model...';
    container.style.position = 'relative';
    container.appendChild(loader_el);

    // ── LOAD GLB ──────────────────────────────────────────
    console.log('Loading GLB from:', glbPath);

    const loader = new GLTFLoader();
    loader.load(
        glbPath,
        (gltf) => {
            console.log('GLB loaded successfully');
            const model = gltf.scene;

            // Compute bounding box
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            console.log('Model size:', size, 'Max dim:', maxDim);

            // Auto-center and scale
            const scale = 3 / maxDim;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y += size.y * scale * 0.5;

            // Enable shadows on all meshes
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = Math.max(child.material.roughness, 0.3);
                    }
                }
            });

            scene.add(model);

            // ── CAMERA FRAMING: fit entire model in view ─────
            fitCameraToObject(camera, model, controls, 1.4);

            // Force all materials bright
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x222222);
                    child.material.emissiveIntensity = 0.3;
                }
            });

            // Remove loader
            const el = document.getElementById('three-loader');
            if (el) el.remove();

            animate();
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                const pct = Math.round((xhr.loaded / xhr.total) * 100);
                const el = document.getElementById('three-loader');
                if (el) el.textContent = `Loading 3D model... ${pct}%`;
            }
        },
        (err) => {
            console.error('GLB load error:', err);
            const el = document.getElementById('three-loader');
            if (el) {
                el.innerHTML = `<span style="color:#e74c3c">Failed to load 3D model.<br>Check console for details.</span>`;
            }
        }
    );

    window.addEventListener('resize', onResize);
}

/**
 * Fit camera to object using bounding sphere.
 * Ensures the entire model is visible regardless of aspect ratio.
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Object3D} object
 * @param {OrbitControls} controls
 * @param {number} offset - multiplier to add padding (default 1.25)
 */
function fitCameraToObject(camera, object, controls, offset = 1.25) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // Use bounding sphere for reliable fitting
    const maxDim = Math.max(size.x, size.y, size.z);
    const boundingSphereRadius = maxDim / 2;

    // Calculate required distance based on camera FOV and aspect
    const fov = camera.fov * (Math.PI / 180);
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);

    // Distance to fit the bounding sphere
    const dx = boundingSphereRadius / Math.sin(fovh / 2);
    const dy = boundingSphereRadius / Math.sin(fov / 2);
    let distance = Math.max(dx, dy);

    // Apply offset padding so model doesn't touch edges
    distance *= offset;

    // Position camera at an angle that shows the model well
    const cameraPos = new THREE.Vector3(
        distance * 0.6,
        distance * 0.5,
        distance * 0.8
    );
    camera.position.copy(cameraPos);

    // Look at center of model
    camera.lookAt(center);

    // Update controls
    controls.target.copy(center);
    controls.maxDistance = distance * 3;
    controls.minDistance = distance * 0.1;
    controls.update();

    // Ensure far plane covers everything
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + distance : distance - minZ;
    camera.far = cameraToFarEdge * 5;
    camera.updateProjectionMatrix();

    console.log('Camera fitted:', {
        distance: distance.toFixed(2),
        position: camera.position.toArray().map(v => v.toFixed(2)),
        target: controls.target.toArray().map(v => v.toFixed(2)),
        size: size.toArray().map(v => v.toFixed(2))
    });
}

function animate() {
    animFrameId = requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onResize() {
    if (!renderer || !camera) return;
    const container = renderer.domElement.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight || 520;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

export function destroyScene() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }
    scene = null;
    camera = null;
    controls = null;
    window.removeEventListener('resize', onResize);
}
