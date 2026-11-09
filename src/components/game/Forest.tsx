
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const TREE_COUNT = 24;

function randomGenerator(seed: number) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export default function Forest() {
  const { scene } = useGLTF(
    "/models/nature/glTF/Pine_1.gltf"
  );

  const trees = useMemo(() => {
    const random = randomGenerator(54321);

    return Array.from({ length: TREE_COUNT }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = 22 + random() * 43;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const tree = scene.clone(true);

      tree.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      return {
        id: index,
        tree,
        position: [x, getTerrainHeight(x, z), z] as [
          number,
          number,
          number
        ],
        rotation: random() * Math.PI * 2,
        scale: 0.65 + random() * 0.4,
      };
    });
  }, [scene]);

  return (
    <group>
      {trees.map((item) => (
        <primitive
          key={item.id}
          object={item.tree}
          position={item.position}
          rotation={[0, item.rotation, 0]}
          scale={item.scale}
        />
      ))}
    </group>
  );
}

useGLTF.preload("/models/nature/glTF/Pine_1.gltf");
