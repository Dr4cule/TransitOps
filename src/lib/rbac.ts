import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";
import { canAccess, type Domain, type Access } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";

/** Require a logged-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Require access to a domain; redirect if the role has none. */
export async function requireAccess(
  domain: Domain,
  need: Access = "view",
): Promise<{ session: SessionPayload; access: Access }> {
  const session = await requireUser();
  const access = canAccess(session.role, domain);
  if (!access) redirect("/dashboard");
  if (need === "crud" && access !== "crud") redirect("/dashboard");
  return { session, access };
}

/** Guard for server actions — throws instead of redirecting. */
export async function assertRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!allowed.includes(session.role)) throw new Error("Forbidden");
  return session;
}
