export const HOUSE01 = {
  x: 18,
  z: -12,
  halfSize: 4,
  wallThickness: 0.48,
  doorX: -1,
  doorWidth: 1.118,
};

export const HOUSE02 = {
  x: 2,
  z: -12,
  halfSize: 4,
  wallThickness: 0.48,
  doorX: -1,
  doorWidth: 1.115,
};

export const houseRuntime = {
  doorOpen: false,
  house02DoorOpen: false,
  playerX: 0,
  playerZ: 0,
};

const OPEN_DISTANCE = 2.8;
const CLOSE_DISTANCE = 4.2;

export function updateHouseDoorFromPlayer(x: number, z: number) {
  houseRuntime.playerX = x;
  houseRuntime.playerZ = z;

  const updateDoor = (
    house: typeof HOUSE01,
    key: "doorOpen" | "house02DoorOpen",
  ) => {
    const doorX = house.x + house.doorX;
    const doorZ = house.z + house.halfSize;

    const distance = Math.hypot(x - doorX, z - doorZ);

    if (!houseRuntime[key] && distance < OPEN_DISTANCE) {
      houseRuntime[key] = true;
    }

    if (houseRuntime[key] && distance > CLOSE_DISTANCE) {
      houseRuntime[key] = false;
    }
  };

  updateDoor(HOUSE01, "doorOpen");
  updateDoor(HOUSE02, "house02DoorOpen");
}

function blocksOneHouse(
  x: number,
  z: number,
  house: typeof HOUSE01,
  doorOpen: boolean,
) {
  const localX = x - house.x;
  const localZ = z - house.z;

  const half = house.halfSize;
  const thickness = house.wallThickness;

  const withinX = Math.abs(localX) <= half + 0.3;
  const withinZ = Math.abs(localZ) <= half + 0.3;

  // Front wall with doorway.
  if (withinX && Math.abs(localZ - half) < thickness) {
    const insideDoorway =
      Math.abs(localX - house.doorX) < house.doorWidth * 0.5 + 0.22;

    return !(insideDoorway && doorOpen);
  }

  // Back wall.
  if (withinX && Math.abs(localZ + half) < thickness) {
    return true;
  }

  // Left and right walls.
  if (withinZ && Math.abs(Math.abs(localX) - half) < thickness) {
    return true;
  }

  return false;
}

export function blocksHouseMovement(x: number, z: number) {
  return (
    blocksOneHouse(x, z, HOUSE01, houseRuntime.doorOpen) ||
    blocksOneHouse(x, z, HOUSE02, houseRuntime.house02DoorOpen)
  );
}
