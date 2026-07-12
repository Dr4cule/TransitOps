"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { type ActionState, OK, fail, toActionState } from "@/lib/action-state";
import { createUserSchema } from "@/modules/users/user.schema";
import {
  createCompanyUser,
  setUserRole,
  setUserActive,
} from "@/modules/users/user.service";
import { ASSIGNABLE_ROLES } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["ADMIN"]);
    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      emailLocal: formData.get("emailLocal"),
      role: formData.get("role"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      return fail("Please fix the highlighted fields.", fe);
    }
    await createCompanyUser(companyId, parsed.data);
    revalidatePath("/users");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function setUserRoleAction(userId: string, role: string): Promise<ActionState> {
  try {
    const { companyId } = await assertRole(["ADMIN"]);
    if (!ASSIGNABLE_ROLES.includes(role as Role)) return fail("Invalid role.");
    await setUserRole(companyId, userId, role as Role);
    revalidatePath("/users");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}

export async function setUserActiveAction(userId: string, isActive: boolean): Promise<ActionState> {
  try {
    const { companyId, userId: actingUserId } = await assertRole(["ADMIN"]);
    await setUserActive(companyId, actingUserId, userId, isActive);
    revalidatePath("/users");
    return OK;
  } catch (e) {
    return toActionState(e);
  }
}
