"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { driverSchema } from "@/modules/drivers/driver.schema";
import {
  createDriver,
  updateDriver,
  setDriverStatus,
} from "@/modules/drivers/driver.service";

function parseDriver(formData: FormData) {
  return driverSchema.safeParse({
    name: formData.get("name"),
    licenseNumber: formData.get("licenseNumber"),
    licenseCategory: formData.get("licenseCategory"),
    licenseExpiryDate: formData.get("licenseExpiryDate"),
    contactNumber: formData.get("contactNumber"),
    safetyScore: formData.get("safetyScore"),
  });
}

function fieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const fe: Record<string, string> = {};
  for (const i of issues) fe[String(i.path[0])] = i.message;
  return fe;
}

export async function createDriverAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
    const parsed = parseDriver(formData);
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
    }
    await createDriver(companyId, parsed.data);
    revalidatePath("/drivers");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function updateDriverAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
    const parsed = parseDriver(formData);
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
    }
    await updateDriver(companyId, id, parsed.data);
    revalidatePath("/drivers");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function setDriverStatusAction(
  id: string,
  status: string,
): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
    await setDriverStatus(companyId, id, status);
    revalidatePath("/drivers");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
