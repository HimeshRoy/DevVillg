
import * as THREE from "three";

// Adapted from:
// https://github.com/cortiz2894/stylized-components
// Original project: MIT License, Copyright (c) 2026 Christian Ortiz.

export function createGrassBladeGeometry(segments = 3) {
  const seg = Math.max(1, Math.round(segments));

  const positions = new Float32Array((seg * 2 + 1) * 3);

  for (let i = 0; i < seg; i++) {
    const t = i / seg;
    const width = 0.5 * Math.pow(1 - t, 1.2);

    positions[i * 6] = -width;
    positions[i * 6 + 1] = t;

    positions[i * 6 + 3] = width;
    positions[i * 6 + 4] = t;
  }

  positions[seg * 6 + 1] = 1;

  const indices: number[] = [];

  for (let i = 0; i < seg - 1; i++) {
    const left = i * 2;
    const right = left + 1;
    const nextLeft = left + 2;
    const nextRight = left + 3;

    indices.push(
      left, nextLeft, right,
      right, nextLeft, nextRight
    );
  }

  const lastLeft = (seg - 1) * 2;

  indices.push(lastLeft, seg * 2, lastLeft + 1);

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createGrassBladeMaterial() {
  const uniforms = {
    uTime: { value: 0 },

    uWindDirection: {
      value: new THREE.Vector2(1, 0),
    },

    uWindStrength: { value: 0.12 },
    uWindSpeed: { value: 1.2 },
    uWindFrequency: { value: 0.4 },

    uGrassBottom: {
      value: new THREE.Color("#4f7c13"),
    },

    uGrassTop: {
      value: new THREE.Color("#79a01c"),
    },

    uBrightness: { value: 0.9 },
  };

  const material = new THREE.MeshLambertMaterial({
    color: "#ffffff",
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `
      #include <common>

      uniform float uTime;
      uniform vec2 uWindDirection;
      uniform float uWindStrength;
      uniform float uWindSpeed;
      uniform float uWindFrequency;

      varying float vBladeHeight;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
      #include <begin_vertex>

      vBladeHeight = position.y;

      float heightMask = position.y * position.y;

      vec3 baseWorld = (
        modelMatrix * instanceMatrix *
        vec4(0.0, 0.0, 0.0, 1.0)
      ).xyz;

      float wave = sin(
        dot(baseWorld.xz, uWindDirection) * uWindFrequency
        + uTime * uWindSpeed
      );

      mat3 instanceRotation = mat3(
        normalize(vec3(instanceMatrix[0])),
        normalize(vec3(instanceMatrix[1])),
        normalize(vec3(instanceMatrix[2]))
      );

      vec3 windLocal = transpose(instanceRotation) *
        vec3(uWindDirection.x, 0.0, uWindDirection.y);

      transformed += windLocal *
        wave * uWindStrength * heightMask;
      `
    );

    // Consistent upward lighting across all blades.
    shader.vertexShader = shader.vertexShader.replace(
      "#include <defaultnormal_vertex>",
      `
      #include <defaultnormal_vertex>

      transformedNormal = normalize(
        mat3(viewMatrix) * vec3(0.0, 1.0, 0.0)
      );
      `
    );

    shader.fragmentShader = `
      varying float vBladeHeight;

      uniform vec3 uGrassBottom;
      uniform vec3 uGrassTop;
      uniform float uBrightness;

      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      `
      #include <normal_fragment_begin>

      normal = normalize(
        mat3(viewMatrix) * vec3(0.0, 1.0, 0.0)
      );
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 diffuseColor = vec4( diffuse, opacity );",
      `
      float gradient = pow(
        clamp(vBladeHeight, 0.0, 1.0),
        1.6
      );

      vec3 grassColor = mix(
        uGrassBottom,
        uGrassTop,
        gradient
      );

      vec4 diffuseColor = vec4(
        grassColor * uBrightness,
        opacity
      );
      `
    );
  };

  return {
    geometry: createGrassBladeGeometry(3),
    material,
    uniforms,
  };
}
