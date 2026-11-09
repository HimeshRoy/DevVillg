"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const FLOWER_MODELS = [
  "/models/nature/glTF/Flower_3_Group.gltf",
  "/models/nature/glTF/Flower_4_Group.gltf",
];

function FlowerPatch({
  path,
  position,
  rotation,
  scale,
}: {
  path: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}) {
  const { scene } = useGLTF(path);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });

    return clone;
  }, [scene]);

  return (
    <primitive
      object={model}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

export default function Flowers() {
  const placements = useMemo(() => {
    let seed = 45678;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    return Array.from({ length: 32 }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = 22 + random() * 45;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      return {
        id: index,
        path: FLOWER_MODELS[index % FLOWER_MODELS.length],
        position: [x, getTerrainHeight(x, z), z] as [number, number, number],
        rotation: random() * Math.PI * 2,
        scale: 0.22 + random() * 0.12,
      };
    });
  }, []);

  return (
    <group>
      {placements.map((flower) => (
        <FlowerPatch key={flower.id} {...flower} />
      ))}
    </group>
  );
}

FLOWER_MODELS.forEach((path) => useGLTF.preload(path));
