
import * as THREE from "three";

import type { createGrassBladeMaterial } from "./grassMaterial";

import { getRiverDistance } from "./terrainHeight";

import {
  HOUSE01,
  HOUSE02,
  HOUSE03,
  HOUSE04,
} from "./houseState";

import { isOnVillageRoad } from "./villageLayout";

type GrassSetup = ReturnType<typeof createGrassBladeMaterial>;

type SurfaceSampler = {
  vertices: number[];
  normals: number[];
  cumulative: number[];
  totalArea: number;
};

function clipPolygon(
  polygon: THREE.Vector3[],
  axis: "x" | "z",
  boundary: number,
  keepGreater: boolean,
) {
  const result: THREE.Vector3[] = [];

  if (!polygon.length) return result;

  const value = (p: THREE.Vector3) => p[axis];

  const inside = (p: THREE.Vector3) =>
    keepGreater
      ? value(p) >= boundary - 1e-7
      : value(p) <= boundary + 1e-7;

  let previous = polygon[polygon.length - 1];
  let previousInside = inside(previous);

  for (const current of polygon) {
    const currentInside = inside(current);

    if (previousInside !== currentInside) {
      const denominator = value(current) - value(previous);

      if (Math.abs(denominator) > 1e-9) {
        const t =
          (boundary - value(previous)) / denominator;

        result.push(previous.clone().lerp(current, t));
      }
    }

    if (currentInside) {
      result.push(current.clone());
    }

    previous = current;
    previousInside = currentInside;
  }

  return result;
}

function buildChunkSampler(
  mesh: THREE.Mesh,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): SurfaceSampler {
  const geometry = mesh.geometry;

  const positions = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;

  const index = geometry.index;

  geometry.computeBoundingBox();
  mesh.updateWorldMatrix(true, false);

  const bounds = geometry.boundingBox!;

  const segments =
    Math.round(Math.sqrt(positions.count)) - 1;

  const rowLength = segments + 1;

  if (segments < 1 || bounds.isEmpty()) {
    return {
      vertices: [],
      normals: [],
      cumulative: [],
      totalArea: 0,
    };
  }

  const sizeX = bounds.max.x - bounds.min.x;
  const sizeZ = bounds.max.z - bounds.min.z;

  const clampCell = (n: number) =>
    Math.max(0, Math.min(segments - 1, n));

  const minColumn = clampCell(
    Math.floor(
      ((minX - bounds.min.x) / sizeX) * segments,
    ) - 1,
  );

  const maxColumn = clampCell(
    Math.ceil(
      ((maxX - bounds.min.x) / sizeX) * segments,
    ) + 1,
  );

  const minRow = clampCell(
    Math.floor(
      ((minZ - bounds.min.z) / sizeZ) * segments,
    ) - 1,
  );

  const maxRow = clampCell(
    Math.ceil(
      ((maxZ - bounds.min.z) / sizeZ) * segments,
    ) + 1,
  );

  const sampler: SurfaceSampler = {
    vertices: [],
    normals: [],
    cumulative: [],
    totalArea: 0,
  };

  const addTriangle = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
  ) => {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);

    const normal = new THREE.Vector3().crossVectors(ab, ac);

    const area = normal.length() * 0.5;

    if (area < 1e-8) return;

    normal.normalize();

    if (normal.y < 0) normal.negate();

    sampler.totalArea += area;

    sampler.cumulative.push(sampler.totalArea);

    sampler.vertices.push(
      a.x, a.y, a.z,
      b.x, b.y, b.z,
      c.x, c.y, c.z,
    );

    sampler.normals.push(
      normal.x,
      normal.y,
      normal.z,
    );
  };

  const addClippedPolygon = (polygon: THREE.Vector3[]) => {
    if (polygon.length < 3) return;

    for (let i = 1; i < polygon.length - 1; i++) {
      addTriangle(
        polygon[0],
        polygon[i],
        polygon[i + 1],
      );
    }
  };

  const toWorld = (i: number) =>
    new THREE.Vector3()
      .fromBufferAttribute(positions, i)
      .applyMatrix4(mesh.matrixWorld);

  for (let row = minRow; row <= maxRow; row++) {
    for (
      let column = minColumn;
      column <= maxColumn;
      column++
    ) {
      const cell = row * segments + column;
      const base = cell * 6;

      const a = row * rowLength + column;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;

      const triangles = index
        ? [
            [
              index.getX(base),
              index.getX(base + 1),
              index.getX(base + 2),
            ],
            [
              index.getX(base + 3),
              index.getX(base + 4),
              index.getX(base + 5),
            ],
          ]
        : [
            [a, c, b],
            [b, c, d],
          ];

      for (const ids of triangles) {
        let polygon = ids.map(toWorld);

        polygon = clipPolygon(
          polygon,
          "x",
          minX,
          true,
        );

        polygon = clipPolygon(
          polygon,
          "x",
          maxX,
          false,
        );

        polygon = clipPolygon(
          polygon,
          "z",
          minZ,
          true,
        );

        polygon = clipPolygon(
          polygon,
          "z",
          maxZ,
          false,
        );

        addClippedPolygon(polygon);
      }
    }
  }

  return sampler;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state =
      (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
}

