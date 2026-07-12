import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/utils";

/** Dispatch-eligible vehicles (Rule 2 & 4): only AVAILABLE ones are selectable. */
export function dispatchableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });
}

/** Dispatch-eligible drivers (Rules 3 & 4): AVAILABLE status AND a non-expired
 *  licence (valid through the whole expiry day). Suspended / On Trip / Off Duty
 *  and expired licences are excluded. */
export function dispatchableDrivers() {
  return prisma.driver.findMany({
    where: {
      status: "AVAILABLE",
      licenseExpiryDate: { gte: startOfToday() },
    },
    orderBy: { name: "asc" },
  });
}

/** Live board — all trips newest first, with vehicle & driver names. */
export function listTrips() {
  return prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, maxLoadCapacityKg: true } },
      driver: { select: { name: true } },
    },
  });
}
