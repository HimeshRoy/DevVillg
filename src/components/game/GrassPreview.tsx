
"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { getTerrainHeight } from "./terrainHeight";

export default function GrassPreview() {
  const fbx = useLoader(
    FBXLoader,
    "/models/grass/grass.fbx"
  );

  const grass = useMemo(() => {
    const clone = fbx.clone(true);

    clone.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());

    // Centre the model and place its base at ground level.
    clone.position.set(
      -center.x,
      -bounds.min.y,
      -center.z
    );

    // Normalize preview height to 1.5 units.
    const scale = size.y > 0 ? 1.5 / size.y : 1;
    clone.scale.setScalar(scale);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    return clone;
  }, [fbx]);

  return (
    <primitive
      object={grass}
      position={[
        4,
        getTerrainHeight(4, 0),
        0,
      ]}
    />
  );
}
