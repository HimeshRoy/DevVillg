"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const MODELS = [
  "/models/nature/glTF/Bush_Common.gltf",
  "/models/nature/glTF/Bush_Common_Flowers.gltf",
  "/models/nature/glTF/Fern_1.gltf",
];

function Plant({
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

export default function Vegetation() {
  const plants = useMemo(() => {
    const random = (() => {
      let seed = 76543;

      return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    })();

    const clusters = [
      [-29, -23],
      [30, -40],
      [-42, 39],
      [49, 26],
      [-55, -5],
      [55, -12],
    ];

    return Array.from({ length: 30 }, (_, index) => {
      const cluster = clusters[index % clusters.length];

      const x = cluster[0] + (random() - 0.5) * 12;
      const z = cluster[1] + (random() - 0.5) * 12;

      const modelIndex = index % MODELS.length;

      return {
        id: index,
        path: MODELS[modelIndex],
        x,
        z,
        rotation: random() * Math.PI * 2,
        scale: modelIndex === 2 ? 0.2 + random() * 0.12 : 0.3 + random() * 0.15,
      };
    });
  }, []);

  return (
    <group>
      {plants.map((plant) => (
        <Plant key={plant.id} {...plant} />
      ))}
    </group>
  );
}

MODELS.forEach((path) => useGLTF.preload(path));
