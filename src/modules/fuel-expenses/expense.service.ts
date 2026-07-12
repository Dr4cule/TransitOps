import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import type { ExpenseInput } from "./expense.schema";

/** Record a non-fuel expense (toll, maintenance passthrough, other). */
export async function addExpense(companyId: string, input: ExpenseInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle || vehicle.companyId !== companyId)
    throw new BusinessRuleError("Selected vehicle no longer exists.");

  return prisma.expense.create({
    data: {
      companyId,
      vehicleId: input.vehicleId,
      category: input.category,
      amount: input.amount,
      notes: input.notes || null,
    },
  });
}
