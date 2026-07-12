"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction, setUserActiveAction, removeUserAction } from "@/lib/actions/users";
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

/** Remove a teammate from the company (with confirmation). */
export function RemoveButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (confirming) {
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-2">
          <span className="text-xs font-bold text-fg">Remove?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setErr(null);
              start(async () => {
                const res = await removeUserAction(userId);
                if (!res.ok) {
                  setErr(res.error ?? "Failed");
                  setConfirming(false);
                } else router.refresh();
              });
            }}
            className="border-2 border-ink bg-st-red rounded-[4px] px-2.5 py-1 text-xs font-bold text-ink brutal-press shadow-brutal-sm"
          >
            {pending ? "…" : "Yes, remove"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="border-2 border-ink bg-panel-3 rounded-[4px] px-2.5 py-1 text-xs font-bold text-fg brutal-press shadow-brutal-sm"
          >
            Cancel
          </button>
        </span>
        {err && <span className="font-mono text-[10px] text-st-red max-w-40 text-right">{err}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        title={`Remove ${name}`}
        onClick={() => setConfirming(true)}
        className="border-2 border-ink bg-panel-3 rounded-[4px] px-2.5 py-1 text-xs font-bold text-st-red brutal-press shadow-brutal-sm"
      >
        Remove
      </button>
      {err && <span className="font-mono text-[10px] text-st-red max-w-40 text-right">{err}</span>}
    </span>
  );
}
