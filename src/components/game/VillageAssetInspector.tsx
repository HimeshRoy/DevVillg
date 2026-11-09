
"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

const BASE = "/models/medieval-village/glTF/";

const FILES = [
  "Floor_RedBrick",
  "Wall_UnevenBrick_Straight",
  "Wall_UnevenBrick_Door_Round",
  "Wall_UnevenBrick_Window_Wide_Round",
  "Door_2_Round",
  "Window_Wide_Round1",
  "Roof_RoundTiles_6x6",
  "Roof_Front_Brick8",
];

export default function VillageAssetInspector() {
  const a = useGLTF(`${BASE}${FILES[0]}.gltf`);
  const b = useGLTF(`${BASE}${FILES[1]}.gltf`);
  const c = useGLTF(`${BASE}${FILES[2]}.gltf`);
  const d = useGLTF(`${BASE}${FILES[3]}.gltf`);
  const e = useGLTF(`${BASE}${FILES[4]}.gltf`);
  const f = useGLTF(`${BASE}${FILES[5]}.gltf`);
  const g = useGLTF(`${BASE}${FILES[6]}.gltf`);
  const h = useGLTF(`${BASE}${FILES[7]}.gltf`);

  const models = [a, b, c, d, e, f, g, h];

  const report = useMemo(() => {
    return models.map(({ scene }, index) => {
      scene.updateMatrixWorld(true);

      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());

      return {
        name: FILES[index],
        minX: +bounds.min.x.toFixed(3),
        maxX: +bounds.max.x.toFixed(3),
        minY: +bounds.min.y.toFixed(3),
        maxY: +bounds.max.y.toFixed(3),
        minZ: +bounds.min.z.toFixed(3),
        maxZ: +bounds.max.z.toFixed(3),
        width: +size.x.toFixed(3),
        height: +size.y.toFixed(3),
        depth: +size.z.toFixed(3),
      };
    });
  }, [
    a.scene, b.scene, c.scene, d.scene,
    e.scene, f.scene, g.scene, h.scene,
  ]);

  useEffect(() => {
    console.group("HOUSE 02 — BRICK COTTAGE DIMENSIONS");
    console.table(report);
    console.groupEnd();
  }, [report]);

  return null;
}

FILES.forEach((name) => {
  useGLTF.preload(`${BASE}${name}.gltf`);
});
