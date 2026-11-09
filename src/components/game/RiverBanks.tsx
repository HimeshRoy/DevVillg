
// "use client";

// import { useMemo } from "react";
// import * as THREE from "three";
// import {
//   getRiverCenterX,
//   getTerrainHeight,
// } from "./terrainHeight";

// const RIVER_LENGTH = 240;
// const ROWS = 240;
// const WIDTH_SEGMENTS = 12;

// function createBankGeometry(side: number) {
//   const positions: number[] = [];
//   const colors: number[] = [];
//   const indices: number[] = [];

//   const wetSoil = new THREE.Color("#655a3e");
//   const drySoil = new THREE.Color("#82754b");
//   const meadow = new THREE.Color("#71964e");

//   for (let row = 0; row <= ROWS; row++) {
//     const t = row / ROWS;
//     const z = -RIVER_LENGTH / 2 + t * RIVER_LENGTH;

//     const centerX = getRiverCenterX(z);

//     // Slightly irregular shoreline.
//     const innerOffset = 6.8;
//     const outerOffset =
//       15 +
//       Math.sin(z * 0.055 + side) * 0.65 +
//       Math.sin(z * 0.13) * 0.25;

//     for (
//       let column = 0;
//       column <= WIDTH_SEGMENTS;
//       column++
//     ) {
//       const across = column / WIDTH_SEGMENTS;

//       const offset = THREE.MathUtils.lerp(
//         innerOffset,
//         outerOffset,
//         across
//       );

//       const x = centerX + side * offset;
//       const y = getTerrainHeight(x, z) + 0.035;

//       positions.push(x, y, z);

//       const color = new THREE.Color();

//       if (across < 0.45) {
//         color.lerpColors(
//           wetSoil,
//           drySoil,
//           across / 0.45
//         );
//       } else {
//         color.lerpColors(
//           drySoil,
//           meadow,
//           (across - 0.45) / 0.55
//         );
//       }

//       colors.push(color.r, color.g, color.b);
//     }
//   }

//   const rowLength = WIDTH_SEGMENTS + 1;

//   for (let row = 0; row < ROWS; row++) {
//     for (
//       let column = 0;
//       column < WIDTH_SEGMENTS;
//       column++
//     ) {
//       const a = row * rowLength + column;
//       const b = a + 1;
//       const c = a + rowLength;
//       const d = c + 1;

//       indices.push(a, c, b);
//       indices.push(b, c, d);
//     }
//   }

//   const geometry = new THREE.BufferGeometry();

//   geometry.setAttribute(
//     "position",
//     new THREE.Float32BufferAttribute(positions, 3)
//   );

//   geometry.setAttribute(
//     "color",
//     new THREE.Float32BufferAttribute(colors, 3)
//   );

//   geometry.setIndex(indices);
//   geometry.computeVertexNormals();

//   return geometry;
// }

// export default function RiverBanks() {
//   const geometries = useMemo(
//     () => [
//       createBankGeometry(-1),
//       createBankGeometry(1),
//     ],
//     []
//   );

//   return (
//     <group>
//       {geometries.map((geometry, index) => (
//         <mesh
//           key={index}
//           geometry={geometry}
//           receiveShadow
//         >
//           <meshStandardMaterial
//             vertexColors
//             roughness={1}
//             metalness={0}
//             side={THREE.DoubleSide}
//           />
//         </mesh>
//       ))}
//     </group>
//   );
// }
