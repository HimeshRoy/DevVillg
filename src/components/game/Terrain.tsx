
"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const WORLD_RADIUS = 300;
const WORLD_SIZE = WORLD_RADIUS * 2;
const HALF_SIZE = WORLD_RADIUS;

// Approximately the same terrain detail with far fewer vertices.
const SEGMENTS = 192;

function createMeadowTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;

      const broad =
        Math.sin(u * 2 + Math.cos(v * 2)) * 0.45 +
        Math.cos(v * 3 - u) * 0.3;

      const fine =
        Math.sin(u * 11 + v * 7) * 0.12 +
        Math.cos(v * 13 - u * 5) * 0.08;

      const variation = broad + fine;
      const shade = Math.max(
        220,
        Math.min(252, Math.round(237 + variation * 5)),
      );

      const index = (y * size + x) * 4;

      data[index] = shade;
      data[index + 1] = shade;
      data[index + 2] = shade;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
  );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // Preserve approximately the same texture detail per unit.
  texture.repeat.set(9.6, 9.6);

  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

// Procedural mountain range around the world boundary.
function getMountainProfile(x: number, z: number) {
  const edgeDistance = Math.max(
    Math.abs(x),
    Math.abs(z),
  );

  // Break up the straight boundary into natural-looking ridges.
  const boundaryNoise =
    Math.sin(
      x * 0.035 + Math.cos(z * 0.023) * 1.3,
    ) * 7 +
    Math.cos(
      z * 0.038 - Math.sin(x * 0.025) * 1.2,
    ) * 6;

  const mountainDistance = edgeDistance + boundaryNoise;

  // Meadow transitions into mountain slopes around 230 units.
  const mountainMask = THREE.MathUtils.smoothstep(
    mountainDistance,
    225,
    265,
  );

  // Irregular mountain peaks.
  const peakField =
    0.5 +
    0.22 *
      Math.sin(
        x * 0.06 + Math.sin(z * 0.03) * 1.8,
      ) +
    0.2 *
      Math.cos(
        z * 0.07 - Math.sin(x * 0.025) * 2,
      ) +
    0.08 * Math.sin((x - z) * 0.11);

  const peakShape = Math.pow(
    THREE.MathUtils.clamp(peakField, 0, 1),
    1.45,
  );

  const broadVariation =
    Math.sin(
      x * 0.02 + Math.cos(z * 0.015) * 1.5,
    ) * 5 +
    Math.cos(
      z * 0.025 - Math.sin(x * 0.018) * 1.4,
    ) * 5;

  // Large mountain peaks.
  const height =
    mountainMask *
    (28 + peakShape * 105 + broadVariation);

  return {
    height: Math.max(0, height),
    mask: mountainMask,
  };
}

export default function Terrain() {
  const texture = useMemo(
    () => createMeadowTexture(),
    [],
  );

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const grassColor = new THREE.Color("#78a85b");
    const rockColor = new THREE.Color("#77766f");
    const snowColor = new THREE.Color("#d8dedb");

    for (let row = 0; row <= SEGMENTS; row++) {
      for (let column = 0; column <= SEGMENTS; column++) {
        const x =
          (column / SEGMENTS) * WORLD_SIZE - HALF_SIZE;

        const z =
          (row / SEGMENTS) * WORLD_SIZE - HALF_SIZE;

        const baseHeight = getTerrainHeight(x, z);
        const mountain = getMountainProfile(x, z);

        const y = baseHeight + mountain.height;

        positions.push(x, y, z);

        uvs.push(
          column / SEGMENTS,
          row / SEGMENTS,
        );

        // Blend meadow grass into rocky mountain material.
        const vertexColor = grassColor.clone().lerp(
          rockColor,
          mountain.mask * 0.96,
        );

        // Snow is restricted to the highest peaks.
        const snowAmount =
          mountain.mask *
          THREE.MathUtils.smoothstep(
            mountain.height,
            105,
            130,
          ) *
          0.65;

        vertexColor.lerp(snowColor, snowAmount);

        colors.push(
          vertexColor.r,
          vertexColor.g,
          vertexColor.b,
        );
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

    terrain.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(uvs, 2),
    );

    terrain.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );

    terrain.setIndex(indices);
    terrain.computeVertexNormals();
    terrain.computeBoundingSphere();

    return terrain;
  }, []);

  return (
    <mesh
      name="terrain-ground"
      geometry={geometry}
      receiveShadow
    >
      <meshStandardMaterial
        map={texture}
        vertexColors
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
