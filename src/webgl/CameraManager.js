import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

export default class CameraManager {
    constructor(options = {}) {
        this.renderer = options.renderer;
        this.debugger = options.debugger;

        this.camera = this.createCamera();
        // this.controls = this.createControls();

        this.setupEventListeners();

        this.debugFolder = this.createDebugFolder();
    }

    createCamera() {
        const camera = new PerspectiveCamera(45, this.renderWidth / this.renderHeight, 0.1, 500);

        camera.position.z = 5;

        return camera;
    }

    resetCameraPosition() {
        this.camera.position.set(0, 0, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);

        const savedPosition = JSON.parse(sessionStorage.getItem('cameraPosition'));
        const savedTarget = JSON.parse(sessionStorage.getItem('cameraTarget'));

        if (savedPosition) this.camera.position.set(savedPosition.x, savedPosition.y, savedPosition.z);
        if (savedTarget) controls.target.set(savedTarget.x, savedTarget.y, savedTarget.z);

        controls.update();

        return controls;
    }

    resize(width, height) {
        this.renderWidth = width;
        this.renderHeight = height;

        this.camera.aspect = this.renderWidth / this.renderHeight;
        this.camera.updateProjectionMatrix();
    }

    setupEventListeners() {
        // this.controls.addEventListener('change', this.controlsChangeHandler.bind(this));
    }

    controlsChangeHandler() {
        sessionStorage.setItem('cameraPosition', JSON.stringify(this.camera.position));
        sessionStorage.setItem('cameraTarget', JSON.stringify(this.controls.target));
    }

    /**
     * Debug
     */
    createDebugFolder() {
        if (!this.debugger) return;

        const cameraChangedHandler = () => {
            this.camera.updateProjectionMatrix();
        };

        const cameraFolder = this.debugger.addFolder({ title: 'Camera' });

        cameraFolder.addBinding(this.camera, 'fov', { min: 15, max: 100 }).on('change', cameraChangedHandler);
        cameraFolder.addBinding(this.camera, 'near', { min: 0.00001, max: 10 }).on('change', cameraChangedHandler);
        cameraFolder.addBinding(this.camera, 'far', { min: 1, max: 1000 }).on('change', cameraChangedHandler);
        // cameraFolder.addBinding(this.controls, 'enabled');
        cameraFolder.addButton({ title: 'Reset Camera' }).on('click', () => {
            sessionStorage.removeItem('cameraPosition');
            sessionStorage.removeItem('cameraTarget');
            this.resetCameraPosition();
        });

        return cameraFolder;
    }
}
