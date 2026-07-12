"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { fuelSchema, expenseSchema } from "@/modules/fuel-expenses/expense.schema";
import { logFuel } from "@/modules/fuel-expenses/fuel.service";
import { addExpense } from "@/modules/fuel-expenses/expense.service";

export async function logFuelAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["FINANCIAL_ANALYST"]);
    const parsed = fuelSchema.safeParse({
      vehicleId: formData.get("vehicleId"),
      liters: formData.get("liters"),
      cost: formData.get("cost"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await logFuel(parsed.data);
    revalidatePath("/expenses");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function addExpenseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["FINANCIAL_ANALYST"]);
    const parsed = expenseSchema.safeParse({
      vehicleId: formData.get("vehicleId"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await addExpense(parsed.data);
    revalidatePath("/expenses");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
