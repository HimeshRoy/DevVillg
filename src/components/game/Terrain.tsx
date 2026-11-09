"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const WORLD_SIZE = 2000;
const SEGMENTS = 600;
const HALF_SIZE = WORLD_SIZE / 2;

function createMeadowTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;

      // Soft, layered natural colour variation.
      const broad =
        Math.sin(u * 2 + Math.cos(v * 2)) * 0.45 + Math.cos(v * 3 - u) * 0.3;

      const fine =
        Math.sin(u * 11 + v * 7) * 0.12 + Math.cos(v * 13 - u * 5) * 0.08;

      const variation = broad + fine;

      const index = (y * size + x) * 4;

      data[index] = 105 + variation * 13;
      data[index + 1] = 157 + variation * 17;
      data[index + 2] = 76 + variation * 10;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 32);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

export default function Terrain() {
  const texture = useMemo(() => createMeadowTexture(), []);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let row = 0; row <= SEGMENTS; row++) {
      for (let column = 0; column <= SEGMENTS; column++) {
        const x = (column / SEGMENTS) * WORLD_SIZE - HALF_SIZE;
        const z = (row / SEGMENTS) * WORLD_SIZE - HALF_SIZE;

        const y = getTerrainHeight(x, z);

        positions.push(x, y, z);
        uvs.push(column / SEGMENTS, row / SEGMENTS);
      }
    }

    const rowLength = SEGMENTS + 1;

    for (let row = 0; row < SEGMENTS; row++) {
      for (let column = 0; column < SEGMENTS; column++) {
        const a = row * rowLength + column;
        const b = a + 1;
        const c = a + rowLength;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const terrain = new THREE.BufferGeometry();

    terrain.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    terrain.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    terrain.setIndex(indices);
    terrain.computeVertexNormals();

    return terrain;
  }, []);

  return (
    <mesh name="terrain-ground" geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}
