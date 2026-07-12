"use server";

import { requireUser } from "@/lib/rbac";
import { globalSearch, type SearchHit } from "@/lib/queries/search";

/** Global search server action for the top bar. Company-scoped + role-aware. */
export async function searchAction(query: string): Promise<SearchHit[]> {
  const session = await requireUser();
  return globalSearch(session.companyId, session.role, query);
}
