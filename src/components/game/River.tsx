"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getRiverCenterZ, getRiverSurfaceHeight } from "./terrainHeight";

// Adapted from:
// https://github.com/cortiz2894/stylized-components
// Original project: MIT License,
// Copyright (c) 2026 Christian Ortiz.

const RIVER_LENGTH = 400;
const HALF_WIDTH = 4;
const SEGMENTS = 200;

function createRiverGeometry() {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const x = -RIVER_LENGTH / 2 + (i / SEGMENTS) * RIVER_LENGTH;

    const centerZ = getRiverCenterZ(x);
    const waterY = getRiverSurfaceHeight(x) + 0.025;

    // Calculate the perpendicular direction of the river.
    const previousZ = getRiverCenterZ(x - 0.5);
    const nextZ = getRiverCenterZ(x + 0.5);

    const slope = nextZ - previousZ;

    const length = Math.sqrt(1 + slope * slope);

    const perpendicularX = -slope / length;
    const perpendicularZ = 1 / length;

    // Two vertices create the left and right river banks.
    for (const side of [-1, 1]) {
      const offset = side * HALF_WIDTH;

      positions.push(
        x + perpendicularX * offset,
        waterY,
        centerZ + perpendicularZ * offset,
      );
    }
  }

  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    vWorldPos = worldPos.xz;

    gl_Position =
      projectionMatrix *
      viewMatrix *
      worldPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uSmoothness;
  uniform float uEdgeThreshold;
  uniform float uEdgeSoftness;
  uniform float uFlowX;
  uniform float uFlowZ;
  uniform float uCellSpeed;
  uniform float uDistortAmount;

  uniform vec3 uDeepColor;
  uniform vec3 uMidColor;
  uniform vec3 uHighlightColor;

  varying vec2 vWorldPos;

  vec2 hash2(vec2 p) {
    p = vec2(
      dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3))
    );

    return fract(sin(p) * 43758.5453);
  }

  float smoothMin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;

    return min(a, b) - h * h * h * k / 6.0;
  }

  vec2 cellPoint(vec2 seed) {
    return 0.5 + 0.5 * sin(
      uTime * uCellSpeed + 6.2831 * seed
    );
  }

  float voronoiF1(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float minimumDistance = 8.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 n = vec2(float(x), float(y));

        vec2 point = cellPoint(hash2(i + n));

        minimumDistance = min(
          minimumDistance,
          length(n + point - f)
        );
      }
    }

    return minimumDistance;
  }

  float voronoiSmoothF1(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float result = 8.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 n = vec2(float(x), float(y));

        vec2 point = cellPoint(hash2(i + n));

        result = smoothMin(
          result,
          length(n + point - f),
          uSmoothness
        );
      }
    }

    return result;
  }

  float hashNoise(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);

    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        hashNoise(i),
        hashNoise(i + vec2(1.0, 0.0)),
        f.x
      ),
      mix(
        hashNoise(i + vec2(0.0, 1.0)),
        hashNoise(i + vec2(1.0, 1.0)),
        f.x
      ),
      f.y
    );
  }

  void main() {
    // Natural flowing distortion.
    float noiseValue = noise(
      vWorldPos * 0.8 +
      vec2(uTime * 0.12, 0.0)
    );

    vec2 distortion =
      vec2(noiseValue - 0.5) * uDistortAmount;

    // Water pattern travels along the river.
    vec2 uv =
      vWorldPos * uScale +
      vec2(uFlowX, uFlowZ) * uTime +
      distortion;

    float f1 = voronoiF1(uv);
    float sf1 = voronoiSmoothF1(uv);

    float edge = f1 - sf1;

    float t = smoothstep(
      uEdgeThreshold - uEdgeSoftness,
      uEdgeThreshold + uEdgeSoftness,
      edge
    );

    // Three-colour stylized water.
    vec3 waterColor = mix(
      uDeepColor,
      uMidColor,
      smoothstep(0.0, 0.8, t)
    );

    float highlights = smoothstep(0.48, 0.95, t);

    waterColor = mix(
      waterColor,
      uHighlightColor,
      highlights * 0.48
    );

    // Subtle flowing shimmer.
    float shimmer = noise(
      uv * 2.0 + vec2(uTime * 0.25, 0.0)
    );

    waterColor += shimmer * 0.035;

    gl_FragColor = vec4(waterColor, 0.82);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function River() {
  const geometry = useMemo(() => createRiverGeometry(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },

          uScale: { value: 0.3 },
          uSmoothness: { value: 0.55 },

          uEdgeThreshold: { value: 0.075 },
          uEdgeSoftness: { value: 0.035 },

          uFlowX: { value: 0.09 },
          uFlowZ: { value: 0.018 },

          uCellSpeed: { value: 0.35 },
          uDistortAmount: { value: 0.2 },

          uDeepColor: {
            value: new THREE.Color("#17618b"),
          },

          uMidColor: {
            value: new THREE.Color("#45afd0"),
          },

          uHighlightColor: {
            value: new THREE.Color("#d5f6ff"),
          },
        },
      }),
    [],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      name="village-river"
      geometry={geometry}
      material={material}
      receiveShadow={false}
      castShadow={false}
      renderOrder={1}
    />
  );
}
