import { prisma } from "@/lib/prisma";
import type { ExpenseInput } from "./expense.schema";

/** Record a non-fuel expense (toll, maintenance passthrough, other). */
export async function addExpense(input: ExpenseInput) {
  return prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      category: input.category,
      amount: input.amount,
      notes: input.notes || null,
    },
  });
}
