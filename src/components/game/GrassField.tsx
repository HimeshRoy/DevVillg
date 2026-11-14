
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { createGrassBladeMaterial } from "./grassMaterial";
import { createGrassChunk } from "./grassScatter";

const CHUNK_SIZE = 24;
const CHUNK_RADIUS = 3;
const CHUNKS_PER_FRAME = 3;

type ChunkRequest = {
  x: number;
  z: number;
  key: string;
  distance: number;
};

export default function GrassField() {
  const { scene } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);

  const chunksRef = useRef(
    new Map<string, THREE.InstancedMesh>(),
  );

  const pendingRef = useRef<ChunkRequest[]>([]);
  const desiredRef = useRef(new Set<string>());

  const lastCenter = useRef("");

  const setup = useMemo(
    () => createGrassBladeMaterial(),
    [],
  );

  useEffect(() => {
    const object = scene.getObjectByName("terrain-ground");

    if (!object || !(object as THREE.Mesh).isMesh) {
      console.error(
        '[GrassField] Could not find mesh "terrain-ground".',
      );
      return;
    }

    terrainRef.current = object as THREE.Mesh;

    console.info("[GrassField] Terrain connected.");

    return () => {
      for (const mesh of chunksRef.current.values()) {
        mesh.removeFromParent();
        mesh.dispose();
      }

      chunksRef.current.clear();
      pendingRef.current = [];
      desiredRef.current.clear();

      terrainRef.current = null;
      lastCenter.current = "";

      setup.geometry.dispose();
      setup.material.dispose();
    };
  }, [scene, setup]);

  useFrame(({ camera, clock }) => {
    setup.uniforms.uTime.value = clock.elapsedTime;

    const terrain = terrainRef.current;
    const group = groupRef.current;

    if (!terrain || !group) return;

    const centerX = Math.floor(
      (camera.position.x + CHUNK_SIZE / 2) / CHUNK_SIZE,
    );

    const centerZ = Math.floor(
      (camera.position.z + CHUNK_SIZE / 2) / CHUNK_SIZE,
    );

    const centerKey = `${centerX},${centerZ}`;

    // Recalculate the streaming area only when the camera
    // enters a different chunk.
    if (centerKey !== lastCenter.current) {
      const desired = new Set<string>();
      const requests: ChunkRequest[] = [];

      for (
        let dz = -CHUNK_RADIUS;
        dz <= CHUNK_RADIUS;
        dz++
      ) {
        for (
          let dx = -CHUNK_RADIUS;
          dx <= CHUNK_RADIUS;
          dx++
        ) {
          const x = centerX + dx;
          const z = centerZ + dz;
          const key = `${x},${z}`;

          desired.add(key);

          if (chunksRef.current.has(key)) continue;

          requests.push({
            x,
            z,
            key,
            distance: dx * dx + dz * dz,
          });
        }
      }

      // Remove chunks outside the new streaming area.
      for (const [key, mesh] of chunksRef.current) {
        if (!desired.has(key)) {
          mesh.removeFromParent();
          mesh.dispose();
          chunksRef.current.delete(key);
        }
      }

      // Always generate closest chunks first.
      requests.sort((a, b) => a.distance - b.distance);

      pendingRef.current = requests;
      desiredRef.current = desired;

      lastCenter.current = centerKey;
    }

    // Generate only a few chunks per frame to avoid
    // a large frame-time spike.
    let processed = 0;

    while (
      pendingRef.current.length > 0 &&
      processed < CHUNKS_PER_FRAME
    ) {
      const request = pendingRef.current.shift()!;

      processed++;

      // Skip requests that became unnecessary after movement.
      if (!desiredRef.current.has(request.key)) continue;

      if (chunksRef.current.has(request.key)) continue;

      const dx = request.x - centerX;
      const dz = request.z - centerZ;

      const distance = Math.max(
        Math.abs(dx),
        Math.abs(dz),
      );

      // High detail nearby, lower density farther away.
      const density =
        distance <= 1 ? 10 :
        distance <= 2 ? 5 :
        2;

      const maximum =
        distance <= 1 ? 6000 :
        distance <= 2 ? 3000 :
        1200;

      const chunk = createGrassChunk(
        terrain,
        setup,
        request.x,
        request.z,
        density,
        maximum,
      );

      if (!chunk) continue;

      group.add(chunk);

      chunksRef.current.set(request.key, chunk);
    }
  });

  return <group ref={groupRef} />;
}
