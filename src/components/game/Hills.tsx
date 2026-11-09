
"use client";

const hills = [
  { position: [-90, -8, -110], scale: [65, 22, 55], color: "#668f4f" },
  { position: [-25, -9, -145], scale: [75, 27, 60], color: "#789e59" },
  { position: [75, -10, -125], scale: [80, 30, 65], color: "#63894b" },
  { position: [155, -8, -65], scale: [65, 24, 75], color: "#789d5b" },
  { position: [-150, -9, -20], scale: [75, 28, 65], color: "#6b9250" },
  { position: [-125, -8, 100], scale: [85, 26, 65], color: "#789e58" },
  { position: [-35, -10, 155], scale: [75, 30, 65], color: "#63894b" },
  { position: [85, -9, 140], scale: [85, 27, 70], color: "#719752" },
  { position: [165, -10, 85], scale: [75, 30, 65], color: "#668d4d" },
  { position: [220, -12, -30], scale: [65, 32, 70], color: "#789d5b" },
] as const;

export default function Hills() {
  return (
    <group>
      {hills.map((hill, index) => (
        <mesh
          key={index}
          position={hill.position as [number, number, number]}
          scale={hill.scale as [number, number, number]}
          receiveShadow
          castShadow
        >
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial
            color={hill.color}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
