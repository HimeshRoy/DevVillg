"use client";

import { Suspense } from "react";
import { ContactShadows } from "@react-three/drei";

import Character from "./Character";
import Terrain from "./Terrain";

import Forest from "./Forest";
import Rocks from "./Rocks";
import Flowers from "./Flowers";
import Vegetation from "./Vegetation";
import GroundDetails from "./GroundDetails";

import GrassField from "./GrassField";

import River from "./River";
import Riverbed from "./Riverbed";
import RiverDetails from "./RiverDetails";
import RiverTrees from "./RiverTrees";

import House01 from "./House01";
import House02 from "./House02";
import House03 from "./House03";
import House04 from "./House04";

import VillageRoads from "./VillageRoads";
import VillageSquare from "./VillageSquare";
import VillageFountain from "./VillageFountain";
import VillageSquareProps from "./VillageSquareProps";
import VillageSquareGarden from "./VillageSquareGarden";


import VillageAssetInspector from "./VillageAssetInspector";

export default function World() {
  return (
    <>
      {/* Countryside atmosphere */}
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

      {/* Terrain and river */}
      <Terrain />
      <Riverbed />
      <River />

      {/* Village layout */}
      <VillageRoads />
      <VillageSquare />

      {/* Exactly one grass streamer */}
      <GrassField key="village-layout-02" />

      {/* River environment */}
      <RiverDetails />
      <RiverTrees />

      {/* Residential buildings */}
      <House01 />
      <House02 />
      <House03/>
      <House04/>

      {/* Village environment */}
      <VillageFountain />
      <VillageSquareProps/>
      <VillageSquareGarden/>

      <Forest />
      <Rocks />
      <Flowers />
      <Vegetation />
      <GroundDetails />

      {/* Player */}
      <Suspense fallback={null}>
        <Character />
      </Suspense>

      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={8} blur={2} />

      <VillageAssetInspector/>
    </>
  );
}
