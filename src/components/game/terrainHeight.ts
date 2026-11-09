
import * as THREE from "three";

export function getRiverCenterZ(x: number): number {
  return (
    48 +
    Math.sin(x * 0.0041) * 22 +
    Math.sin(x * 0.013) * 8
  );
}

function getRiverSlope(x: number): number {
  return (
    Math.cos(x * 0.0041) * 22 * 0.0041 +
    Math.cos(x * 0.013) * 8 * 0.013
  );
}

export function getRiverDistance(
  x: number,
  z: number
): number {
  const slope = getRiverSlope(x);

  return (
    Math.abs(z - getRiverCenterZ(x)) /
    Math.sqrt(1 + slope * slope)
  );
}

export function getBaseTerrainHeight(
  x: number,
  z: number
): number {
  const distance = Math.sqrt(x * x + z * z);

  const villageBlend = THREE.MathUtils.smoothstep(
    distance,
    35,
    110
  );

  const broadHills =
    Math.sin(x * 0.009 + Math.sin(z * 0.006) * 2) * 8 +
    Math.cos(z * 0.012 + x * 0.004) * 6;

  const smallHills =
    Math.sin(x * 0.025 + z * 0.018) * 1.8 +
    Math.cos(z * 0.03 - x * 0.02) * 1.4;

  return (broadHills + smallHills) * villageBlend;
}

// River water level, following the landscape.
export function getRiverSurfaceHeight(x: number): number {
  return (
    getBaseTerrainHeight(x, getRiverCenterZ(x)) - 1.25
  );
}

// Recessed riverbed with a gradual transition into the banks.
export function getTerrainHeight(
  x: number,
  z: number
): number {
  const base = getBaseTerrainHeight(x, z);
  const distance = getRiverDistance(x, z);

  const riverDepth =
    1.7 *
    (
      1 -
      THREE.MathUtils.smoothstep(
        distance,
        2.2,
        7.0
      )
    );

  return base - riverDepth;
}

export function getGroundNormal(x: number, z: number) {
  const sampleDistance = 0.5;

  const left = getTerrainHeight(x - sampleDistance, z);
  const right = getTerrainHeight(x + sampleDistance, z);
  const back = getTerrainHeight(x, z - sampleDistance);
  const front = getTerrainHeight(x, z + sampleDistance);

  return new THREE.Vector3(
    left - right,
    sampleDistance * 2,
    back - front
  ).normalize();
}
