import { WebGLRenderer } from 'three';
import SceneGlobal from './SceneGlobal.js';
import { Pane } from 'tweakpane';

const deltaTime = 1;

export default class WebGLApp {
    constructor(options = {}) {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.renderer = this.createRenderer();
        this.debugger = this.createDebugger();
        this.sceneGlobal = this.createSceneGlobal();
        this.resize();

        this.setupEventListeners();
    }

    createSceneGlobal() {
        const scene = new SceneGlobal({
            renderer: this.renderer,
            debugger: this.debugger,
        });

        return scene;
    }

    createRenderer() {
        const renderer = new WebGLRenderer({
            canvas: document.querySelector('canvas'),
        });

        renderer.setClearColor(0xffffff);

        return renderer;
    }

    resize() {
        this.renderer.setSize(this.renderWidth, this.renderHeight);

        this.sceneGlobal.resize(this.renderWidth, this.renderHeight);
    }

    render() {
        this.renderer.render(this.sceneGlobal, this.sceneGlobal.camera);
    }

    update() {}

    setupEventListeners() {
        window.addEventListener('resize', this.resizeHandler.bind(this));
        this.tickHandler();
    }

    resizeHandler() {
        this.renderWidth = window.innerWidth;
        this.renderHeight = window.innerHeight;

        this.resize();
    }

    tickHandler() {
        window.requestAnimationFrame(this.tickHandler.bind(this));

        this.sceneGlobal.update(deltaTime);
        this.update();
        this.render();
    }

    /**
     * Debug
     */

    createDebugger() {
        const pane = new Pane({ title: 'WebGL App' });

        return pane;
    }
}
