"use client";

import { useState, useTransition } from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { StatusPill } from "@/components/ui/status-pill";
import { type ActionState } from "@/lib/action-state";
import {
  dispatchTripAction,
  cancelTripAction,
  completeTripAction,
} from "@/lib/actions/trips";

export type BoardTrip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  vehicle: string;
  driver: string;
  status: string;
};

const initial: ActionState = { ok: true };

function CompleteModal({ id, onDone }: { id: string; onDone: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(completeTripAction.bind(null, id), initial);

  useEffect(() => {
    if (open && state.ok) {
      setOpen(false);
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fe = !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <>
      <BrutalButton type="button" size="sm" onClick={() => setOpen(true)}>
        Complete
      </BrutalButton>
      <Modal open={open} onClose={() => setOpen(false)} title="Complete Trip">
        <form action={formAction} className="space-y-4">
          <Field label="Final Distance (km)" error={fe.actualDistanceKm}>
            <Input name="actualDistanceKm" type="number" step="0.01" placeholder="112" />
          </Field>
          <Field label="Fuel Consumed (L)" error={fe.fuelConsumedL}>
            <Input name="fuelConsumedL" type="number" step="0.01" placeholder="13.4" />
          </Field>
          <Field label="Fuel Cost (₹)" error={fe.fuelCost}>
            <Input name="fuelCost" type="number" step="0.01" placeholder="1010" />
          </Field>
          <Field label="Revenue (₹)" error={fe.revenue}>
            <Input name="revenue" type="number" step="0.01" placeholder="8500" />
          </Field>
          {!state.ok && state.error && (
            <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
              ✕ {state.error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <BrutalButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </BrutalButton>
            <SubmitButton pendingLabel="Completing…">Confirm Complete</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ActionBtn({
  label,
  variant,
  run,
}: {
  label: string;
  variant: "primary" | "secondary" | "danger";
  run: () => Promise<ActionState>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <BrutalButton
        type="button"
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => {
          setErr(null);
          start(async () => {
            const res = await run();
            if (!res.ok) setErr(res.error ?? "Failed");
            else router.refresh();
          });
        }}
      >
        {pending ? "…" : label}
      </BrutalButton>
      {err && <span className="font-mono text-[10px] text-st-red max-w-52">{err}</span>}
    </span>
  );
}

export function LiveBoard({ trips, canManage }: { trips: BoardTrip[]; canManage: boolean }) {
  if (trips.length === 0) {
    return <p className="text-fg-dim">No trips yet — create one on the left.</p>;
  }
  return (
    <div className="space-y-3">
      {trips.map((t) => (
        <div key={t.id} className="border-[3px] border-ink bg-panel-2 shadow-brutal rounded-[4px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="tnum text-sm text-fg-dim">{t.code}</div>
              <div className="font-bold text-fg">
                {t.source} <span className="text-fg-dim">→</span> {t.destination}
              </div>
              <div className="mt-1 text-sm text-fg-dim tnum">
                {t.vehicle} · {t.driver}
              </div>
            </div>
            <StatusPill kind="trip" status={t.status} />
          </div>
          {canManage && (t.status === "DRAFT" || t.status === "DISPATCHED") && (
            <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-panel-3 pt-3">
              {t.status === "DRAFT" && (
                <ActionBtn label="Dispatch →" variant="primary" run={() => dispatchTripAction(t.id)} />
              )}
              {t.status === "DISPATCHED" && <CompleteModal id={t.id} onDone={() => {}} />}
              <ActionBtn label="Cancel" variant="danger" run={() => cancelTripAction(t.id)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
