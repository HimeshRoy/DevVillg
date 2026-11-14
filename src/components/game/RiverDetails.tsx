
"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  getRiverCenterZ,
  getTerrainHeight,
} from "./terrainHeight";

// Quaternius Stylized Nature MegaKit.
const BASE = "/models/nature/glTF/";

const ASSETS = [
  "Pebble_Round_1",
  "Pebble_Round_2",
  "Pebble_Round_3",
  "Pebble_Round_4",
  "Pebble_Round_5",
  "Pebble_Square_1",
  "Pebble_Square_2",
  "Pebble_Square_3",
  "Fern_1",
  "Plant_1",
  "Plant_7",
  "Bush_Common",
  "Bush_Common_Flowers",
];

type Placement = {
  x: number;
  z: number;
  scale: number;
  rotation: number;
};

type Part = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  matrix: THREE.Matrix4;
};

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function getBankPosition(
  x: number,
  side: number,
  distance: number
) {
  const slope =
    getRiverCenterZ(x + 0.5) -
    getRiverCenterZ(x - 0.5);

  const length = Math.sqrt(1 + slope * slope);

  return {
    x: x - (slope / length) * distance * side,
    z:
      getRiverCenterZ(x) +
      (1 / length) * distance * side,
  };
}

function createPlacements() {
  const result: Record<string, Placement[]> = {};

  ASSETS.forEach((name) => {
    result[name] = [];
  });

  let seed = 17391;

  const rand = () => random(seed++);

  function add(
    name: string,
    x: number,
    side: number,
    distance: number,
    scale: number
  ) {
    const position = getBankPosition(
      x,
      side,
      distance
    );

    result[name].push({
      x: position.x,
      z: position.z,
      scale,
      rotation: rand() * Math.PI * 2,
    });
  }

  // Generates irregular clusters rather than evenly spaced rows.
  function scatterClusters(
    names: string[],
    clusterCount: number,
    minPerCluster: number,
    maxPerCluster: number,
    minDistance: number,
    maxDistance: number,
    minScale: number,
    maxScale: number,
    spread: number
  ) {
    for (const side of [-1, 1]) {
      for (let cluster = 0; cluster < clusterCount; cluster++) {
        const centerX = -175 + rand() * 350;
        const clusterDistance =
          minDistance +
          rand() * (maxDistance - minDistance);

        const count =
          minPerCluster +
          Math.floor(rand() * (maxPerCluster - minPerCluster + 1));

        // Some clusters deliberately have fewer objects.
        if (rand() < 0.14) continue;

        for (let i = 0; i < count; i++) {
          const name = names[
            Math.floor(rand() * names.length)
          ];

          const x = centerX + (rand() - 0.5) * spread;
          const distance =
            clusterDistance + (rand() - 0.5) * 1.6;

          const scale =
            minScale + rand() * (maxScale - minScale);

          add(name, x, side, distance, scale);
        }
      }
    }
  }

  // Rounded and angular stones: loose groups close to the water.
  scatterClusters(
    [
      "Pebble_Round_1",
      "Pebble_Round_2",
      "Pebble_Round_3",
      "Pebble_Round_4",
      "Pebble_Round_5",
      "Pebble_Square_1",
      "Pebble_Square_2",
      "Pebble_Square_3",
    ],
    85, 2, 5, 4.5, 6.7, 0.22, 0.55, 10
  );

  // Tiny companions around selected stone groups.
  scatterClusters(
    ["Pebble_Round_2", "Pebble_Round_4", "Pebble_Round_5"],
    45, 2, 4, 5.2, 7.4, 0.12, 0.26, 7
  );

  // Wild plants: uneven patches rather than a continuous border.
  scatterClusters(
    ["Plant_1", "Plant_7"],
    42, 2, 5, 7.0, 10.5, 0.45, 0.82, 15
  );

  // Ferns create larger leafy groups.
  scatterClusters(
    ["Fern_1"],
    25, 1, 3, 8.0, 12.5, 0.5, 0.85, 18
  );

  // Bushes sit farther from the immediate shoreline.
  scatterClusters(
    ["Bush_Common", "Bush_Common_Flowers"],
    20, 1, 3, 12.0, 18.0, 0.55, 0.95, 24
  );

  return result;
}

const PLACEMENTS = createPlacements();

function InstancedPart({
  part,
  placements,
  modelMinY,
}: {
  part: Part;
  placements: Placement[];
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

    placements.forEach((item, index) => {
      position.set(
        item.x,
        getTerrainHeight(item.x, item.z) -
          modelMinY * item.scale +
          0.025,
        item.z
      );

      rotation.setFromAxisAngle(up, item.rotation);
      scale.setScalar(item.scale);

      placementMatrix.compose(
        position,
        rotation,
        scale
      );

      finalMatrix.multiplyMatrices(
        placementMatrix,
        part.matrix
      );

      mesh.setMatrixAt(index, finalMatrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, part, modelMinY]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[
        part.geometry,
        part.material,
        placements.length,
      ]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={true}
    />
  );
}

function RiverAsset({
  name,
  placements,
}: {
  name: string;
  placements: Placement[];
}) {
  const { scene } = useGLTF(`${BASE}${name}.gltf`);

  const model = useMemo(() => {
    scene.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(scene);

    const parts: Part[] = [];

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
        <InstancedPart
          key={index}
          part={part}
          placements={placements}
          modelMinY={model.minY}
        />
      ))}
    </group>
  );
}

export default function RiverDetails() {
  return (
    <group name="riverbank-details">
      {ASSETS.map((name) => (
        <RiverAsset
          key={name}
          name={name}
          placements={PLACEMENTS[name]}
        />
      ))}
    </group>
  );
}

ASSETS.forEach((name) => {
  useGLTF.preload(`${BASE}${name}.gltf`);
});
