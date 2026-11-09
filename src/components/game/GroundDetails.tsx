"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const MODELS = [
  "/models/nature/glTF/Mushroom_Common.gltf",
  "/models/nature/glTF/Mushroom_Laetiporus.gltf",
  "/models/nature/glTF/Clover_1.gltf",
  "/models/nature/glTF/Clover_2.gltf",
];

function Detail({
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

  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <primitive
      object={model}
      position={[x, getTerrainHeight(x, z), z]}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

export default function GroundDetails() {
  const details = useMemo(() => {
    let seed = 24681;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    return Array.from({ length: 65 }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = 20 + random() * 55;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const modelIndex = index % MODELS.length;
      const isMushroom = modelIndex < 2;

      return {
        id: index,
        path: MODELS[modelIndex],
        x,
        z,
        rotation: random() * Math.PI * 2,
        scale: isMushroom ? 0.4 + random() * 0.2 : 0.35 + random() * 0.2,
      };
    });
  }, []);

  return (
    <group>
      {details.map((detail) => (
        <Detail key={detail.id} {...detail} />
      ))}
    </group>
  );
}

MODELS.forEach((path) => useGLTF.preload(path));
