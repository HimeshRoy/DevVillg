"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";
import { HOUSE02, houseRuntime } from "./houseState";

const BASE = "/models/medieval-village/glTF/";

const WALL_BOTTOM = 0.02;
const WALL_TOP = 3.145;

function prepareModel(source: THREE.Object3D) {
  const model = source.clone(true);

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

function placeModel(
  parent: THREE.Group,
  source: THREE.Object3D,
  x: number,
  z: number,
  bottomY: number,
  rotationY = 0,
  scale = 1,
) {
  const model = prepareModel(source);

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

function AutomaticDoor({
  source,
  baseY,
}: {
  source: THREE.Object3D;
  baseY: number;
}) {
  const hingeRef = useRef<THREE.Group>(null);

  const doorModel = useMemo(() => {
    const model = prepareModel(source);

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

    // Move the model origin to its left hinge.
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

    const target = houseRuntime.house02DoorOpen ? Math.PI / 2 : 0;

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
        HOUSE02.x + HOUSE02.doorX - doorModel.width / 2,
        baseY + WALL_BOTTOM,
        HOUSE02.z + HOUSE02.halfSize + 0.05,
      ]}
    >
      <primitive object={doorModel.model} />
    </group>
  );
}

export default function House02() {
  const floor = useGLTF(`${BASE}Floor_RedBrick.gltf`);

  const wall = useGLTF(`${BASE}Wall_UnevenBrick_Straight.gltf`);

  const doorWall = useGLTF(`${BASE}Wall_UnevenBrick_Door_Round.gltf`);

  const windowWall = useGLTF(`${BASE}Wall_UnevenBrick_Window_Wide_Round.gltf`);

  const door = useGLTF(`${BASE}Door_2_Round.gltf`);

  const window = useGLTF(`${BASE}Window_Wide_Round1.gltf`);

  const roof = useGLTF(`${BASE}Roof_RoundTiles_6x6.gltf`);

  const gable = useGLTF(`${BASE}Roof_Front_Brick8.gltf`);

  const houseBase = useMemo(() => getTerrainHeight(HOUSE02.x, HOUSE02.z), []);

  const house = useMemo(() => {
    const root = new THREE.Group();

    root.name = "House_02_Rustic_Brick_Cottage";

    const positions = [-3, -1, 1, 3];

    // 1. Red brick floor.
    for (const x of positions) {
      for (const z of positions) {
        placeModel(root, floor.scene, x, z, 0);
      }
    }

    // 2. Front wall with rounded doorway.
    for (const x of positions) {
      placeModel(
        root,
        x === HOUSE02.doorX ? doorWall.scene : wall.scene,
        x,
        4,
        WALL_BOTTOM,
      );
    }

    // 3. Rear wall with two rounded windows.
    for (const x of positions) {
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

    // 4. Left and right walls with windows.
    for (const side of [-1, 1]) {
      for (const z of positions) {
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

    // 5. Main tiled roof.
    placeModel(root, roof.scene, 0, 0, WALL_TOP - 0.08, 0, 1.16);

    // 6. Front and rear gable ends.
    placeModel(root, gable.scene, 0, 4, WALL_TOP);

    placeModel(root, gable.scene, 0, -4, WALL_TOP, Math.PI);

    root.position.set(HOUSE02.x, houseBase, HOUSE02.z);

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
      houseRuntime.house02DoorOpen = false;
    };
  }, []);

  return (
    <>
      <primitive object={house} dispose={null} />

      <AutomaticDoor source={door.scene} baseY={houseBase} />
    </>
  );
}

useGLTF.preload(`${BASE}Floor_RedBrick.gltf`);
useGLTF.preload(`${BASE}Wall_UnevenBrick_Straight.gltf`);
useGLTF.preload(`${BASE}Wall_UnevenBrick_Door_Round.gltf`);
useGLTF.preload(`${BASE}Wall_UnevenBrick_Window_Wide_Round.gltf`);
useGLTF.preload(`${BASE}Door_2_Round.gltf`);
useGLTF.preload(`${BASE}Window_Wide_Round1.gltf`);
useGLTF.preload(`${BASE}Roof_RoundTiles_6x6.gltf`);
useGLTF.preload(`${BASE}Roof_Front_Brick8.gltf`);
