"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";
import { HOUSE03, houseRuntime } from "./houseState";

const BASE = "/models/medieval-village/glTF/";

const WALL_BOTTOM = 0.02;
const WALL_TOP = 3.145;

const SHOP_X = HOUSE03.x;
const SHOP_Z = HOUSE03.z;

type AssetName =
  | "Floor_WoodDark"
  | "Wall_Plaster_WoodGrid"
  | "Wall_Plaster_Door_Flat"
  | "Wall_Plaster_Window_Wide_Flat2"
  | "Door_1_Flat"
  | "Window_Wide_Flat1"
  | "WindowShutters_Wide_Flat_Open"
  | "Roof_RoundTiles_6x6"
  | "Roof_Front_Brick8"
  | "Prop_Crate";

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

/**
 * Places an asset using its measured bottom and XZ centre.
 * All coordinates passed here are shop-local coordinates.
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

/* -------------------------------------------------------
   AUTOMATIC SHOP DOOR
------------------------------------------------------- */

function ShopDoor({ source }: { source: THREE.Object3D }) {
  const hingeRef = useRef<THREE.Group>(null);

  const door = useMemo(() => {
    const model = prepareModel(source);

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());

    // Align the left edge of the door with the hinge.
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

    const target = houseRuntime.house03DoorOpen ? Math.PI / 2 : 0;

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
        HOUSE03.doorX - door.width / 2,
        WALL_BOTTOM,
        HOUSE03.halfSize + 0.055,
      ]}
    >
      <primitive object={door.model} />
    </group>
  );
}

/* -------------------------------------------------------
   SHOP AWNING
------------------------------------------------------- */

