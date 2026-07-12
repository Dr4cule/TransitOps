import { prisma } from "@/lib/prisma";

/** Vehicles eligible for a service record: available or already in shop.
 *  A vehicle On Trip must finish first; a retired one is out of service. */
export function vehiclesForMaintenance() {
  return prisma.vehicle.findMany({
    where: { status: { in: ["AVAILABLE", "IN_SHOP"] } },
    orderBy: { name: "asc" },
  });
}

/** All service records, newest first, with the owning vehicle's name. */
export function listMaintenanceLogs() {
  return prisma.maintenanceLog.findMany({
    orderBy: { openedAt: "desc" },
    include: { vehicle: { select: { name: true } } },
  });
}
