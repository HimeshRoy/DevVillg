"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { getTerrainHeight } from "./terrainHeight";

const FOUNTAIN_X = 0;
const FOUNTAIN_Z = 18;

function createBasinGeometry() {
  const profile = [
    new THREE.Vector2(0, 0.2),
    new THREE.Vector2(1.25, 0.2),
    new THREE.Vector2(1.55, 0.3),
    new THREE.Vector2(1.78, 0.62),
    new THREE.Vector2(1.82, 0.72),
    new THREE.Vector2(1.64, 0.72),
    new THREE.Vector2(1.52, 0.55),
    new THREE.Vector2(1.25, 0.42),
    new THREE.Vector2(0, 0.42),
  ];

  return new THREE.LatheGeometry(profile, 48);
}

export default function VillageFountain() {
  const lowerWaterRef = useRef<THREE.Mesh>(null);
  const upperWaterRef = useRef<THREE.Mesh>(null);
  const cascadeRef1 = useRef<THREE.Mesh>(null);
  const cascadeRef2 = useRef<THREE.Mesh>(null);

  const basinGeometry = useMemo(() => createBasinGeometry(), []);

  const baseGeometry = useMemo(
    () => new THREE.CylinderGeometry(1.75, 1.85, 0.3, 48),
    [],
  );

  const pedestalGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.32, 0.48, 1.2, 32),
    [],
  );

  const stoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#928c7d",
        roughness: 0.9,
        metalness: 0,
      }),
    [],
  );

  const trimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b8a98e",
        roughness: 0.86,
      }),
    [],
  );

  const waterMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#40a9c5",
        roughness: 0.18,
        metalness: 0.08,
        transparent: true,
        opacity: 0.88,
        clearcoat: 0.65,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const waterfallMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#6ac0d9",
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5,
        clearcoat: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false, 
      }),
    [],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    if (lowerWaterRef.current) {
      lowerWaterRef.current.scale.set(
        1 + Math.sin(time * 1.3) * 0.008,
        1,
        1 + Math.cos(time * 1.1) * 0.008,
      );
    }

    if (upperWaterRef.current) {
      upperWaterRef.current.scale.set(
        1 + Math.sin(time * 1.7) * 0.012,
        1,
        1 + Math.cos(time * 1.4) * 0.012,
      );
    }

    if (cascadeRef1.current) {
      cascadeRef1.current.scale.set(
        1 + Math.sin(time * 3.5) * 0.015,
        1,
        1 + Math.cos(time * 3.5) * 0.015,
      );
    }

    if (cascadeRef2.current) {
      cascadeRef2.current.scale.set(
        1 + Math.sin(time * 4.2) * 0.03,
        1,
        1 + Math.cos(time * 4.2) * 0.03,
      );
    }
  });

  const baseY = getTerrainHeight(FOUNTAIN_X, FOUNTAIN_Z);

  return (
    <group
      name="village-central-fountain"
      position={[FOUNTAIN_X, baseY + 0.045, FOUNTAIN_Z]}
    >
      {/* Wide stone foundation */}
      <mesh
        geometry={baseGeometry}
        material={stoneMaterial}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
      />

      {/* Foundation decorative ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.3, 0]}
        material={trimMaterial}
      >
        <torusGeometry args={[1.7, 0.065, 10, 48]} />
      </mesh>

      {/* Main lower basin */}
      <mesh
        geometry={basinGeometry}
        material={stoneMaterial}
        position={[0, 0.1, 0]}
        castShadow
        receiveShadow
      />

      {/* Lower basin rim */}
      <mesh
        position={[0, 0.82, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={trimMaterial}
      >
        <torusGeometry args={[1.73, 0.075, 12, 64]} />
      </mesh>

      {/* Lower water surface */}
      <mesh
        ref={lowerWaterRef}
        position={[0, 0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterMaterial}
      >
        <circleGeometry args={[1.51, 48]} />
      </mesh>

      {/* Central pedestal */}
      <mesh
        geometry={pedestalGeometry}
        material={stoneMaterial}
        position={[0, 1.12, 0]}
        castShadow
      />

      {/* Pedestal decorative rings */}
      <mesh position={[0, 0.8, 0]} material={trimMaterial}>
        <torusGeometry args={[0.43, 0.065, 10, 32]} />
      </mesh>

      <mesh position={[0, 1.6, 0]} material={trimMaterial}>
        <torusGeometry args={[0.34, 0.055, 10, 32]} />
      </mesh>

      {/* Upper basin */}
      <group position={[0, 1.632, 0]} scale={0.44}>
        <mesh
          geometry={basinGeometry}
          material={stoneMaterial}
          position={[0, 0, 0]}
          castShadow
          receiveShadow
        />

        <mesh
          position={[0, 0.72, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={trimMaterial}
        >
          <torusGeometry args={[1.73, 0.075, 10, 48]} />
        </mesh>
      </group>

      {/* Upper water */}
      <mesh
        ref={upperWaterRef}
        position={[0, 1.88, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterMaterial}
      >
        <circleGeometry args={[0.66, 40]} />
      </mesh>

      {/* Central fountain finial */}
      <mesh position={[0, 1.98, 0]} material={trimMaterial} castShadow>
        <sphereGeometry args={[0.16, 20, 16]} />
      </mesh>

      {/* --- FALLING WATER CASCADES --- */}
      
      {/* Jet sprouting up from the finial */}
      <mesh position={[0, 2.24, 0]} material={waterMaterial}>
        <cylinderGeometry args={[0.015, 0.035, 0.2, 12]} />
      </mesh>

      {/* Waterfall: Splashing from jet down into upper basin */}
      <mesh
        ref={cascadeRef2}
        position={[0, 2.11, 0]}
        material={waterfallMaterial}
      >
        <cylinderGeometry args={[0.02, 0.22, 0.46, 16, 1, true]} />
      </mesh>

      {/* Waterfall: Spilling from upper basin down into lower basin */}
      <mesh
        ref={cascadeRef1}
        position={[0, 1.334, 0]}
        material={waterfallMaterial}
      >
        <cylinderGeometry args={[0.74, 0.82, 1.23, 32, 1, true]} />
      </mesh>
    </group>
  );
}