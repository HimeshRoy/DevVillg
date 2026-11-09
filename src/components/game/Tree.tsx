
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

type TreeProps = {
  x?: number;
  z?: number;
  scale?: number;
};

export default function Tree({
  x = 8,
  z = 8,
  scale = 1,
}: TreeProps) {
  const { scene } = useGLTF(
    "/models/nature/glTF/Pine_1.gltf"
  );

  const tree = useMemo(() => {
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
      object={tree}
      position={[x, getTerrainHeight(x, z), z]}
      scale={scale}
    />
  );
}

useGLTF.preload("/models/nature/glTF/Pine_1.gltf");
