import { Scene, Raycaster, Vector2, PlaneGeometry, Mesh, ShaderMaterial } from 'three';
import LightsManager from './LightsManager';
import CameraManager from './CameraManager';
import Sphere from './Sphere';
import { backgroundFragmentShader, backgroundVertexShader } from './BackgroundShader';
import { gsap } from 'gsap';
import { Howl } from 'howler';

const GRID_SIZE = 21;

export default class SceneGlobal extends Scene {
    constructor(options = {}) {
        super();

        this.json = null;
        this.mode = null;
        this.buttonPressed = false;
        this.isMobile = options.isMobile;
        this.onButtonPressed = options.onButtonPressed;
        this.onAnimationComplete = options.onAnimationComplete;

        this.renderer = options.renderer;
        this.debugger = options.debugger;
        this.sphere = this.createSphere();
        this.raycaster = new Raycaster();
        this.mousePosition = new Vector2();
        this.progressText = document.getElementById('progress-text');
        this.jsonPromise = this.loadJson();
        this.timeline = gsap.timeline({
            repeat: 2,
            onComplete: () => {
                console.log('Timeline has ended!');
                this.onAnimationComplete?.();
                this.progressText.innerText = '';
            },
        });
        // this.debugFolder = this.createDebugFolder();
        this.cameraManager = this.createCameraManager();
        this.lightsManager = this.createLightsManager();
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

        this.add(sphere);

        return sphere;
    }

    createFloor() {
        const geometry = new PlaneGeometry(1, 1, 1);
        const material = new ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: {
                    value: new Vector2(window.innerWidth, window.innerHeight),
                },
            },
            vertexShader: backgroundVertexShader,
            fragmentShader: backgroundFragmentShader,
            depthTest: false,
            depthWrite: false,
        });

        this.floorMaterial = material;
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
        console.log('intersects', intersects);
        this.isPointerDown = true;
        console.log(this.isMobile, this.timeline.isActive());

        if (!this.timeline.isActive() && this.isMobile) {
            this.startAnimation();
            this.buttonPressed = true;
            this.onButtonPressed?.(this.buttonPressed);
        }
    }

    resize(width, height) {
        this.renderWidth = width;
        this.renderHeight = height;

        this.cameraManager.resize(width, height);
        this.floorMaterial.uniforms.iResolution.value.set(width, height);
    }

    resizeHandler(event) {
        this.resize(window.innerWidth, window.innerHeight);
    }

    setupEventListeners() {
        window.addEventListener('pointerdown', this.pointerdownHandler.bind(this));
        window.addEventListener('pointerup', this.pointerupHandler.bind(this));
        window.addEventListener('mousemove', this.mousemoveHandler.bind(this));
    }

    loadJson() {
        return fetch('/paterns.json')
            .then((response) => response.json())
            .then((data) => {
                this.json = data;
                return data;
            });
    }

    setMode(mode) {
        this.mode = mode;
    }

    startAnimation() {
        this.animationStartTime = performance.now();
        if (!this.json) return;
        console.log('Starting animation with mode:', this.mode);

        this.mode = this.mode ?? this.json[1];
        const breath = this.mode.breath;
        const expire = this.mode.expire;
        this.brake = this.mode.brake;
        const breathRaw = this.mode.breath;
        const expireRaw = this.mode.expire;
        const brakeRaw = this.mode.brake;
        const breathSound = new Howl({
            src: ['/breath.m4a'],
            sprite: {
                customStart: [1000, breath * 1000],
            },
        });
        const expireSound = new Howl({
            src: ['/expire.m4a'],
            sprite: {
                customStart: [2500, expire * 1000],
            },
            volume: 2,
        });

        const animationState = {
            radius: this.sphere.radius,
            elapsed: 0,
        };

        const progressBar = document.getElementById('progress-bar');

        const updateProgressText = (step, duration) => {
            const time = performance.now() - this.animationStartTime;

            this.progressText.innerText = `${step} : ${Math.ceil(time / 1000)}s / ${duration}s`;
        };

        this.timeline
            .to(animationState, {
                radius: 2,
                elapsed: breath,
                duration: breath,
                ease: 'power1.inOut',
                onStart: () => {
                    animationState.elapsed = 0;
                    updateProgressText('Inspiration', breathRaw);
                    this.animationStartTime = performance.now();
                    breathSound.play('customStart');
                },
                onUpdate: () => {
                    updateProgressText('Inspiration', breathRaw);
                    this.sphere.setRadius(animationState.radius);
                },
            })
            .to(
                progressBar,
                {
                    width: '100%',
                    duration: breath,
                    ease: 'none',
                },
                '<',
            )
            .to(animationState, {
                radius: 1,
                elapsed: expire,
                duration: expire,
                ease: 'power1.inOut',
                onUpdate: () => {
                    updateProgressText('Expiration', expireRaw);
                    this.sphere.setRadius(animationState.radius);
                },
                onStart: () => {
                    animationState.elapsed = 0;
                    updateProgressText('Expiration', expireRaw);
                    this.animationStartTime = performance.now();
                    expireSound.play('customStart');
                },
            })
            .to(
                progressBar,
                {
                    width: '0%',
                    duration: expire,
                    ease: 'none',
                },
                '<',
            );
        if (brakeRaw > 0) {
            const pauseState = { elapsed: 0 };

            this.timeline.to(pauseState, {
                elapsed: brakeRaw,
                duration: brakeRaw,
                ease: 'none',
                onStart: () => {
                    this.animationStartTime = performance.now();
                    updateProgressText('Pause', brakeRaw);
                },
                onUpdate: () => {
                    updateProgressText('Pause', brakeRaw);
                },
            });
        }
    }

    pointerupHandler(e) {
        console.log('pointerup', e);
        this.isPointerDown = false;
        this.buttonPressed = false;
        this.onButtonPressed?.(this.buttonPressed);
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
        const time = performance.now() / 1000;

        this.sphere.update(time);
        this.floorMaterial.uniforms.iTime.value = time;
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
