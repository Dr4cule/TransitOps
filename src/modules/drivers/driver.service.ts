import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import type { DriverStatus } from "@/generated/prisma/enums";
import { findByLicense } from "./driver.repository";
import type { DriverInput } from "./driver.schema";

/** Create a driver. Rule: license number must be unique (also DB-enforced). */
export async function createDriver(input: DriverInput) {
  const existing = await findByLicense(input.licenseNumber);
  if (existing) {
    throw new BusinessRuleError("A driver with that license number already exists.");
  }
  return prisma.driver.create({
    data: {
      name: input.name,
      licenseNumber: input.licenseNumber,
      licenseCategory: input.licenseCategory,
      licenseExpiryDate: new Date(input.licenseExpiryDate),
      contactNumber: input.contactNumber,
      safetyScore: input.safetyScore,
      status: "AVAILABLE",
    },
  });
}

/** Update a driver's editable fields (not status — status is driven by workflows). */
export async function updateDriver(id: string, input: DriverInput) {
  const clash = await findByLicense(input.licenseNumber);
  if (clash && clash.id !== id) {
    throw new BusinessRuleError("A driver with that license number already exists.");
  }
  return prisma.driver.update({
    where: { id },
    data: {
      name: input.name,
      licenseNumber: input.licenseNumber,
      licenseCategory: input.licenseCategory,
      licenseExpiryDate: new Date(input.licenseExpiryDate),
      contactNumber: input.contactNumber,
      safetyScore: input.safetyScore,
    },
  });
}

/** Set a driver's status. Rule: an On-Trip driver is locked until the trip completes.
 *  ON_TRIP is never set manually — only AVAILABLE / OFF_DUTY / SUSPENDED are allowed. */
export async function setDriverStatus(id: string, status: string) {
  const allowed = ["AVAILABLE", "OFF_DUTY", "SUSPENDED"];
  if (!allowed.includes(status)) {
    throw new BusinessRuleError("Invalid driver status.");
  }
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new BusinessRuleError("Driver not found.");
  if (driver.status === "ON_TRIP") {
    throw new BusinessRuleError(
      "Driver is On Trip — cannot change status until the trip completes.",
    );
  }
  return prisma.driver.update({
    where: { id },
    data: { status: status as DriverStatus },
  });
}
