import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Pick a vehicle"),
  driverId: z.string().min(1, "Pick a driver"),
  cargoWeightKg: z.coerce
    .number({ message: "Cargo weight must be a number" })
    .positive("Cargo weight must be greater than 0"),
  plannedDistanceKm: z.coerce
    .number({ message: "Planned distance must be a number" })
    .positive("Planned distance must be greater than 0"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const completeTripSchema = z.object({
  actualDistanceKm: z.coerce
    .number({ message: "Final distance must be a number" })
    .positive("Final distance must be greater than 0"),
  fuelConsumedL: z.coerce
    .number({ message: "Fuel consumed must be a number" })
    .positive("Fuel consumed must be greater than 0"),
  fuelCost: z.coerce
    .number({ message: "Fuel cost must be a number" })
    .min(0, "Fuel cost cannot be negative"),
});

export type CompleteTripInput = z.infer<typeof completeTripSchema>;
