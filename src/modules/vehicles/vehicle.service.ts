import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { findByRegistration } from "./vehicle.repository";
import type { VehicleInput } from "./vehicle.schema";

/** Create a vehicle. Rule: registration number must be unique (also DB-enforced). */
export async function createVehicle(companyId: string, input: VehicleInput) {
  const existing = await findByRegistration(companyId, input.registrationNumber);
  if (existing) {
    throw new BusinessRuleError("A vehicle with that registration number already exists.");
  }
  return prisma.vehicle.create({
    data: {
      companyId,
      registrationNumber: input.registrationNumber,
      name: input.name,
      type: input.type,
      maxLoadCapacityKg: input.maxLoadCapacityKg,
      odometerKm: input.odometerKm,
      acquisitionCost: input.acquisitionCost,
      region: input.region || null,
      status: "AVAILABLE",
    },
  });
}

/** Update a vehicle's editable fields (not status — status is driven by workflows). */
export async function updateVehicle(companyId: string, id: string, input: VehicleInput) {
  const row = await prisma.vehicle.findUnique({ where: { id } });
  if (!row || row.companyId !== companyId) throw new BusinessRuleError("Vehicle not found.");
  const clash = await findByRegistration(companyId, input.registrationNumber);
  if (clash && clash.id !== id) {
    throw new BusinessRuleError("A vehicle with that registration number already exists.");
  }
  return prisma.vehicle.update({
    where: { id },
    data: {
      registrationNumber: input.registrationNumber,
      name: input.name,
      type: input.type,
      maxLoadCapacityKg: input.maxLoadCapacityKg,
      odometerKm: input.odometerKm,
      acquisitionCost: input.acquisitionCost,
      region: input.region || null,
    },
  });
}

/** Retire a vehicle. Rule: a vehicle currently On Trip cannot be retired. */
export async function retireVehicle(companyId: string, id: string) {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v || v.companyId !== companyId) throw new BusinessRuleError("Vehicle not found.");
  if (v.status === "ON_TRIP") {
    throw new BusinessRuleError("Cannot retire a vehicle that is currently On Trip.");
  }
  return prisma.vehicle.update({ where: { id }, data: { status: "RETIRED" } });
}
