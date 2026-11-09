"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const GRASS_COUNT = 26000;
const GRASS_RADIUS = 90;

function randomGenerator(seed: number) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createGrassGeometry() {
  const geometry = new THREE.BufferGeometry();

  // Two crossed triangular blades form one small grass clump.
  const vertices = [
    -0.07, 0, 0, 0.07, 0, 0, 0.025, 0.48, 0,

    0, 0, -0.07, 0, 0, 0.07, 0, 0.48, 0.025,
  ];

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );

  geometry.setIndex([0, 1, 2, 3, 4, 5]);

  geometry.computeVertexNormals();

  return geometry;
}

export default function Grass() {
  const grassRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(createGrassGeometry, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = grassRef.current;
    if (!mesh) return;

    const random = randomGenerator(12345);
    const dummy = new THREE.Object3D();

    const grassColors = [
      new THREE.Color("#56833d"),
      new THREE.Color("#709d49"),
      new THREE.Color("#86aa50"),
      new THREE.Color("#9ab95e"),
      new THREE.Color("#648d43"),
    ];

    for (let i = 0; i < GRASS_COUNT; i++) {
      // Distribute grass naturally around the starting area.
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * GRASS_RADIUS;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Leave the immediate character spawn point clear.
      if (Math.sqrt(x * x + z * z) < 4) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const groundY = getTerrainHeight(x, z);

      dummy.position.set(x, groundY + 0.015, z);

      dummy.rotation.set(0, random() * Math.PI * 2, (random() - 0.5) * 0.12);

      const height = 0.65 + random() * 0.75;
      const width = 0.7 + random() * 0.7;

      dummy.scale.set(width, height, width);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      const color = grassColors[Math.floor(random() * grassColors.length)];

      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <instancedMesh
      ref={grassRef}
      args={[geometry, material, GRASS_COUNT]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={false}
    />
  );
}
