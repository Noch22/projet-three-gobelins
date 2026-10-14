import {
    Scene,
    Raycaster,
    Vector2,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    CanvasTexture,
    NearestFilter,
    RepeatWrapping,
} from 'three';
import LightsManager from './LightsManager';
import CameraManager from './CameraManager';
import Sphere from './Sphere';

const GRID_SIZE = 21;

export default class SceneGlobal extends Scene {
    constructor(options = {}) {
        super();

        this.renderer = options.renderer;
        this.debugger = options.debugger;
        this.sphere = this.createSphere();
        this.raycaster = new Raycaster();
        this.mousePosition = new Vector2();

        this.debugFolder = this.createDebugFolder();
        this.cameraManager = this.createCameraManager();
        this.lightsManager = this.createLightsManager();
        this.floorTexture = this.createFloorTexture();
        this.floor = this.createFloor();
        this.radius = 1;

        this.setupEventListeners();
    }

    get camera() {
        return this.cameraManager.camera;
    }

    createLightsManager() {
        const lightsManager = new LightsManager({
            scene: this,
            renderer: this.renderer,
            debugger: this.debugFolder,
            cameraManager: this.cameraManager,
        });

        return lightsManager;
    }

    createCameraManager() {
        const cameraManager = new CameraManager({
            renderer: this.renderer,
            debugger: this.debugFolder,
        });

        return cameraManager;
    }

    createSphere() {
        const sphere = new Sphere();

        sphere.position.y = -0.5;

        this.add(sphere);

        return sphere;
    }

    createFloorTexture() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 2;
        canvas.height = 2;

        context.fillStyle = '#F1F1F1';
        context.fillRect(0, 0, 1, 1);
        context.fillRect(1, 1, 1, 1);

        context.fillStyle = '#BFBFBF';
        context.fillRect(1, 0, 1, 1);
        context.fillRect(0, 1, 1, 1);

        const canvasTexture = new CanvasTexture(canvas);
        canvasTexture.minFilter = NearestFilter;
        canvasTexture.magFilter = NearestFilter;
        canvasTexture.wrapS = RepeatWrapping;
        canvasTexture.wrapT = RepeatWrapping;
        canvasTexture.repeat.set(GRID_SIZE / 2, GRID_SIZE / 2);

        return canvasTexture;
    }

    createFloor() {
        const geometry = new PlaneGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ map: this.floorTexture });
        const mesh = new Mesh(geometry, material);

        mesh.scale.set(GRID_SIZE, GRID_SIZE, GRID_SIZE);
        // mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = -0.5;
        mesh.position.z = -2;

        this.add(mesh);

        return mesh;
    }

    raycast() {
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
        const intersects = this.raycaster.intersectObject(this.sphere.hitMesh, false);

        if (intersects.length === 0) return;
        this.isPointerDown = true;
    }

    resize(width, height) {
        this.renderWidth = width;
        this.renderHeight = height;

        this.cameraManager.resize(width, height);
    }

    resizeHandler(event) {
        this.resize(window.innerWidth, window.innerHeight);
    }

    setupEventListeners() {
        window.addEventListener('pointerdown', this.pointerdownHandler.bind(this));
        window.addEventListener('pointerup', this.pointerupHandler.bind(this));
        window.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    }

    pointerupHandler(e) {
        console.log('pointerup', e);
        this.isPointerDown = false;
        const pointerUpTime = performance.now();
        this.pointerDuration = pointerUpTime - this.pointerDownTime;
        this.sphere.setRadius(1);
    }

    pointerdownHandler(e) {
        console.log('pointerdown', e);
        // this.isPointerDown = true;
        this.pointerDownTime = performance.now();
        console.log('pointerDownTime', this.pointerDownTime);

        this.pointerStartPosition = {
            x: e.clientX,
            y: e.clientY,
        };

        this.raycast();
    }

    mousemoveHandler(e) {
        this.mousePosition.x = (e.clientX / this.renderWidth) * 2 - 1;
        this.mousePosition.y = -(e.clientY / this.renderHeight) * 2 + 1;
    }

    update() {
        if (this.isPointerDown) {
            const elapsedTime = performance.now() - this.pointerDownTime;
            this.radius = Math.min(elapsedTime / 1000, 5);
            console.log(this.radius, elapsedTime);

            this.sphere.setRadius(this.radius / 2);
        }

        // a faire -> get le radius actuel et partir de la pour revenir a 1

        if (!this.isPointerDown) {
            const elapsedTime = performance.now() - this.pointerDownTime;

            this.radius = Math.min(1, this.radius + elapsedTime / 1000);
            console.log(this.radius);

            this.sphere.setRadius(this.radius / 2);
        }
    }

    /**
     *
     * Debug
     */

    createDebugFolder() {
        if (!this.debugger) return;

        const sceneFolder = this.debugger.addFolder({ title: 'Scene Sphere', expanded: false });

        const sphereFolder = sceneFolder.addFolder({ title: 'Sphere' });

        return sceneFolder;
    }
}
