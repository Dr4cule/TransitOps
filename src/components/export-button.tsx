"use client";

import { BrutalButton } from "@/components/ui/brutal-button";

/** Triggers a CSV download from the export route handler. */
export function ExportButton({
  dataset,
  label = "Export CSV",
}: {
  dataset: string;
  label?: string;
}) {
  return (
    <BrutalButton
      type="button"
      size="sm"
      onClick={() => {
        window.location.href = `/api/export/${dataset}`;
      }}
    >
      ↓ {label}
    </BrutalButton>
  );
}
