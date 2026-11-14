"use client";

import * as THREE from "three";
import { getTerrainHeight } from "./terrainHeight";

const WOOD = "#80502f";
const WOOD_LIGHT = "#a87543";
const DARK_WOOD = "#58351f";
const METAL = "#383c3b";

// Four corners, leaving the southern entrance open.
const BENCHES = [
  { x: -7, z: 12.5 },
  { x: 7, z: 12.5 },
  { x: -7, z: 23.5 },
  { x: 7, z: 23.5 },
];

// Four actual corners of the village square.
const LAMPS = [
  { x: -10.5, z: 9.5 },
  { x: 10.5, z: 9.5 },
  { x: -10.5, z: 26.5 },
  { x: 10.5, z: 26.5 },
];

function Bench({ x, z }: { x: number; z: number }) {
  const groundY = getTerrainHeight(x, z);

  // Rotate the front of the bench towards the fountain.
  const rotation = Math.atan2(-x, 18 - z);

  return (
    <group position={[x, groundY + 0.04, z]} rotation={[0, rotation, 0]}>
      {/* Main seat */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.95, 0.14, 0.58]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={0.85} />
      </mesh>

      {/* Seat detail */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.96, 0.035, 0.59]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>

      {/* Four sturdy legs */}
      {[-0.78, 0.78].map((side) =>
        [-0.19, 0.19].map((depth) => (
          <mesh
            key={`${side}-${depth}`}
            position={[side, 0.31, depth]}
            castShadow
          >
            <boxGeometry args={[0.13, 0.62, 0.13]} />
            <meshStandardMaterial color={DARK_WOOD} />
          </mesh>
        )),
      )}

      {/* Backrest supports */}
      {[-0.77, 0.77].map((side) => (
        <mesh
          key={side}
          position={[side, 0.91, -0.23]}
          rotation={[0.08, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.72, 0.12]} />
          <meshStandardMaterial color={DARK_WOOD} />
        </mesh>
      ))}

      {/* Two proper backrest boards */}
      {[0.9, 1.18].map((height) => (
        <mesh key={height} position={[0, height, -0.25]} castShadow>
          <boxGeometry args={[1.95, 0.2, 0.12]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}

      {/* Armrests */}
      {[-0.92, 0.92].map((side) => (
        <mesh key={side} position={[side, 0.84, 0.02]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.65]} />
          <meshStandardMaterial color={WOOD_LIGHT} />
        </mesh>
      ))}
    </group>
  );
}


function StreetLamp({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);

  const metal = "#65513b";
  const bronze = "#997444";
  const glass = "#fff0bd";

  return (
    <group position={[x, y, z]}>
      {/* Stone foundation */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.28, 10]} />
        <meshStandardMaterial
          color="#a69b84"
          roughness={0.9}
        />
      </mesh>

      {/* Decorative bronze base */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.12, 10]} />
        <meshStandardMaterial color={bronze} metalness={0.35} />
      </mesh>

      {/* Main metal pole */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.11, 2.11, 10]} />
        <meshStandardMaterial
          color="#716047"
          metalness={0.3}
          roughness={0.65}
        />
      </mesh>

      {/* Decorative pole collars */}
      {[0.45, 2.385].map((height) => (
        <mesh key={height} position={[0, height, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 10]} />
          <meshStandardMaterial color={bronze} />
        </mesh>
      ))}

      {/* Lantern bottom */}
      <mesh position={[0, 2.48, 0]}>
        <boxGeometry args={[0.54, 0.09, 0.54]} />
        <meshStandardMaterial color={metal} metalness={0.3} />
      </mesh>

      {/* Bright warm glass */}
      <mesh position={[0, 2.76, 0]}>
        <boxGeometry args={[0.42, 0.52, 0.42]} />
        <meshStandardMaterial
          color={glass}
          emissive="#ffcf70"
          emissiveIntensity={0.65}
          roughness={0.35}
          metalness={0}
        />
      </mesh>

      {/* Lantern metal frame */}
      {[-0.22, 0.22].map((side) => (
        <group key={side}>
          <mesh position={[side, 2.76, 0]}>
            <boxGeometry args={[0.045, 0.63, 0.045]} />
            <meshStandardMaterial color={bronze} />
          </mesh>

          <mesh position={[0, 2.76, side]}>
            <boxGeometry args={[0.045, 0.63, 0.045]} />
            <meshStandardMaterial color={bronze} />
          </mesh>
        </group>
      ))}

      {/* Top lantern frame */}
      <mesh position={[0, 3.07, 0]}>
        <boxGeometry args={[0.52, 0.07, 0.52]} />
        <meshStandardMaterial color={metal} />
      </mesh>

      {/* Decorative pointed roof */}
      <mesh position={[0, 3.23, 0]} castShadow>
        <coneGeometry args={[0.39, 0.3, 4]} />
        <meshStandardMaterial
          color={metal}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Finial */}
      <mesh position={[0, 3.43, 0]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial color={bronze} />
      </mesh>

      {/* Actual warm illumination */}
      <pointLight
        position={[0, 2.75, 0]}
        color="#ffd58a"
        intensity={1.2}
        distance={7}
        decay={2}
      />
    </group>
  );
}


export default function VillageSquareProps() {
  return (
    <group name="village-square-decorations">
      {BENCHES.map((bench, index) => (
        <Bench key={`bench-${index}`} {...bench} />
      ))}

      {LAMPS.map((lamp, index) => (
        <StreetLamp key={`lamp-${index}`} {...lamp} />
      ))}
    </group>
  );
}
