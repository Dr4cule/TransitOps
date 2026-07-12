"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retireVehicleAction } from "@/lib/actions/vehicles";

export function RetireButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Retire ${name}? It will be removed from the dispatch pool.`)) return;
          setErr(null);
          start(async () => {
            const res = await retireVehicleAction(id);
            if (!res.ok) setErr(res.error ?? "Failed");
            else router.refresh();
          });
        }}
        className="border-2 border-ink bg-st-red/90 rounded-[4px] px-2 py-1 text-xs font-bold text-white brutal-press shadow-brutal-sm disabled:opacity-50"
      >
        {pending ? "…" : "Retire"}
      </button>
      {err && <span className="font-mono text-[10px] text-st-red">{err}</span>}
    </span>
  );
}
