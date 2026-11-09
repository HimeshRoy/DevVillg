"use client";

import { Suspense } from "react";
import { ContactShadows } from "@react-three/drei";
import Character from "./Character";
import Terrain from "./Terrain";
import Tree from "./Tree";
import Forest from "./Forest";
import Rocks from "./Rocks";
import Flowers from "./Flowers";
import Vegetation from "./Vegetation";
import GroundDetails from "./GroundDetails";
import GrassField from "./GrassField";
import River from "./River";
// import RiverBanks from "./RiverBanks";
import GrassPreview from "./GrassPreview";
import Riverbed from "./Riverbed";
import RiverDetails from "./RiverDetails";
import RiverTrees from "./RiverTrees";
import VillageAssetInspector from "./VillageAssetInspector";
import House01 from "./House01";
import House02 from "./House02";

export default function World() {
  return (
    <>
      {/* Daylight */}
      <color attach="background" args={["#a8d5f5"]} />
      <fog attach="fog" args={["#a8d5f5", 300, 1200]} />

      <ambientLight intensity={1.2} />

      <directionalLight
        position={[5, 12, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Island terrain */}
      <Terrain />
      <GrassField />
      <Riverbed />
      <Forest />
      <Rocks />
      <Flowers />
      <Vegetation />
      <GroundDetails />
      <River />
      <RiverDetails />
      <RiverTrees />

      <VillageAssetInspector />

      {/** House */}

      <House01 />
      <House02/>

      {/* Character */}
      <Suspense fallback={null}>
        <Character />
      </Suspense>

      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={8} blur={2} />
    </>
  );
}
