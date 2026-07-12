import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { startOfToday } from "@/lib/utils";
import type { CreateTripInput, CompleteTripInput } from "./trip.schema";

type LockRow = { id: string; status: string };

/**
 * Create a trip as DRAFT. Re-validates eligibility server-side (the client
 * pickers are only a hint) and enforces cargo ≤ capacity (Rule 5).
 * No status side-effects yet — a DRAFT holds no locks.
 */
export async function createTrip(input: CreateTripInput) {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
    prisma.driver.findUnique({ where: { id: input.driverId } }),
  ]);
  if (!vehicle) throw new BusinessRuleError("Selected vehicle no longer exists.");
  if (!driver) throw new BusinessRuleError("Selected driver no longer exists.");

  // Rule 2 & 4 — vehicle must be dispatchable.
  if (vehicle.status !== "AVAILABLE") {
    throw new BusinessRuleError(`${vehicle.name} is not available (status: ${vehicle.status}).`);
  }
  // Rule 3 & 4 — driver must be available with a valid licence.
  if (driver.status !== "AVAILABLE") {
    throw new BusinessRuleError(`${driver.name} is not available (status: ${driver.status}).`);
  }
  if (driver.licenseExpiryDate < startOfToday()) {
    throw new BusinessRuleError(`${driver.name}'s licence has expired — cannot assign.`);
  }
  // Rule 5 — cargo must not exceed capacity.
  if (input.cargoWeightKg > Number(vehicle.maxLoadCapacityKg)) {
    const over = input.cargoWeightKg - Number(vehicle.maxLoadCapacityKg);
    throw new BusinessRuleError(
      `Cargo exceeds ${vehicle.name}'s capacity by ${over} kg (max ${vehicle.maxLoadCapacityKg} kg).`,
    );
  }

  return prisma.trip.create({
    data: {
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      cargoWeightKg: input.cargoWeightKg,
      plannedDistanceKm: input.plannedDistanceKm,
      status: "DRAFT",
    },
  });
}

/**
 * Dispatch a DRAFT trip. Atomically (Rule 6): trip → DISPATCHED,
 * vehicle → ON_TRIP, driver → ON_TRIP. Row-locks the three rows and
 * re-validates against live state so two dispatchers can't race.
 */
export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new BusinessRuleError("Trip not found.");
    if (trip.status !== "DRAFT") {
      throw new BusinessRuleError(`Only draft trips can be dispatched (this one is ${trip.status}).`);
    }

    // Lock vehicle & driver rows for the duration (Prisma has no .forUpdate()).
    const [vehicle] = await tx.$queryRaw<LockRow[]>(
      Prisma.sql`SELECT id, status FROM vehicles WHERE id = ${trip.vehicleId} FOR UPDATE`,
    );
    const [driver] = await tx.$queryRaw<LockRow[]>(
      Prisma.sql`SELECT id, status FROM drivers WHERE id = ${trip.driverId} FOR UPDATE`,
    );

    if (!vehicle || vehicle.status !== "AVAILABLE") {
      throw new BusinessRuleError("Vehicle is no longer available for dispatch.");
    }
    if (!driver || driver.status !== "AVAILABLE") {
      throw new BusinessRuleError("Driver is no longer available for dispatch.");
    }

    await tx.trip.update({
      where: { id: trip.id },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
  });
}

/**
 * Complete a DISPATCHED trip (Rule 7). Captures final distance + fuel, writes a
 * FuelLog, rolls the vehicle odometer forward, and restores vehicle + driver to
 * AVAILABLE — all atomically.
 */
export async function completeTrip(tripId: string, input: CompleteTripInput) {
  return prisma.$transaction(async (tx) => {
    // Lock the trip row so two concurrent completes can't both pass the guard
    // (which would double-write the FuelLog and double-increment the odometer).
    const [locked] = await tx.$queryRaw<LockRow[]>(
      Prisma.sql`SELECT id, status FROM trips WHERE id = ${tripId} FOR UPDATE`,
    );
    if (!locked) throw new BusinessRuleError("Trip not found.");
    if (locked.status !== "DISPATCHED") {
      throw new BusinessRuleError(`Only dispatched trips can be completed (this one is ${locked.status}).`);
    }
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });

    await tx.trip.update({
      where: { id: trip.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        actualDistanceKm: input.actualDistanceKm,
        fuelConsumedL: input.fuelConsumedL,
      },
    });
    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        liters: input.fuelConsumedL,
        cost: input.fuelCost,
      },
    });
    // Roll odometer forward by the trip distance.
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: "AVAILABLE",
        odometerKm: { increment: input.actualDistanceKm },
      },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
  });
}

/**
 * Cancel a trip (Rule 8). A DISPATCHED trip restores vehicle + driver to
 * AVAILABLE; a DRAFT trip simply flips to CANCELLED (nothing was locked).
 */
export async function cancelTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const [locked] = await tx.$queryRaw<LockRow[]>(
      Prisma.sql`SELECT id, status FROM trips WHERE id = ${tripId} FOR UPDATE`,
    );
    if (!locked) throw new BusinessRuleError("Trip not found.");
    if (locked.status !== "DRAFT" && locked.status !== "DISPATCHED") {
      throw new BusinessRuleError(`A ${locked.status} trip cannot be cancelled.`);
    }
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });

    await tx.trip.update({
      where: { id: trip.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    if (locked.status === "DISPATCHED") {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
  });
}
