"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";

import { HOUSE01, HOUSE02, HOUSE03, HOUSE04 } from "./houseState";

const ROAD_MODEL = "/models/medieval-village/glTF/Floor_UnevenBrick.gltf";

type Placement = {
  x: number;
  z: number;
};

type RoadPart = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  localMatrix: THREE.Matrix4;
};

// Calculate the world position of a house's front door.
function getDoorWorldPosition(house: typeof HOUSE01) {
  const cos = Math.cos(house.rotation);
  const sin = Math.sin(house.rotation);

  return {
    x: house.x + cos * house.doorX + sin * house.halfSize,

    z: house.z - sin * house.doorX + cos * house.halfSize,
  };
}

// Calculate the outward direction from the front entrance.
function addEntrancePath(
  placements: Placement[],
  house: typeof HOUSE01,
  distances: number[],
) {
  const door = getDoorWorldPosition(house);

  const directionX = Math.sin(house.rotation);
  const directionZ = Math.cos(house.rotation);

  distances.forEach((distance) => {
    placements.push({
      x: door.x + directionX * distance,
      z: door.z + directionZ * distance,
    });
  });
}

function isInsideHouse04RoadArea(x: number, z: number) {
  const dx = x - HOUSE04.x;
  const dz = z - HOUSE04.z;

  const cos = Math.cos(HOUSE04.rotation);
  const sin = Math.sin(HOUSE04.rotation);

  const localX = cos * dx - sin * dz;
  const localZ = sin * dx + cos * dz;

  // Include the half-width of the 2-unit road tiles.
  const limit = HOUSE04.halfSize + 1.01;

  return Math.abs(localX) < limit && Math.abs(localZ) < limit;
}

function createRoadPlacements(): Placement[] {
  const placements: Placement[] = [];

  // 1. Main residential street.
  // Skip tiles that overlap the Blacksmith Workshop.
  for (let x = -28; x <= 44; x += 2) {
    if (!isInsideHouse04RoadArea(x, -3)) {
      placements.push({ x, z: -3 });
    }

    if (!isInsideHouse04RoadArea(x, -1)) {
      placements.push({ x, z: -1 });
    }
  }

  // 2. House 01 entrance.
  addEntrancePath(placements, HOUSE01, [1, 3]);

  // 3. House 02 entrance.
  addEntrancePath(placements, HOUSE02, [1, 3]);

  // 4. General Store entrance.
  addEntrancePath(placements, HOUSE03, [1]);

  // 5. Blacksmith Workshop entrance.
  // Three tiles connecting its east-facing door
  // to the western edge of the Village Square.
  addEntrancePath(placements, HOUSE04, [1, 3, 5]);

  // 6. Southern Village Square entrance.
  for (let z = 1; z <= 7; z += 2) {
    placements.push({ x: -1, z });
    placements.push({ x: 1, z });
  }

  // Remove duplicate tile placements.
  const unique = new Map<string, Placement>();

  placements.forEach((tile) => {
    const key = `${tile.x.toFixed(3)},${tile.z.toFixed(3)}`;

    unique.set(key, tile);
  });

  return Array.from(unique.values());
}

const ROAD_PLACEMENTS = createRoadPlacements();

function RoadPartInstances({
  part,
  placements,
}: {
  part: RoadPart;
  placements: Placement[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    const placementMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    placements.forEach((tile, index) => {
      position.set(tile.x, getTerrainHeight(tile.x, tile.z) + 0.025, tile.z);

      placementMatrix.compose(position, rotation, scale);

      finalMatrix.multiplyMatrices(placementMatrix, part.localMatrix);

      mesh.setMatrixAt(index, finalMatrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [part, placements]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[part.geometry, part.material, placements.length]}
      castShadow={false}
      receiveShadow
      frustumCulled={false}
    />
  );
}

export default function VillageRoads() {
  const { scene } = useGLTF(ROAD_MODEL);

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);

    const result: RoadPart[] = [];

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      result.push({
        geometry: object.geometry,
        material: object.material,
        localMatrix: object.matrixWorld.clone(),
      });
    });

    return result;
  }, [scene]);

  return (
    <group name="village-road-network">
      {parts.map((part, index) => (
        <RoadPartInstances
          key={index}
          part={part}
          placements={ROAD_PLACEMENTS}
        />
      ))}
    </group>
  );
}

useGLTF.preload(ROAD_MODEL);
