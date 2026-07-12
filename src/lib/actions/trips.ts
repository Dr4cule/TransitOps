"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { createTripSchema, completeTripSchema } from "@/modules/trips/trip.schema";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from "@/modules/trips/trip.service";

function fieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fe: Record<string, string> = {};
  for (const i of issues) fe[String(i.path[0])] = i.message;
  return fe;
}

export async function createTripAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["DRIVER"]);
    const parsed = createTripSchema.safeParse({
      source: formData.get("source"),
      destination: formData.get("destination"),
      vehicleId: formData.get("vehicleId"),
      driverId: formData.get("driverId"),
      cargoWeightKg: formData.get("cargoWeightKg"),
      plannedDistanceKm: formData.get("plannedDistanceKm"),
    });
    if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
    await createTrip(parsed.data);
    revalidatePath("/trips");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function dispatchTripAction(id: string): Promise<ActionState> {
  try {
    await assertRole(["DRIVER"]);
    await dispatchTrip(id);
    revalidatePath("/trips");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function cancelTripAction(id: string): Promise<ActionState> {
  try {
    await assertRole(["DRIVER"]);
    await cancelTrip(id);
    revalidatePath("/trips");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function completeTripAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertRole(["DRIVER"]);
    const parsed = completeTripSchema.safeParse({
      actualDistanceKm: formData.get("actualDistanceKm"),
      fuelConsumedL: formData.get("fuelConsumedL"),
      fuelCost: formData.get("fuelCost"),
    });
    if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
    await completeTrip(id, parsed.data);
    revalidatePath("/trips");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
