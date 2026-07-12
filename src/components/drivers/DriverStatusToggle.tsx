"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setDriverStatusAction } from "@/lib/actions/drivers";

const OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export function DriverStatusToggle({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const setStatus = (target: string) => {
    if (target === status) return;
    setErr(null);
    start(async () => {
      const res = await setDriverStatusAction(id, target);
      if (!res.ok) setErr(res.error ?? "Failed");
      else router.refresh();
    });
  };

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center gap-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={pending}
            onClick={() => setStatus(o.value)}
            className={cn(
              "border-2 border-ink rounded-[4px] px-2 py-1 text-xs font-bold brutal-press shadow-brutal-sm disabled:opacity-50",
              status === o.value ? "bg-brand text-brand-ink" : "bg-panel-3 text-fg",
            )}
          >
            {o.label}
          </button>
        ))}
      </span>
      {err && <span className="font-mono text-[10px] text-st-red">{err}</span>}
    </span>
  );
}
