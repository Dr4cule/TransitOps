"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { type ActionState } from "@/lib/action-state";
import { openMaintenanceAction } from "@/lib/actions/maintenance";

const initial: ActionState = { ok: true };

export function MaintenanceForm({
  vehicles,
}: {
  vehicles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(openMaintenanceAction, initial);

  // Reset + refresh when the record is logged.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fe = !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <BrutalCard className="p-5">
      <h2 className="text-lg font-bold text-fg">Log Service Record</h2>
      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <Field label="Vehicle" error={fe.vehicleId}>
          <Select name="vehicleId" defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Service Type / Description" error={fe.description}>
          <Input name="description" placeholder="Brake pad replacement" />
        </Field>
        <Field label="Cost (₹)" error={fe.cost}>
          <Input name="cost" type="number" step="0.01" placeholder="0" defaultValue="0" />
        </Field>

        {!state.ok && state.error && (
          <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
            ✕ {state.error}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>
    </BrutalCard>
  );
}
