"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getRiverCenterZ, getTerrainHeight } from "./terrainHeight";

// Quaternius Stylized Nature MegaKit
const BASE = "/models/nature/glTF/";

const TREE_NAMES = [
  "CommonTree_1",
  "CommonTree_2",
  "CommonTree_3",
  "CommonTree_4",
  "CommonTree_5",
];

type TreePlacement = {
  x: number;
  z: number;
  scale: number;
  rotation: number;
};

type TreePart = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  matrix: THREE.Matrix4;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getBankPosition(x: number, side: number, distance: number) {
  const slope = getRiverCenterZ(x + 0.5) - getRiverCenterZ(x - 0.5);

  const length = Math.sqrt(1 + slope * slope);

  return {
    x: x - (slope / length) * distance * side,
    z: getRiverCenterZ(x) + (1 / length) * distance * side,
  };
}

function createTreePlacements() {
  const result: Record<string, TreePlacement[]> = {};

  TREE_NAMES.forEach((name) => {
    result[name] = [];
  });

  const random = seededRandom(824615);

  // Natural clusters on both sides of the river.
  for (const side of [-1, 1]) {
    for (let cluster = 0; cluster < 12; cluster++) {
      const centerX = -180 + random() * 360;
      const centerDistance = 20 + random() * 27;

      const treeCount = 2 + Math.floor(random() * 3);

      for (let i = 0; i < treeCount; i++) {
        // Pick a different tree variety.
        const type = Math.floor(random() * TREE_NAMES.length);
        const name = TREE_NAMES[type];

        // Irregular cluster placement.
        const x = centerX + (random() - 0.5) * 27;

        const distance = centerDistance + (random() - 0.5) * 13;

        const position = getBankPosition(x, side, distance);

        result[name].push({
          x: position.x,
          z: position.z,
          scale: 0.85 + random() * 0.55,
          rotation: random() * Math.PI * 2,
        });
      }
    }
  }

  return result;
}

const TREE_PLACEMENTS = createTreePlacements();

function TreePart({
  part,
  placements,
  modelMinY,
}: {
  part: TreePart;
  placements: TreePlacement[];
  modelMinY: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const up = new THREE.Vector3(0, 1, 0);

    const placementMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    placements.forEach((tree, index) => {
      position.set(
        tree.x,
        getTerrainHeight(tree.x, tree.z) - modelMinY * tree.scale,
        tree.z,
      );

      rotation.setFromAxisAngle(up, tree.rotation);
      scale.setScalar(tree.scale);

      placementMatrix.compose(position, rotation, scale);

      finalMatrix.multiplyMatrices(placementMatrix, part.matrix);

      mesh.setMatrixAt(index, finalMatrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, part, modelMinY]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[part.geometry, part.material, placements.length]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={true}
    />
  );
}

function TreeAsset({
  name,
  placements,
}: {
  name: string;
  placements: TreePlacement[];
}) {
  const { scene } = useGLTF(`${BASE}${name}.gltf`);

  const model = useMemo(() => {
    scene.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(scene);

    const parts: TreePart[] = [];

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      parts.push({
        geometry: object.geometry,
        material: object.material,
        matrix: object.matrixWorld.clone(),
      });
    });

    return {
      parts,
      minY: bounds.min.y,
    };
  }, [scene]);

  if (placements.length === 0) return null;

  return (
    <group>
      {model.parts.map((part, index) => (
        <TreePart
          key={index}
          part={part}
          placements={placements}
          modelMinY={model.minY}
        />
      ))}
    </group>
  );
}

export default function RiverTrees() {
  return (
    <group name="river-broadleaf-trees">
      {TREE_NAMES.map((name) => (
        <TreeAsset key={name} name={name} placements={TREE_PLACEMENTS[name]} />
      ))}
    </group>
  );
}

TREE_NAMES.forEach((name) => {
  useGLTF.preload(`${BASE}${name}.gltf`);
});
