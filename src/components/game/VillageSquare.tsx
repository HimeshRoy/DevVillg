
"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";

const ROAD_MODEL =
  "/models/medieval-village/glTF/Floor_UnevenBrick.gltf";

// Plaza: 24 × 20 units.
// Centre: (0, 18).
const PLAZA_X = 0;
const PLAZA_Z = 18;

const COLUMNS = 12;
const ROWS = 10;

type Tile = {
  x: number;
  z: number;
};

type Part = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  localMatrix: THREE.Matrix4;
};

function createPlazaTiles(): Tile[] {
  const result: Tile[] = [];

  // Main square: 12 columns × 10 rows.
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      result.push({
        x: PLAZA_X - 11 + column * 2,
        z: PLAZA_Z - 9 + row * 2,
      });
    }
  }

  // Four-unit-wide entrance connecting to the main street.
  for (let z = 1; z <= 7; z += 2) {
    result.push({ x: -1, z });
    result.push({ x: 1, z });
  }

  return result;
}

const PLAZA_TILES = createPlazaTiles();

function PlazaPart({
  part,
  tiles,
}: {
  part: Part;
  tiles: Tile[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    const placement = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    tiles.forEach((tile, index) => {
      position.set(
        tile.x,
        getTerrainHeight(tile.x, tile.z) + 0.035,
        tile.z
      );

      placement.compose(position, rotation, scale);

      finalMatrix.multiplyMatrices(
        placement,
        part.localMatrix
      );

      mesh.setMatrixAt(index, finalMatrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [part, tiles]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        part.geometry,
        part.material,
        tiles.length,
      ]}
      castShadow={false}
      receiveShadow={true}
      frustumCulled={false}
    />
  );
}

export default function VillageSquare() {
  const { scene } = useGLTF(ROAD_MODEL);

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);

    const result: Part[] = [];

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
    <group name="village-square">
      {parts.map((part, index) => (
        <PlazaPart
          key={index}
          part={part}
          tiles={PLAZA_TILES}
        />
      ))}
    </group>
  );
}

useGLTF.preload(ROAD_MODEL);
