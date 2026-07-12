import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import type { FuelInput } from "./expense.schema";

/** Log a fuel fill-up for a vehicle. */
export async function logFuel(companyId: string, input: FuelInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle || vehicle.companyId !== companyId)
    throw new BusinessRuleError("Selected vehicle no longer exists.");

  return prisma.fuelLog.create({
    data: {
      companyId,
      vehicleId: input.vehicleId,
      liters: input.liters,
      cost: input.cost,
    },
  });
}
