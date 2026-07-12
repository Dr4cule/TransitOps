"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { vehicleSchema } from "@/modules/vehicles/vehicle.schema";
import {
  createVehicle,
  updateVehicle,
  retireVehicle,
} from "@/modules/vehicles/vehicle.service";

function parseVehicle(formData: FormData) {
  return vehicleSchema.safeParse({
    registrationNumber: formData.get("registrationNumber"),
    name: formData.get("name"),
    type: formData.get("type"),
    maxLoadCapacityKg: formData.get("maxLoadCapacityKg"),
    odometerKm: formData.get("odometerKm"),
    acquisitionCost: formData.get("acquisitionCost"),
    region: formData.get("region"),
  });
}

export async function createVehicleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["FLEET_MANAGER"]);
    const parsed = parseVehicle(formData);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await createVehicle(parsed.data);
    revalidatePath("/fleet");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function updateVehicleAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["FLEET_MANAGER"]);
    const parsed = parseVehicle(formData);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await updateVehicle(id, parsed.data);
    revalidatePath("/fleet");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function retireVehicleAction(id: string): Promise<ActionState> {
  try {
    await assertRole(["FLEET_MANAGER"]);
    await retireVehicle(id);
    revalidatePath("/fleet");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
