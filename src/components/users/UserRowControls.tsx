"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction, setUserActiveAction } from "@/lib/actions/users";
import { ASSIGNABLE_ROLES, ROLE_LABEL } from "@/lib/constants";

/** Inline role dropdown that persists on change. */
export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <select
        defaultValue={role}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setErr(null);
          start(async () => {
            const res = await setUserRoleAction(userId, next);
            if (!res.ok) setErr(res.error ?? "Failed");
            else router.refresh();
          });
        }}
        className="border-2 border-ink bg-panel rounded-[4px] px-2 py-1 text-sm font-bold text-fg focus:outline-none focus:border-brand"
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {err && <span className="font-mono text-[10px] text-st-red">{err}</span>}
    </span>
  );
}

/** Activate / deactivate toggle. */
export function ActiveToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
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
            const res = await setUserActiveAction(userId, !isActive);
            if (!res.ok) setErr(res.error ?? "Failed");
            else router.refresh();
          });
        }}
        className={`border-2 border-ink rounded-[4px] px-2.5 py-1 text-xs font-bold brutal-press shadow-brutal-sm ${
          isActive ? "bg-panel-3 text-fg" : "bg-st-green text-ink"
        }`}
      >
        {pending ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </button>
      {err && <span className="font-mono text-[10px] text-st-red max-w-40 text-right">{err}</span>}
    </span>
  );
}
