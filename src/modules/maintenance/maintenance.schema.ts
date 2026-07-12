import { z } from "zod";

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Pick a vehicle"),
  description: z.string().trim().min(1, "Service description required"),
  cost: z.coerce
    .number({ message: "Cost must be a number" })
    .nonnegative("Cost cannot be negative"),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
