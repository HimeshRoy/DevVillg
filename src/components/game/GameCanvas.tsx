"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import World from "./World";

export default function GameCanvas() {
  return (
    <div className="h-screen w-full bg-slate-900">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [4, 3, 6],
          fov: 45,
          near: 0.1,
          far: 2000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-5 left-5 z-10 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white backdrop-blur-md">
        <div className="font-semibold mb-2">PLAYER CONTROLS</div>
        <div>W A S D — Move</div>
        <div>SHIFT — Run</div>
        <div>SPACE — Jump</div>
        <div>DRAG MOUSE — Rotate Camera</div>
        <div>SCROLL — Zoom</div>
        <div>V — Change Camera</div>
      </div>
    </div>
  );
}