function ShopAwning() {
  const stripes = ["#a94f3d", "#f1dfbd", "#a94f3d", "#f1dfbd", "#a94f3d"];

  return (
    <group position={[2, 2.63, 4.55]}>
      {/* Alternating striped canvas */}
      {stripes.map((color, index) => (
        <mesh
          key={index}
          position={[-1.6 + index * 0.8, 0, 0]}
          rotation={[0.14, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.8, 0.075, 1.12]} />
          <meshStandardMaterial
            color={color}
            roughness={0.96}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Front wooden beam */}
      <mesh position={[0, -0.12, 0.53]} castShadow>
        <boxGeometry args={[4.2, 0.13, 0.14]} />
        <meshStandardMaterial color="#67432a" />
      </mesh>

      {/* Wooden support brackets */}
      {[-1.85, 1.85].map((x) => (
        <group key={x}>
          <mesh
            position={[x, -0.3, 0.35]}
            rotation={[0.15, 0, 0.35 * Math.sign(x)]}
            castShadow
          >
            <boxGeometry args={[0.11, 0.65, 0.11]} />
            <meshStandardMaterial color="#67432a" />
          </mesh>
        </group>
      ))}

      {/* Alternating front canopy valance */}
      {stripes.map((color, index) => (
        <mesh
          key={`valance-${index}`}
          position={[-1.6 + index * 0.8, -0.23, 0.6]}
          castShadow
        >
          <boxGeometry args={[0.8, 0.22, 0.075]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------
   SHOP SIGNBOARD
------------------------------------------------------- */

function ShopSign() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.fillStyle = "#58371f";
    ctx.fillRect(0, 0, 768, 256);

    ctx.strokeStyle = "#d6b47b";
    ctx.lineWidth = 12;
    ctx.strokeRect(18, 18, 732, 220);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#f4dfb0";
    ctx.font = "bold 65px Georgia";
    ctx.fillText("GENERAL STORE", 384, 117);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;

    setTexture(map);

    return () => {
      map.dispose();
    };
  }, []);

  return (
    <group position={[2, 3.55, 4.29]}>
      {/* Wooden signboard */}
      <mesh castShadow>
        <boxGeometry args={[2.8, 0.88, 0.15]} />
        <meshStandardMaterial color="#71472a" roughness={0.9} />
      </mesh>

      {/* Text surface */}
      {texture && (
        <mesh position={[0, 0, 0.081]}>
          <planeGeometry args={[2.62, 0.72]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}

      {/* Two hanging brackets */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.53, 0]} castShadow>
          <boxGeometry args={[0.09, 0.25, 0.11]} />
          <meshStandardMaterial color="#58371f" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------
   HOUSE 03 — VILLAGE GENERAL STORE
------------------------------------------------------- */

export default function House03() {
  const floor = useGLTF(`${BASE}Floor_WoodDark.gltf`);

  const wall = useGLTF(`${BASE}Wall_Plaster_WoodGrid.gltf`);

  const doorWall = useGLTF(`${BASE}Wall_Plaster_Door_Flat.gltf`);

  const windowWall = useGLTF(`${BASE}Wall_Plaster_Window_Wide_Flat2.gltf`);

  const door = useGLTF(`${BASE}Door_1_Flat.gltf`);

  const window = useGLTF(`${BASE}Window_Wide_Flat1.gltf`);

  const shutters = useGLTF(`${BASE}WindowShutters_Wide_Flat_Open.gltf`);

  const roof = useGLTF(`${BASE}Roof_RoundTiles_6x6.gltf`);

  const gable = useGLTF(`${BASE}Roof_Front_Brick8.gltf`);

  const crate = useGLTF(`${BASE}Prop_Crate.gltf`);

  const houseBase = useMemo(() => getTerrainHeight(SHOP_X, SHOP_Z), []);

  const house = useMemo(() => {
    const root = new THREE.Group();
    root.name = "House_03_General_Store";

    const segments = [-3, -1, 1, 3];

    // 1. Wooden floor — 8 × 8 units.
    for (const x of segments) {
      for (const z of segments) {
        placeModel(root, floor.scene, x, z, 0);
      }
    }

    // 2. Front storefront.
    // Door at x=-1; display windows at x=1 and x=3.
    for (const x of segments) {
      const isDoor = x === HOUSE03.doorX;
      const isWindow = x === 1 || x === 3;

      const source = isDoor
        ? doorWall.scene
        : isWindow
          ? windowWall.scene
          : wall.scene;

      placeModel(root, source, x, 4, WALL_BOTTOM);

      if (isWindow) {
        // Display window frame.
        placeModel(root, window.scene, x, 4.04, 0.944);

        // Open shutters around the window.
        placeModel(root, shutters.scene, x, 4.17, 0.944, 0, 0.8);
      }
    }

    // 3. Rear wall with two windows.
    for (const x of segments) {
      const isWindow = x === -1 || x === 1;

      placeModel(
        root,
        isWindow ? windowWall.scene : wall.scene,
        x,
        -4,
        WALL_BOTTOM,
        Math.PI,
      );

      if (isWindow) {
        placeModel(root, window.scene, x, -4.04, 0.944, Math.PI);
      }
    }

    // 4. Left and right walls.
    for (const side of [-1, 1]) {
      for (const z of segments) {
        const rotation = side === 1 ? Math.PI / 2 : -Math.PI / 2;

        placeModel(root, wall.scene, side * 4, z, WALL_BOTTOM, rotation);
      }
    }

    // 5. Main terracotta roof.
    placeModel(root, roof.scene, 0, 0, WALL_TOP - 0.08, 0, 1.16);

    // 6. Front and rear gable pieces.
    placeModel(root, gable.scene, 0, 4, WALL_TOP);

    placeModel(root, gable.scene, 0, -4, WALL_TOP, Math.PI);

    // 7. Shop crates outside the left side.
    placeModel(root, crate.scene, -3.1, 5.15, 0, 0.1, 0.85);

    placeModel(root, crate.scene, -3.85, 5.35, 0, -0.25, 0.68);

    return root;
  }, [
    floor.scene,
    wall.scene,
    doorWall.scene,
    windowWall.scene,
    door.scene,
    window.scene,
    shutters.scene,
    roof.scene,
    gable.scene,
    crate.scene,
  ]);

  useEffect(() => {
    return () => {
      houseRuntime.house03DoorOpen = false;
    };
  }, []);

  return (
    <group
      name="village-general-store"
      position={[SHOP_X, houseBase, SHOP_Z]}
      rotation={[0, HOUSE03.rotation, 0]}
    >
      {/* Building */}
      <primitive object={house} dispose={null} />

      {/* Automatic entrance door */}
      <ShopDoor source={door.scene} />

      {/* Storefront details */}
      <ShopAwning />
      <ShopSign />
    </group>
  );
}

// Preload all models.
useGLTF.preload(`${BASE}Floor_WoodDark.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_WoodGrid.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_Door_Flat.gltf`);
useGLTF.preload(`${BASE}Wall_Plaster_Window_Wide_Flat2.gltf`);
useGLTF.preload(`${BASE}Door_1_Flat.gltf`);
useGLTF.preload(`${BASE}Window_Wide_Flat1.gltf`);
useGLTF.preload(`${BASE}WindowShutters_Wide_Flat_Open.gltf`);
useGLTF.preload(`${BASE}Roof_RoundTiles_6x6.gltf`);
useGLTF.preload(`${BASE}Roof_Front_Brick8.gltf`);
useGLTF.preload(`${BASE}Prop_Crate.gltf`);
