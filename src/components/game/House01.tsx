"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";
import { HOUSE01, houseRuntime } from "./houseState";

const BASE = "/models/medieval-village/glTF/";

const WALL_BOTTOM = 0.02;
const WALL_TOP = 3.145;

function makeDoubleSided(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.castShadow = true;
    object.receiveShadow = true;

    const cloneMaterial = (material: THREE.Material) => {
      const cloned = material.clone();
      cloned.side = THREE.DoubleSide;
      cloned.needsUpdate = true;
      return cloned;
    };

    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
  });

  return model;
}

/**
 * Places a modular model by its bounding-box centre in XZ
 * and its bottom in Y. This keeps the GLTF pivots predictable.
 */
function placeModel(
  parent: THREE.Group,
  source: THREE.Object3D,
  x: number,
  z: number,
  bottomY: number,
  rotationY = 0,
  scale = 1,
) {
  const model = makeDoubleSided(source.clone(true));

  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());

  const pivot = new THREE.Group();

  pivot.position.set(x, bottomY - bounds.min.y * scale, z);

  pivot.rotation.y = rotationY;
  pivot.scale.setScalar(scale);

  model.position.x -= center.x;
  model.position.z -= center.z;

  pivot.add(model);
  parent.add(pivot);
}

function DoorLeaf({
  source,
  baseY,
}: {
  source: THREE.Object3D;
  baseY: number;
}) {
  const hingeRef = useRef<THREE.Group>(null);

  const doorModel = useMemo(() => {
    const model = makeDoubleSided(source.clone(true));

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

    // The source door's left X edge becomes its hinge origin.
    model.position.x -= bounds.min.x;
    model.position.y -= bounds.min.y;
    model.position.z -= bounds.getCenter(new THREE.Vector3()).z;

    return {
      model,
      width: size.x,
    };
  }, [source]);

  useFrame((_, delta) => {
    if (!hingeRef.current) return;

    const target = houseRuntime.doorOpen ? Math.PI / 2 : 0;

    hingeRef.current.rotation.y = THREE.MathUtils.damp(
      hingeRef.current.rotation.y,
      target,
      7,
      Math.min(delta, 0.05),
    );
  });

  return (
    <group
      ref={hingeRef}
      position={[
        HOUSE01.x + HOUSE01.doorX - doorModel.width / 2,
        baseY + WALL_BOTTOM,
        HOUSE01.z + HOUSE01.halfSize + 0.05,
      ]}
    >
      <primitive object={doorModel.model} dispose={null} />
    </group>
  );
}

export default function House01() {
  const floor = useGLTF(`${BASE}Floor_Brick.gltf`);
  const wall = useGLTF(`${BASE}Wall_Plaster_Straight.gltf`);

  const doorWall = useGLTF(`${BASE}Wall_Plaster_Door_Flat.gltf`);

  const windowWall = useGLTF(`${BASE}Wall_Plaster_Window_Wide_Flat.gltf`);

  const door = useGLTF(`${BASE}Door_1_Flat.gltf`);
  const window = useGLTF(`${BASE}Window_Wide_Flat1.gltf`);

  // Fixed: Upgraded from the undersized 6x6 roof to 8x8 to perfectly match the 8x8 wall footprint and gables
  const roof = useGLTF(`${BASE}Roof_RoundTiles_8x8.gltf`);
  const gable = useGLTF(`${BASE}Roof_Front_Brick8.gltf`);

  const houseBase = useMemo(() => getTerrainHeight(HOUSE01.x, HOUSE01.z), []);

  const house = useMemo(() => {
    const root = new THREE.Group();

    root.name = "House_01_Plaster_Cottage";

    const tilePositions = [-3, -1, 1, 3];

    // FLOOR: 4 × 4 tiles, 8 × 8 units.
    for (const x of tilePositions) {
      for (const z of tilePositions) {
        placeModel(root, floor.scene, x, z, 0);
      }
    }

    // FRONT WALL: door opening in the second segment.
    for (const x of tilePositions) {
      placeModel(
        root,
        x === HOUSE01.doorX ? doorWall.scene : wall.scene,
        x,
        4,
        WALL_BOTTOM,
      );
    }

    // BACK WALL: two window openings.
    for (const x of tilePositions) {
      const hasWindow = x === -1 || x === 1;

      placeModel(
        root,
        hasWindow ? windowWall.scene : wall.scene,
        x,
        -4,
        WALL_BOTTOM,
        Math.PI,
      );

      if (hasWindow) {
        placeModel(root, window.scene, x, -4, 1.05, Math.PI);
      }
    }

    // LEFT AND RIGHT WALLS.
    for (const side of [-1, 1]) {
      for (const z of tilePositions) {
        const hasWindow = z === 1;

        const rotation = side === 1 ? Math.PI / 2 : -Math.PI / 2;

        placeModel(
          root,
          hasWindow ? windowWall.scene : wall.scene,
          side * 4,
          z,
          WALL_BOTTOM,
          rotation,
        );

        if (hasWindow) {
          placeModel(root, window.scene, side * 4, z, 1.05, rotation);
        }
      }
    }

    // ROOF: tiled roof sits on the wall tops (removed the faulty scale factor so it resolves to true 8x8)
    placeModel(root, roof.scene, 0, 0, WALL_TOP - 0.08);

    // GABLE ENDS: one at each end of the roof ridge.
    placeModel(root, gable.scene, 0, 4, WALL_TOP);

    placeModel(root, gable.scene, 0, -4, WALL_TOP, Math.PI);

    root.position.set(HOUSE01.x, houseBase, HOUSE01.z);

    return root;
  }, [
    floor.scene,
    wall.scene,
    doorWall.scene,
    windowWall.scene,
    window.scene,
    roof.scene,
    gable.scene,
    houseBase,
  ]);

  useEffect(() => {
    return () => {
      houseRuntime.doorOpen = false;
    };
  }, []);

  return (
    <>
      <primitive object={house} dispose={null} />

      <DoorLeaf source={door.scene} baseY={houseBase} />
    </>
  );
}

useGLTF.preload(`${BASE}Floor_Brick.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_Straight.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_Door_Flat.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_Window_Wide_Flat.gltf`);
useGLTF.preload(`${BASE}Door_1_Flat.gltf`);
useGLTF.preload(`${BASE}Window_Wide_Flat1.gltf`);
// Update the preload path
useGLTF.preload(`${BASE}Roof_RoundTiles_8x8.gltf`);
useGLTF.preload(`${BASE}Roof_Front_Brick8.gltf`);
