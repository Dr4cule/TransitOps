import { z } from "zod";

export const VEHICLE_TYPES = ["Van", "Truck", "Mini", "Trailer", "Bus"] as const;
export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;

/** Coerce a form string → number with friendly messages. */
const positive = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).positive(`${label} must be greater than 0`);
const nonNeg = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).min(0, `${label} cannot be negative`);

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1, "Name / model is required"),
  type: z.enum(VEHICLE_TYPES, { message: "Pick a vehicle type" }),
  maxLoadCapacityKg: positive("Max load capacity"),
  odometerKm: nonNeg("Odometer"),
  acquisitionCost: nonNeg("Acquisition cost"),
  region: z.string().trim().optional().or(z.literal("")),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
