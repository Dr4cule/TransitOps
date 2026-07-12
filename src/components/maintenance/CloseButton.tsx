"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeMaintenanceAction } from "@/lib/actions/maintenance";

export function CloseButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setErr(null);
          start(async () => {
            const res = await closeMaintenanceAction(logId);
            if (!res.ok) setErr(res.error ?? "Failed");
            else router.refresh();
          });
        }}
        className="border-2 border-ink bg-panel-3 rounded-[4px] px-2 py-1 text-xs font-bold text-fg brutal-press shadow-brutal-sm disabled:opacity-50"
      >
        {pending ? "…" : "Close"}
      </button>
      {err && <span className="font-mono text-[10px] text-st-red">{err}</span>}
    </span>
  );
}
