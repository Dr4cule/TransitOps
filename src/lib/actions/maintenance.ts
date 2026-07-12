"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { maintenanceSchema } from "@/modules/maintenance/maintenance.schema";
import { openMaintenance, closeMaintenance } from "@/modules/maintenance/maintenance.service";

export async function openMaintenanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["FLEET_MANAGER"]);
    const parsed = maintenanceSchema.safeParse({
      vehicleId: formData.get("vehicleId"),
      description: formData.get("description"),
      cost: formData.get("cost"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await openMaintenance(companyId, parsed.data);
    revalidatePath("/maintenance");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function closeMaintenanceAction(logId: string): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["FLEET_MANAGER"]);
    await closeMaintenance(companyId, logId);
    revalidatePath("/maintenance");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