function samplePoint(
  sampler: SurfaceSampler,
  random: () => number,
  point: THREE.Vector3,
  normal: THREE.Vector3,
) {
  const target = random() * sampler.totalArea;

  let low = 0;
  let high = sampler.cumulative.length - 1;

  while (low < high) {
    const middle = (low + high) >> 1;

    if (sampler.cumulative[middle] < target) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const offset = low * 9;

  let u = random();
  let v = random();

  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }

  const w = 1 - u - v;
  const values = sampler.vertices;

  point.set(
    values[offset] * w +
      values[offset + 3] * u +
      values[offset + 6] * v,

    values[offset + 1] * w +
      values[offset + 4] * u +
      values[offset + 7] * v,

    values[offset + 2] * w +
      values[offset + 5] * u +
      values[offset + 8] * v,
  );

  normal.fromArray(
    sampler.normals,
    low * 3,
  );
}

export function createGrassChunk(
  terrain: THREE.Mesh,
  setup: GrassSetup,
  chunkX: number,
  chunkZ: number,
  density = 8,
  maximum = 4500,
) {
  const CHUNK_SIZE = 24;

  const minX =
    chunkX * CHUNK_SIZE - CHUNK_SIZE / 2;

  const maxX = minX + CHUNK_SIZE;

  const minZ =
    chunkZ * CHUNK_SIZE - CHUNK_SIZE / 2;

  const maxZ = minZ + CHUNK_SIZE;

  const sampler = buildChunkSampler(
    terrain,
    minX,
    maxX,
    minZ,
    maxZ,
  );

  if (sampler.totalArea <= 0) return null;

  const count = Math.min(
    Math.round(sampler.totalArea * density),
    maximum,
  );

  if (count <= 0) return null;

  const grass = new THREE.InstancedMesh(
    setup.geometry,
    setup.material,
    count,
  );

  grass.name = `grass-chunk-${chunkX}-${chunkZ}`;

  grass.castShadow = false;
  grass.receiveShadow = false;
  grass.frustumCulled = true;

  grass.instanceMatrix.setUsage(
    THREE.StaticDrawUsage,
  );

  const seed =
    Math.imul(chunkX + 4096, 73856093) ^
    Math.imul(chunkZ + 4096, 19349663);

  const random = seededRandom(seed);

  const dummy = new THREE.Object3D();

  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const up = new THREE.Vector3(0, 1, 0);

  const align = new THREE.Quaternion();
  const yaw = new THREE.Quaternion();

  let activeCount = 0;

  for (let i = 0; i < count; i++) {
    samplePoint(
      sampler,
      random,
      point,
      normal,
    );

    const edgeDistance = Math.max(
      Math.abs(point.x),
      Math.abs(point.z),
    );

    // Keep distant mountain slopes free of meadow grass.
    const outsideMeadow = edgeDistance > 212;

    // River channel and its sandy banks.
    const insideRiver =
      getRiverDistance(point.x, point.z) < 7.2;

    // Building exclusions.
    const insideHouse01 =
      Math.abs(point.x - HOUSE01.x) <
        HOUSE01.halfSize + 1.5 &&
      Math.abs(point.z - HOUSE01.z) <
        HOUSE01.halfSize + 1.5;

    const insideHouse02 =
      Math.abs(point.x - HOUSE02.x) <
        HOUSE02.halfSize + 1.5 &&
      Math.abs(point.z - HOUSE02.z) <
        HOUSE02.halfSize + 1.5;

    const insideHouse03 =
      Math.abs(point.x - HOUSE03.x) <
        HOUSE03.halfSize + 1 &&
      Math.abs(point.z - HOUSE03.z) <
        HOUSE03.halfSize + 1;

    const insideHouse04 =
      Math.abs(point.x - HOUSE04.x) < 6.5 &&
      Math.abs(point.z - HOUSE04.z) < 6.5;

    const insideRoad = isOnVillageRoad(
      point.x,
      point.z,
    );

    if (
      outsideMeadow ||
      insideRiver ||
      insideHouse01 ||
      insideHouse02 ||
      insideHouse03 ||
      insideHouse04 ||
      insideRoad
    ) {
      continue;
    }

    dummy.position
      .copy(point)
      .addScaledVector(normal, 0.005);

    align.setFromUnitVectors(up, normal);

    yaw.setFromAxisAngle(
      up,
      random() * Math.PI * 2,
    );

    dummy.quaternion
      .copy(align)
      .multiply(yaw);

    const width = 0.055 + random() * 0.04;
    const height = 0.17 + random() * 0.14;

    dummy.scale.set(width, height, 1);

    dummy.updateMatrix();

    // Pack only visible grass instances.
    grass.setMatrixAt(
      activeCount,
      dummy.matrix,
    );

    activeCount++;
  }

  if (activeCount === 0) {
    grass.dispose();
    return null;
  }

  // Excluded positions are not rendered at all.
  grass.count = activeCount;

  grass.instanceMatrix.needsUpdate = true;

  grass.computeBoundingSphere();

  return grass;
}
