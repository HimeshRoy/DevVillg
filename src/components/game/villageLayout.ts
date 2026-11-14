import { HOUSE01, HOUSE02, HOUSE03, HOUSE04 } from "./houseState";

function getDoorPosition(house: typeof HOUSE01) {
  const cos = Math.cos(house.rotation);
  const sin = Math.sin(house.rotation);

  return {
    x: house.x + cos * house.doorX + sin * house.halfSize,
    z: house.z - sin * house.doorX + cos * house.halfSize,
  };
}

export function isOnVillageRoad(x: number, z: number): boolean {
  // Main residential street.
  const mainStreet = x >= -30 && x <= 46 && z >= -4.05 && z <= 0.05;

  // House 01 entrance.
  const door01 = getDoorPosition(HOUSE01);

  const house01Path =
    Math.abs(x - door01.x) <= 1.05 && Math.abs(z - (door01.z - 2)) <= 2.05;

  // House 02 entrance.
  const door02 = getDoorPosition(HOUSE02);

  const house02Path =
    Math.abs(x - door02.x) <= 1.05 && Math.abs(z - (door02.z - 2)) <= 2.05;

  // Connection from main street to Village Square.
  const squareEntrance = Math.abs(x) <= 2.1 && z >= 0 && z <= 8.05;

  // Main paved plaza.
  const plaza = Math.abs(x) <= 12.05 && z >= 8 && z <= 28.05;

  // General Store entrance path.
  const shopDoor = getDoorPosition(HOUSE03);

  const shopEntrance =
    Math.abs(x - (shopDoor.x - 1)) <= 1.05 && Math.abs(z - shopDoor.z) <= 1.05;

  const workshopDoor = getDoorPosition(HOUSE04);

  const workshopPath =
    Math.abs(x - (workshopDoor.x + 3)) <= 1.05 &&
    Math.abs(z - workshopDoor.z) <= 1.05;

  return (
    mainStreet ||
    house01Path ||
    house02Path ||
    squareEntrance ||
    plaza ||
    workshopPath ||
    shopEntrance
  );
}
