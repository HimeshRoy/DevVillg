"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

const BASE = "/models/medieval-village/glTF/";

const FILES = [
  "Floor_Brick",
  "Floor_UnevenBrick",
  "Wall_UnevenBrick_Straight",
  "Wall_UnevenBrick_Door_Flat",
  "Wall_Plaster_WoodGrid",
  "Door_2_Flat",
  "Roof_RoundTiles_8x8",
  "Roof_Front_Brick8",
  "Roof_Log",
  "Roof_FrontSupports",
  "Roof_Support2",
  "Prop_Chimney",
  "Prop_Chimney2",
  "Prop_Crate",
  "Corner_Exterior_Wood",
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
  const i = useGLTF(`${BASE}${FILES[8]}.gltf`);
  const j = useGLTF(`${BASE}${FILES[9]}.gltf`);
  const k = useGLTF(`${BASE}${FILES[10]}.gltf`);
  const l = useGLTF(`${BASE}${FILES[11]}.gltf`);
  const m = useGLTF(`${BASE}${FILES[12]}.gltf`);
  const n = useGLTF(`${BASE}${FILES[13]}.gltf`);
  const o = useGLTF(`${BASE}${FILES[14]}.gltf`);

  const models = [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o];

  const report = useMemo(() => {
    return models.map(({ scene }, index) => {
      scene.updateMatrixWorld(true);

      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());

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
        centerY: +center.y.toFixed(3),
      };
    });
  }, [
    a.scene,
    b.scene,
    c.scene,
    d.scene,
    e.scene,
    f.scene,
    g.scene,
    h.scene,
    i.scene,
    j.scene,
    k.scene,
    l.scene,
    m.scene,
    n.scene,
    o.scene,
  ]);

  useEffect(() => {
    console.group("HOUSE 04 — BLACKSMITH WORKSHOP DIMENSIONS");
    console.table(report);
    console.groupEnd();
  }, [report]);

  return null;
}

FILES.forEach((name) => {
  useGLTF.preload(`${BASE}${name}.gltf`);
});
