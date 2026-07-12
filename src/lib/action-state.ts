/** Standard Server Action result. `ok:false` carries a top-level error and/or
 *  per-field errors keyed by field name. */
export type ActionState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export const OK: ActionState = { ok: true };

export function fail(error: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, error, fieldErrors };
}

/** Map a caught error (incl. Zod flatten + Prisma unique violation) to an ActionState. */
export function toActionState(e: unknown): ActionState {
  if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
    return { ok: false, error: "That value must be unique — it already exists." };
  }
  // BusinessRuleError and friends carry user-safe messages.
  const message = e instanceof Error ? e.message : "Something went wrong.";
  return { ok: false, error: message };
}
