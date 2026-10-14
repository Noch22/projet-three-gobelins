import { AmbientLight, DirectionalLight, DirectionalLightHelper } from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';

export default class LightsManager {
    constructor(options = {}) {
        this.scene = options.scene;
        this.renderer = options.renderer;
        this.debugger = options.debugger;
        this.cameraManager = options.cameraManager;

        this.settings = {
            helper: false,
        };

        this.ambient = this.createAmbient();
        this.directional = this.createDirectional();

        this.debugFolder = this.createDebugFolder();

        this.setupEventListeners();
    }

    createAmbient() {
        const ambient = new AmbientLight(0xffffff, 1.5);

        this.scene.add(ambient);

        return ambient;
    }

    createDirectional() {
        const directional = new DirectionalLight(0x18e1ff, 2);
        directional.position.set(10, 10, 5);
        directional.target.position.set(0, 0, 0);

        directional.helper = new DirectionalLightHelper(directional, 1, 0xff0000);
        directional.controls = new TransformControls(this.cameraManager.camera, this.renderer.domElement);

        this.scene.add(directional.controls.getHelper());

        this.scene.add(directional);
        this.scene.add(directional.helper);

        if (this.settings.helper) directional.controls.attach(directional);
        if (!this.settings.helper) directional.helper.visible = false;

        return directional;
    }

    /**
     * Events
     */
    setupEventListeners() {
        this.directional.controls.addEventListener('change', this.lightControlsChangeHandler.bind(this));
        this.directional.controls.addEventListener('mouseDown', this.lightControlsMouseDownHandler.bind(this));
        this.directional.controls.addEventListener('mouseUp', this.lightControlsMouseUpHandler.bind(this));
    }

    lightControlsChangeHandler() {
        this.directional.target.position.set(0, 0, 0);
        this.directional.helper.update();
    }

    lightControlsMouseDownHandler() {
        this.cameraManager.controls.enabled = false;
    }

    lightControlsMouseUpHandler() {
        this.cameraManager.controls.enabled = true;
    }

    /**
     * Debug
     */
    createDebugFolder() {
        if (!this.debugger) return;

        const lightsFolder = this.debugger.addFolder({ title: 'Lights' });

        console.log(this.directional.controls);

        lightsFolder.addBinding(this.ambient, 'color', { label: 'Ambient Color' });
        lightsFolder.addBinding(this.ambient, 'intensity', { label: 'Ambient Intensity' });
        lightsFolder.addBinding(this.directional, 'color', { label: 'Directional Color' });
        lightsFolder.addBinding(this.directional, 'intensity', { label: 'Directional Intensity' });
        lightsFolder.addBinding(this.settings, 'helper', { label: 'Helper' }).on('change', () => {
            if (this.settings.helper) {
                this.directional.controls.attach(this.directional);
                this.directional.helper.visible = true;
            } else {
                this.directional.controls.detach();
                this.directional.helper.visible = false;
            }
        });

        return lightsFolder;
    }
}
