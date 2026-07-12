import { z } from "zod";

export const LICENSE_CATEGORIES = ["LMV", "HMV"] as const;
export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;

export const driverSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  licenseNumber: z
    .string()
    .trim()
    .min(1, "License number is required")
    .transform((s) => s.toUpperCase()),
  licenseCategory: z.enum(LICENSE_CATEGORIES, { message: "Pick a license category" }),
  licenseExpiryDate: z.string().trim().min(1, "Expiry required"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  safetyScore: z.coerce
    .number({ message: "Safety score must be a number" })
    .min(0, "Safety score cannot be negative")
    .max(100, "Safety score cannot exceed 100"),
});

export type DriverInput = z.infer<typeof driverSchema>;
