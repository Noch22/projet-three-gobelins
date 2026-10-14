import { Object3D, SphereGeometry, MeshBasicMaterial, MeshStandardMaterial, Mesh, MeshPhongMaterial } from 'three';

export default class Sphere extends Object3D {
    constructor(options = {}) {
        super();

        this.radius = options.radius || 1;
        this.mesh = this.createSphereGeometry();
        this.mesh2 = this.createSecondarySphereGeometry();
        this.hitMesh = this.createHitMesh();
    }

    createSphereGeometry() {
        const geometry = new SphereGeometry(1, 32, 32);
        const material = new MeshPhongMaterial({ color: 0x60b6df, opacity: 0.5, transparent: true });
        material.opacity = 0.5;
        const mesh = new Mesh(geometry, material);

        this.add(mesh);

        return mesh;
    }

    createSecondarySphereGeometry() {
        const geometry = new SphereGeometry(0.8, 32, 32);
        const material = new MeshPhongMaterial({ color: 0x60b6df });
        material.opacity = 0.5;
        const mesh = new Mesh(geometry, material);

        this.add(mesh);

        return mesh;
    }

    createHitMesh() {
        const material = new MeshBasicMaterial({
            transparent: true,
            opacity: 0,
        });
        const hitMesh = new Mesh(this.mesh.geometry, material);

        this.add(hitMesh);

        return hitMesh;
    }

    setRadius(radius) {
        this.radius = radius;
        this.mesh.scale.setScalar(radius);
        this.mesh2.scale.setScalar(radius);
    }

    update() {
        // this.rotation.y += 0.01;
        // this.rotation.x += 0.01;
        // this.rotation.z += 0.01;
    }
}
