import { z } from "zod";
import { ASSIGNABLE_ROLES } from "@/lib/constants";

const roleValues = ASSIGNABLE_ROLES as [string, ...string[]];

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  emailLocal: z
    .string()
    .trim()
    .min(1, "Email is required")
    .regex(/^[^@\s]+$/, "Enter just the part before @ (no spaces or @)")
    .transform((s) => s.toLowerCase()),
  role: z.enum(roleValues, { message: "Pick a role" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(roleValues, { message: "Pick a role" }),
});
