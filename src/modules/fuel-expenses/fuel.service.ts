import { prisma } from "@/lib/prisma";
import type { FuelInput } from "./expense.schema";

/** Log a fuel fill-up for a vehicle. */
export async function logFuel(input: FuelInput) {
  return prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      liters: input.liters,
      cost: input.cost,
    },
  });
}
