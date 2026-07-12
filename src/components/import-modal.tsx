"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { importCsvAction, type ImportState } from "@/lib/actions/import";
import type { ImportDataset } from "@/lib/queries/import";

const initial: ImportState = null;

const LABELS: Record<ImportDataset, string> = {
  vehicles: "Vehicles",
  drivers: "Drivers",
  fuel: "Fuel Logs",
  expenses: "Expenses",
};

const HINTS: Record<ImportDataset, string> = {
  vehicles: "Columns: registration_number, name, type, max_load_capacity_kg, odometer_km, acquisition_cost, status, region.",
  drivers: "Columns: name, license_number, license_category (LMV/HMV), license_expiry_date (YYYY-MM-DD), contact_number, safety_score, status.",
  fuel: "Columns: vehicle (must match an existing vehicle name), date (YYYY-MM-DD), liters, cost.",
  expenses: "Columns: vehicle, category (TOLL/MAINTENANCE/OTHER), amount, date, notes.",
};

export function ImportModal({ dataset }: { dataset: ImportDataset }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(importCsvAction.bind(null, dataset), initial);

  // Refresh the list after a successful import (keep the modal open to show the summary).
  useEffect(() => {
    if (open && state?.ok && state.result.created > 0) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <BrutalButton type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        ↑ Import CSV
      </BrutalButton>

      <Modal open={open} onClose={() => setOpen(false)} title={`Import ${LABELS[dataset]}`}>
        <div className="space-y-4">
          <p className="text-sm text-fg-dim">{HINTS[dataset]}</p>

          <a
            href={`/api/sample/${dataset}`}
            className="inline-flex items-center gap-2 border-2 border-ink bg-panel-3 rounded-[4px] px-3 py-1.5 text-sm font-bold text-fg brutal-press shadow-brutal-sm"
          >
            ↓ Download sample CSV
          </a>

          <form action={formAction} className="space-y-4">
            <label className="block">
              <span className="label">CSV file</span>
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                className="mt-1.5 block w-full text-sm text-fg file:mr-3 file:border-2 file:border-ink file:bg-brand file:rounded-[4px] file:px-3 file:py-1.5 file:font-bold file:text-ink"
              />
            </label>

            {state && !state.ok && (
              <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
                ✕ {state.error}
              </div>
            )}

            {state?.ok && (
              <div className="border-2 border-ink bg-panel rounded-[4px] p-3 text-sm">
                <p className="font-bold text-st-green">
                  ✓ Imported {state.result.created} of {state.result.total} rows.
                </p>
                {state.result.skipped.length > 0 && (
                  <div className="mt-2">
                    <p className="font-bold text-st-orange">
                      {state.result.skipped.length} skipped:
                    </p>
                    <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto tnum text-xs text-fg-dim">
                      {state.result.skipped.map((s, i) => (
                        <li key={i}>Row {s.row}: {s.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <BrutalButton type="button" variant="secondary" onClick={() => setOpen(false)}>
                {state?.ok ? "Done" : "Cancel"}
              </BrutalButton>
              <SubmitButton pendingLabel="Importing…">Import</SubmitButton>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
