"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { createGrassBladeMaterial } from "./grassMaterial";
import { createGrassChunk } from "./grassScatter";

// Adapted from:
// https://github.com/cortiz2894/stylized-components
// MIT License — Copyright (c) 2026 Christian Ortiz.

const CHUNK_SIZE = 24;
const CHUNK_RADIUS = 8;

export default function GrassField() {
  const { scene } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);

  const chunksRef = useRef(new Map<string, THREE.InstancedMesh>());

  const lastCenter = useRef("");

  const setup = useMemo(() => createGrassBladeMaterial(), []);

  useEffect(() => {
    const object = scene.getObjectByName("terrain-ground");

    if (!object || !(object as THREE.Mesh).isMesh) {
      console.error('[GrassField] Could not find mesh "terrain-ground".');
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

    // Nothing needs updating until the camera enters another chunk.
    if (centerKey === lastCenter.current) return;

    const desired = new Set<string>();

    for (let dz = -CHUNK_RADIUS; dz <= CHUNK_RADIUS; dz++) {
      for (let dx = -CHUNK_RADIUS; dx <= CHUNK_RADIUS; dx++) {
        const x = centerX + dx;
        const z = centerZ + dz;

        desired.add(`${x},${z}`);
      }
    }

    // Remove chunks that are now outside the streaming area.
    for (const [key, mesh] of chunksRef.current) {
      if (!desired.has(key)) {
        mesh.removeFromParent();
        mesh.dispose();
        chunksRef.current.delete(key);
      }
    }

    // Generate only newly visible chunks.
    for (let dz = -CHUNK_RADIUS; dz <= CHUNK_RADIUS; dz++) {
      for (let dx = -CHUNK_RADIUS; dx <= CHUNK_RADIUS; dx++) {
        const x = centerX + dx;
        const z = centerZ + dz;
        const key = `${x},${z}`;

        if (chunksRef.current.has(key)) continue;

        const near = Math.max(Math.abs(dx), Math.abs(dz)) <= 1;

        const chunk = createGrassChunk(terrain, setup, x, z);

        if (!chunk) continue;

        group.add(chunk);
        chunksRef.current.set(key, chunk);
      }
    }

    lastCenter.current = centerKey;

    console.info(
      `[GrassField] Streaming around ${centerKey}: ${chunksRef.current.size} chunks.`,
    );
  });

  return <group ref={groupRef} />;
}
