"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const FLOWER3 = "/models/nature/glTF/Flower_3_Group.gltf";
const FLOWER4 = "/models/nature/glTF/Flower_4_Group.gltf";

const PLANTERS = [
  { x: -9.3, z: 18 },
  { x: 9.3, z: 18 },
];

function FlowerPatch({
  source,
  x,
  z,
  scale,
}: {
  source: THREE.Object3D;
  x: number;
  z: number;
  scale: number;
}) {
  const model = useMemo(() => {
    const clone = source.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
      }
    });

    return clone;
  }, [source]);

  return (
    <group
      // Fixed: Hardcoded the local Y position so the flowers sit perfectly 
      // on the planter's soil, rather than mistakenly sampling the global terrain height.
      position={[x, 0.48, z]}
      scale={scale}
    >
      <primitive object={model} />
    </group>
  );
}

function StonePlanter({
  x,
  z,
  flower3,
  flower4,
}: {
  x: number;
  z: number;
  flower3: THREE.Object3D;
  flower4: THREE.Object3D;
}) {
  const y = getTerrainHeight(x, z);

  return (
    // Fixed: Added a 90-degree rotation to align the planters vertically along the path
    <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
      {/* Stone planter foundation */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[2.65, 0.44, 1.05]} />
        <meshStandardMaterial
          color="#8d8371"
          roughness={0.95}
        />
      </mesh>

      {/* Raised rim */}
      {[-0.49, 0.49].map((zOffset) => (
        <mesh
          key={zOffset}
          position={[0, 0.49, zOffset]}
          castShadow
        >
          <boxGeometry args={[2.65, 0.12, 0.12]} />
          <meshStandardMaterial
            color="#b2a48a"
            roughness={0.95}
          />
        </mesh>
      ))}

      {[-1.27, 1.27].map((xOffset) => (
        <mesh
          key={xOffset}
          position={[xOffset, 0.49, 0]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.12, 1.05]} />
          <meshStandardMaterial
            color="#b2a48a"
            roughness={0.95}
          />
        </mesh>
      ))}

      {/* Dark soil */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[2.32, 0.08, 0.75]} />
        <meshStandardMaterial color="#493a29" />
      </mesh>

      {/* Flowers */}
      <FlowerPatch
        source={flower3}
        x={-0.65}
        z={0}
        scale={0.52}
      />

      <FlowerPatch
        source={flower4}
        x={0.35}
        z={0}
        scale={0.52}
      />

      <FlowerPatch
        source={flower3}
        x={0.95}
        z={0.12}
        scale={0.42}
      />
    </group>
  );
}

function VillageSignboard() {
  const [signTexture, setSignTexture] =
    useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");

    canvas.width = 768;
    canvas.height = 384;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Dark wooden sign background.
    ctx.fillStyle = "#50331f";
    ctx.fillRect(0, 0, 768, 384);

    // Decorative border.
    ctx.strokeStyle = "#d0ad71";
    ctx.lineWidth = 13;
    ctx.strokeRect(22, 22, 724, 340);

    ctx.strokeStyle = "#927047";
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 42, 684, 300);

    // Main lettering.
    ctx.textAlign = "center";
    ctx.fillStyle = "#f0d9a6";

    ctx.font = "bold 63px Georgia";
    ctx.fillText("VILLAGE", 384, 165);

    ctx.font = "bold 54px Georgia";
    ctx.fillText("SQUARE", 384, 238);

    ctx.font = "30px Georgia";
    ctx.fillText("✦  ESTABLISHED  ✦", 384, 300);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    setSignTexture(texture);

    return () => {
      texture.dispose();
    };
  }, []);

  const x = 3.5;
  const z = 9;

  return (
    <group
      position={[x, getTerrainHeight(x, z), z]}
      rotation={[0, Math.PI, 0]}
    >
      {/* Two sturdy wooden posts */}
      {[-0.82, 0.82].map((side) => (
        <mesh
          key={side}
          position={[side, 1.02, 0]}
          castShadow
        >
          <boxGeometry args={[0.17, 2.04, 0.18]} />
          <meshStandardMaterial color="#674025" />
        </mesh>
      ))}

      {/* Horizontal wooden board */}
      <mesh position={[0, 1.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.95, 1.05, 0.18]} />
        <meshStandardMaterial
          color="#754b2d"
          roughness={0.9}
        />
      </mesh>

      {/* Sign lettering */}
      {signTexture && (
        <mesh position={[0, 1.76, 0.096]}>
          <planeGeometry args={[1.78, 0.87]} />
          <meshBasicMaterial
            map={signTexture}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Little wooden roof */}
      <mesh position={[0, 2.36, 0]} castShadow>
        <boxGeometry args={[2.25, 0.14, 0.42]} />
        <meshStandardMaterial color="#59361f" />
      </mesh>

      {/* Decorative roof supports */}
      {[-0.95, 0.95].map((side) => (
        <mesh
          key={side}
          position={[side, 2.17, 0]}
          castShadow
        >
          <boxGeometry args={[0.09, 0.38, 0.11]} />
          <meshStandardMaterial color="#87532f" />
        </mesh>
      ))}
    </group>
  );
}

export default function VillageSquareGarden() {
  const flower3 = useGLTF(FLOWER3);
  const flower4 = useGLTF(FLOWER4);

  return (
    <group name="village-square-garden">
      {PLANTERS.map((planter, index) => (
        <StonePlanter
          key={index}
          {...planter}
          flower3={flower3.scene}
          flower4={flower4.scene}
        />
      ))}

      <VillageSignboard />
    </group>
  );
}

useGLTF.preload(FLOWER3);
useGLTF.preload(FLOWER4);