import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import type { MaintenanceInput } from "./maintenance.schema";

type LockRow = { id: string; status: string };

/** Open a service record (Rule 9). A vehicle On Trip cannot be serviced;
 *  a retired vehicle is out of service. Opening flips the vehicle to In Shop.
 *  The vehicle row is locked so it can't be dispatched in the check→write gap. */
export async function openMaintenance(input: MaintenanceInput) {
  return prisma.$transaction(async (tx) => {
    const [vehicle] = await tx.$queryRaw<LockRow[]>(
      Prisma.sql`SELECT id, status FROM vehicles WHERE id = ${input.vehicleId} FOR UPDATE`,
    );
    if (!vehicle) throw new BusinessRuleError("Vehicle not found.");
    if (vehicle.status === "ON_TRIP") {
      throw new BusinessRuleError(
        "Cannot service a vehicle that is On Trip — complete or cancel its trip first.",
      );
    }
    if (vehicle.status === "RETIRED") {
      throw new BusinessRuleError("Vehicle is retired.");
    }

    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId: input.vehicleId,
        description: input.description,
        cost: input.cost,
        status: "ACTIVE",
      },
    });
    await tx.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: "IN_SHOP" },
    });
    return log;
  });
}

/** Close a service record (Rule 10). Only the last open record restores the
 *  vehicle to Available; a retired vehicle stays retired. */
export async function closeMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId } });
    if (!log) throw new BusinessRuleError("Service record not found.");
    if (log.status !== "ACTIVE") {
      throw new BusinessRuleError("This service record is already closed.");
    }

    await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    const otherActive = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: "ACTIVE", id: { not: logId } },
    });

    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
    if (vehicle && vehicle.status !== "RETIRED" && otherActive === 0) {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    return log;
  });
}
