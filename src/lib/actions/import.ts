"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/rbac";
import { importCsv, type ImportDataset, type ImportResult } from "@/lib/queries/import";
import type { Role } from "@/generated/prisma/enums";

export type ImportState =
  | { ok: true; result: ImportResult }
  | { ok: false; error: string }
  | null;

/** Which role may import which dataset (mirrors the create-permission per domain). */
const ROLES: Record<ImportDataset, { roles: Role[]; path: string }> = {
  vehicles: { roles: ["FLEET_MANAGER"], path: "/fleet" },
  drivers: { roles: ["FLEET_MANAGER", "SAFETY_OFFICER"], path: "/drivers" },
  fuel: { roles: ["FINANCIAL_ANALYST"], path: "/expenses" },
  expenses: { roles: ["FINANCIAL_ANALYST"], path: "/expenses" },
};

export async function importCsvAction(
  dataset: ImportDataset,
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    const cfg = ROLES[dataset];
    if (!cfg) return { ok: false, error: "Unknown dataset." };
    const { companyId } = await assertRole(cfg.roles);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a .csv file to import." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, error: "File too large (max 2 MB)." };
    }
    const text = await file.text();
    const result = await importCsv(dataset, companyId, text);
    revalidatePath(cfg.path);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Import failed." };
  }
}
