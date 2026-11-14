
export const HOUSE01 = {
  x: 18,
  z: -12,
  rotation: 0,
  halfSize: 4,
  wallThickness: 0.48,
  doorX: -1,
  doorWidth: 1.118,
};

export const HOUSE02 = {
  x: 4,
  z: -12,
  rotation: 0,
  halfSize: 4,
  wallThickness: 0.48,
  doorX: -1,
  doorWidth: 1.115,
};

export const HOUSE03 = {
  x: 18,
  z: 18,
  rotation: -Math.PI / 2,
  halfSize: 4,
  wallThickness: 0.48,
  doorX: -1,
  doorWidth: 1.118,
};

export const HOUSE04 = {
  x: 36.51,
  z: -1.65,
  rotation: -Math.PI / 2,
  halfSize: 5,
  wallThickness: 0.48,
  doorX: 0,
  doorWidth: 1.114,
};

export const houseRuntime = {
  doorOpen: false,
  house02DoorOpen: false,
  house03DoorOpen: false,
  house04DoorOpen: false,
  playerX: 0,
  playerZ: 0,
};

const OPEN_DISTANCE = 2.8;
const CLOSE_DISTANCE = 4.2;

type HouseDefinition = typeof HOUSE01;

function getDoorWorldPosition(house: HouseDefinition) {
  const cos = Math.cos(house.rotation);
  const sin = Math.sin(house.rotation);

  return {
    x:
      house.x +
      cos * house.doorX +
      sin * house.halfSize,

    z:
      house.z -
      sin * house.doorX +
      cos * house.halfSize,
  };
}

export function updateHouseDoorFromPlayer(
  x: number,
  z: number
) {
  houseRuntime.playerX = x;
  houseRuntime.playerZ = z;

  const doors: {
    house: HouseDefinition;
    key:
      | "doorOpen"
      | "house02DoorOpen"
      | "house03DoorOpen"
      | "house04DoorOpen";
  }[] = [
    { house: HOUSE01, key: "doorOpen" },
    { house: HOUSE02, key: "house02DoorOpen" },
    { house: HOUSE03, key: "house03DoorOpen" },
    { house: HOUSE04, key: "house04DoorOpen" },
  ];

  for (const { house, key } of doors) {
    const door = getDoorWorldPosition(house);

    const distance = Math.hypot(
      x - door.x,
      z - door.z
    );

    if (!houseRuntime[key] && distance < OPEN_DISTANCE) {
      houseRuntime[key] = true;
    }

    if (houseRuntime[key] && distance > CLOSE_DISTANCE) {
      houseRuntime[key] = false;
    }
  }
}

function blocksOneHouse(
  x: number,
  z: number,
  house: HouseDefinition,
  doorOpen: boolean
) {
  const dx = x - house.x;
  const dz = z - house.z;

  // Convert world coordinates into house-local coordinates.
  const cos = Math.cos(house.rotation);
  const sin = Math.sin(house.rotation);

  const localX = cos * dx - sin * dz;
  const localZ = sin * dx + cos * dz;

  const half = house.halfSize;
  const thickness = house.wallThickness;

  const withinX = Math.abs(localX) <= half + 0.3;
  const withinZ = Math.abs(localZ) <= half + 0.3;

  // Front wall and automatic doorway.
  if (
    withinX &&
    Math.abs(localZ - half) < thickness
  ) {
    const insideDoorway =
      Math.abs(localX - house.doorX) <
      house.doorWidth * 0.5 + 0.22;

    return !(insideDoorway && doorOpen);
  }

  // Rear wall.
  if (
    withinX &&
    Math.abs(localZ + half) < thickness
  ) {
    return true;
  }

  // Left and right walls.
  if (
    withinZ &&
    Math.abs(Math.abs(localX) - half) < thickness
  ) {
    return true;
  }

  return false;
}

export function blocksHouseMovement(
  x: number,
  z: number
) {
  return (
    blocksOneHouse(x, z, HOUSE01, houseRuntime.doorOpen) ||
    blocksOneHouse(x, z, HOUSE02, houseRuntime.house02DoorOpen) ||
    blocksOneHouse(x, z, HOUSE03, houseRuntime.house03DoorOpen) ||
    blocksOneHouse(x, z, HOUSE04, houseRuntime.house04DoorOpen)
  );
}
