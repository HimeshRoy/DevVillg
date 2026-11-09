
"use client";

import { useMemo } from "react";
import * as THREE from "three";

import {
  getRiverCenterZ,
  getTerrainHeight,
} from "./terrainHeight";

const LENGTH = 2000;
const SEGMENTS = 800;

// Riverbed extends beneath the water and into both shallow banks.
const OFFSETS = [
  -7, -5.5, -4.5, -3.5, -2.5, -1.5,
  0,
  1.5, 2.5, 3.5, 4.5, 5.5, 7,
];

function createRiverbedGeometry() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const darkGravel = new THREE.Color("#625d50");
  const gravel = new THREE.Color("#81745e");
  const sand = new THREE.Color("#a18a68");
  const bank = new THREE.Color("#857455");

  for (let i = 0; i <= SEGMENTS; i++) {
    const x = -LENGTH / 2 + (i / SEGMENTS) * LENGTH;

    const centerZ = getRiverCenterZ(x);

    const slope =
      (getRiverCenterZ(x + 0.5) -
        getRiverCenterZ(x - 0.5)) / 1;

    const directionLength = Math.sqrt(1 + slope * slope);

    const perpX = -slope / directionLength;
    const perpZ = 1 / directionLength;

    for (let j = 0; j < OFFSETS.length; j++) {
      const offset = OFFSETS[j];

      const worldX = x + perpX * offset;
      const worldZ = centerZ + perpZ * offset;

      const worldY = getTerrainHeight(worldX, worldZ) + 0.025;

      positions.push(worldX, worldY, worldZ);

      const distance = Math.abs(offset);

      const baseColor = new THREE.Color();

      if (distance < 2.5) {
        baseColor.copy(darkGravel).lerp(
          gravel,
          distance / 2.5
        );
      } else if (distance < 4.5) {
        baseColor.copy(gravel).lerp(
          sand,
          (distance - 2.5) / 2
        );
      } else {
        baseColor.copy(sand).lerp(
          bank,
          (distance - 4.5) / 2.5
        );
      }

      // Subtle natural gravel variation.
      const variation =
        Math.sin(x * 0.83 + offset * 3.7) *
        Math.cos(x * 0.31 - offset * 2.1) *
        0.055;

      baseColor.multiplyScalar(1 + variation);

      colors.push(
        baseColor.r,
        baseColor.g,
        baseColor.b
      );
    }
  }

  const columns = OFFSETS.length;

  for (let i = 0; i < SEGMENTS; i++) {
    for (let j = 0; j < columns - 1; j++) {
      const a = i * columns + j;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

export default function Riverbed() {
  const geometry = useMemo(
    () => createRiverbedGeometry(),
    []
  );

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      castShadow={false}
      renderOrder={0}
    >
      <meshStandardMaterial
        vertexColors
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
