"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";
import { HOUSE04, houseRuntime } from "./houseState";

const BASE = "/models/medieval-village/glTF/";

const WALL_BOTTOM = 0.02;
// Custom roof height for House 04 because uneven brick walls are shorter than standard walls
const HOUSE04_ROOF_Y = 2.65; 

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

function WorkshopDoor({ source }: { source: THREE.Object3D }) {
  const hingeRef = useRef<THREE.Group>(null);

  const door = useMemo(() => {
    const model = prepareModel(source);
    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

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

    const target = houseRuntime.house04DoorOpen ? Math.PI / 2 : 0;

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
        HOUSE04.doorX - door.width / 2,
        WALL_BOTTOM,
        HOUSE04.halfSize + 0.055,
      ]}
    >
      <primitive object={door.model} dispose={null} />
    </group>
  );
}

/* -------------------------------------------------------
   OUTDOOR FORGE AND ANVIL
------------------------------------------------------- */

function WorkshopYard() {
  const stone = "#77736b";
  const iron = "#42464a";

  const ironMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: iron,
        metalness: 0.62,
        roughness: 0.48,
      }),
    [],
  );

  const fireMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff8a25",
        emissive: "#ff4a08",
        emissiveIntensity: 1.6,
      }),
    [],
  );

  return (
    <group>
      {/* Stone forge foundation - shifted right out of the doorway */}
      <mesh position={[2.1, 0.45, 7.0]} castShadow receiveShadow>
        <boxGeometry args={[1.65, 0.9, 1.3]} />
        <meshStandardMaterial color={stone} roughness={0.95} />
      </mesh>

      {/* Forge upper surround */}
      <mesh position={[2.1, 1.0, 7.0]} castShadow>
        <boxGeometry args={[1.28, 0.22, 1.05]} />
        <meshStandardMaterial color="#4d4943" />
      </mesh>

      {/* Glowing firebox opening */}
      <mesh position={[2.1, 0.82, 6.31]}>
        <planeGeometry args={[0.72, 0.45]} />
        <meshBasicMaterial color="#ff741b" side={THREE.DoubleSide} />
      </mesh>

      <pointLight
        position={[2.1, 1.0, 6.2]}
        color="#ff812e"
        intensity={0.45}
        distance={3}
      />

      {/* Anvil pedestal - shifted right */}
      <mesh position={[5.95, 0.38, 7.3]} castShadow>
        <boxGeometry args={[0.48, 0.76, 0.48]} />
        <meshStandardMaterial color="#565653" />
      </mesh>

      {/* Anvil body */}
      <mesh position={[5.95, 0.82, 7.3]} material={ironMaterial} castShadow>
        <boxGeometry args={[1.1, 0.2, 0.46]} />
      </mesh>

      {/* Anvil horn */}
      <mesh
        position={[6.54, 0.82, 7.3]}
        rotation={[0, 0, -Math.PI / 2]}
        material={ironMaterial}
        castShadow
      >
        <coneGeometry args={[0.19, 0.5, 8]} />
      </mesh>

      {/* Metal working block - shifted right */}
      <mesh position={[5.05, 0.48, 8.1]} castShadow>
        <boxGeometry args={[1.0, 0.9, 0.7]} />
        <meshStandardMaterial color="#69462e" roughness={0.92} />
      </mesh>

      {/* Glowing hot metal on the anvil */}
      <mesh position={[6.0, 0.94, 7.3]}>
        <boxGeometry args={[0.22, 0.045, 0.1]} />
        <primitive object={fireMaterial} attach="material" />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------
   BLACKSMITH WORKSHOP
------------------------------------------------------- */

export default function House04() {
  const floor = useGLTF(`${BASE}Floor_Brick.gltf`);
  const yardFloor = useGLTF(`${BASE}Floor_UnevenBrick.gltf`);
  const wall = useGLTF(`${BASE}Wall_UnevenBrick_Straight.gltf`);
  const doorWall = useGLTF(`${BASE}Wall_UnevenBrick_Door_Flat.gltf`);
  const timberCorner = useGLTF(`${BASE}Corner_Exterior_Wood.gltf`);
  const door = useGLTF(`${BASE}Door_2_Flat.gltf`);
  
  const roof = useGLTF(`${BASE}Roof_RoundTiles_8x8.gltf`);
  const gable = useGLTF(`${BASE}Roof_Front_Brick8.gltf`);
  
  const chimney = useGLTF(`${BASE}Prop_Chimney2.gltf`);
  const crate = useGLTF(`${BASE}Prop_Crate.gltf`);

  const houseBase = useMemo(() => getTerrainHeight(HOUSE04.x, HOUSE04.z), []);

  const building = useMemo(() => {
    const root = new THREE.Group();
    root.name = "House_04_Blacksmith_Workshop";

    // 10 × 10 floor and walls.
    const positions = [-4, -2, 0, 2, 4];

    // 1. Main brick floor.
    for (const x of positions) {
      for (const z of positions) {
        placeModel(root, floor.scene, x, z, 0);
      }
    }

    // 2. Front wall, central door.
    for (const x of positions) {
      placeModel(
        root,
        x === HOUSE04.doorX ? doorWall.scene : wall.scene,
        x,
        5,
        WALL_BOTTOM,
      );
    }

    // 3. Rear wall.
    for (const x of positions) {
      placeModel(root, wall.scene, x, -5, WALL_BOTTOM, Math.PI);
    }

    // 4. Left and right walls.
    for (const side of [-1, 1]) {
      for (const z of positions) {
        placeModel(
          root,
          wall.scene,
          side * 5,
          z,
          WALL_BOTTOM,
          side === 1 ? Math.PI / 2 : -Math.PI / 2,
        );
      }
    }

    // 5. Exposed timber corner supports.
    for (const x of [-4.85, 4.85]) {
      for (const z of [-4.85, 4.85]) {
        placeModel(root, timberCorner.scene, x, z, WALL_BOTTOM);
      }
    }

    // 6. Large roof 
    // Lowered to 2.65 so it seals flush against the uneven brick walls
    placeModel(root, roof.scene, 0, 0, HOUSE04_ROOF_Y, 0, 1.25);

    // 7. Front and rear gable ends
    placeModel(root, gable.scene, 0, 5, HOUSE04_ROOF_Y, 0, 1.25);
    placeModel(root, gable.scene, 0, -5, HOUSE04_ROOF_Y, Math.PI, 1.25);

    // 8. Interior Chimney Breast
    // A thick physical wall inside the room against the left wall to serve as a proper fireplace column
    placeModel(root, wall.scene, -4.6, -2.0, WALL_BOTTOM, Math.PI / 2);

    // 9. Chimney Top
    // Scaled up by 1.5 for a robust look, resting seamlessly on top of the interior column
    placeModel(root, chimney.scene, -4.6, -2.0, HOUSE04_ROOF_Y, 0, 1.5);

    // 10. Wooden crates near the outdoor work area (Left side).
    placeModel(root, crate.scene, -4.0, 6.4, 0, 0.2, 0.9);
    placeModel(root, crate.scene, -4.6, 7.3, 0, -0.3, 0.68);

    // 11. Exterior paved working yard.
    for (const x of [2, 4, 6]) {
      for (const z of [6, 8]) {
        placeModel(root, yardFloor.scene, x, z, 0);
      }
    }

    return root;
  }, [
    floor.scene,
    yardFloor.scene,
    wall.scene,
    doorWall.scene,
    timberCorner.scene,
    roof.scene,
    gable.scene,
    chimney.scene,
    crate.scene,
  ]);

  useEffect(() => {
    return () => {
      houseRuntime.house04DoorOpen = false;
    };
  }, []);

  return (
    <group
      name="blacksmith-workshop"
      position={[HOUSE04.x, houseBase, HOUSE04.z]}
      rotation={[0, HOUSE04.rotation, 0]}
    >
      <primitive object={building} dispose={null} />

      <WorkshopDoor source={door.scene} />

      <WorkshopYard />
    </group>
  );
}

useGLTF.preload(`${BASE}Floor_Brick.gltf`);
useGLTF.preload(`${BASE}Floor_UnevenBrick.gltf`);
useGLTF.preload(`${BASE}Wall_UnevenBrick_Straight.gltf`);
useGLTF.preload(`${BASE}Wall_UnevenBrick_Door_Flat.gltf`);
useGLTF.preload(`${BASE}Corner_Exterior_Wood.gltf`);
useGLTF.preload(`${BASE}Door_2_Flat.gltf`);
useGLTF.preload(`${BASE}Roof_RoundTiles_8x8.gltf`);
useGLTF.preload(`${BASE}Roof_Front_Brick8.gltf`);
useGLTF.preload(`${BASE}Prop_Chimney2.gltf`);
useGLTF.preload(`${BASE}Prop_Crate.gltf`);