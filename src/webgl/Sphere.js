import { Object3D, SphereGeometry, MeshBasicMaterial, Mesh, MeshPhongMaterial } from 'three';

export default class Sphere extends Object3D {
    constructor(options = {}) {
        super();

        this.radius = options.radius || 1;
        this.mesh = this.createSphereGeometry(1, 0.5, false);
        this.mesh2 = this.createSphereGeometry(0.8, 1, false);
        this.hitMesh = this.createHitMesh();
    }

    createSphereGeometry(radius = 1, opacity = 1, wireframe = false) {
        const geometry = new SphereGeometry(radius, 32, 32);
        const mesh = new Mesh(geometry, this.buildTwistMaterial(0.1, opacity, wireframe));

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

    update(time) {
        [this.mesh, this.mesh2].forEach((mesh) => {
            const shader = mesh.material.userData.shader;

            if (shader) shader.uniforms.time.value = time;
        });

        // this.rotation.y += 0.01;
        // this.rotation.x += 0.01;
        // this.rotation.z += 0.01;
    }

    buildTwistMaterial(amount, opacity, wireframe = false) {
        const material = new MeshPhongMaterial({
            color: 0x60b6df,
            opacity,
            transparent: true,
            depthWrite: false,
            wireframe: wireframe,
        });
        material.onBeforeCompile = function (shader) {
            shader.uniforms.time = { value: 0 };

            shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                [
                    `float theta = sin( time + position.y ) / ${amount.toFixed(1)};`,
                    'float c = cos( theta );',
                    'float s = sin( theta );',
                    'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
                    'vec3 transformed = vec3( position ) * m;',
                    'vNormal = vNormal * m;',
                ].join('\n'),
            );

            material.userData.shader = shader;
        };

        // Make sure WebGLRenderer doesn't reuse a single program

        material.customProgramCacheKey = function () {
            return amount.toFixed(1);
        };

        return material;
    }
}
