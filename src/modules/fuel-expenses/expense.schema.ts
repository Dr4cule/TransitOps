import { z } from "zod";

export const EXPENSE_CATEGORIES = ["TOLL", "MAINTENANCE", "OTHER"] as const;

/** Coerce a form string → number with friendly messages. */
const positive = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).positive(`${label} must be greater than 0`);
const nonNeg = (label: string) =>
  z.coerce.number({ message: `${label} must be a number` }).min(0, `${label} cannot be negative`);

export const fuelSchema = z.object({
  vehicleId: z.string().trim().min(1, "Pick a vehicle"),
  liters: positive("Liters"),
  cost: nonNeg("Fuel cost"),
});

export const expenseSchema = z.object({
  vehicleId: z.string().trim().min(1, "Pick a vehicle"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Pick a category" }),
  amount: nonNeg("Amount"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type FuelInput = z.infer<typeof fuelSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
