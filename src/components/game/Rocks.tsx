
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const ROCK_MODELS = [
  "/models/nature/glTF/Rock_Medium_1.gltf",
  "/models/nature/glTF/Rock_Medium_2.gltf",
  "/models/nature/glTF/Rock_Medium_3.gltf",
];

const ROCK_COUNT = 18;

function randomGenerator(seed: number) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function Rock({
  path,
  x,
  z,
  scale,
  rotation,
}: {
  path: string;
  x: number;
  z: number;
  scale: number;
  rotation: number;
}) {
  const { scene } = useGLTF(path);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  return (
    <primitive
      object={model}
      position={[x, getTerrainHeight(x, z), z]}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

export default function Rocks() {
  const placements = useMemo(() => {
    const random = randomGenerator(98765);

    const clusters = [
      [-35, -20],
      [35, -35],
      [-45, 35],
      [45, 30],
    ];

    return Array.from({ length: ROCK_COUNT }, (_, index) => {
      const cluster = clusters[index % clusters.length];

      const x = cluster[0] + (random() - 0.5) * 16;
      const z = cluster[1] + (random() - 0.5) * 16;

      return {
        id: index,
        path: ROCK_MODELS[index % ROCK_MODELS.length],
        x,
        z,
        scale: 0.8 + random() * 1.2,
        rotation: random() * Math.PI * 2,
      };
    });
  }, []);

  return (
    <group>
      {placements.map((rock) => (
        <Rock key={rock.id} {...rock} />
      ))}
    </group>
  );
}

ROCK_MODELS.forEach((path) => useGLTF.preload(path));
