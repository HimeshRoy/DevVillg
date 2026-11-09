
"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(
  () => import("@/components/game/GameCanvas"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="h-screen w-full overflow-hidden">
      <GameCanvas />
    </main>
  );
}
