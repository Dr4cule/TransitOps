import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/utils";

/** Dispatch-eligible vehicles (Rule 2 & 4): only AVAILABLE ones, in this company. */
export function dispatchableVehicles(companyId: string) {
  return prisma.vehicle.findMany({
    where: { companyId, status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });
}

/** Dispatch-eligible drivers (Rules 3 & 4): AVAILABLE status AND a non-expired
 *  licence (valid through the whole expiry day), in this company. */
export function dispatchableDrivers(companyId: string) {
  return prisma.driver.findMany({
    where: {
      companyId,
      status: "AVAILABLE",
      licenseExpiryDate: { gte: startOfToday() },
    },
    orderBy: { name: "asc" },
  });
}

/** Live board — this company's trips newest first, with vehicle & driver names. */
export function listTrips(companyId: string) {
  return prisma.trip.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, maxLoadCapacityKg: true } },
      driver: { select: { name: true } },
    },
  });
}
