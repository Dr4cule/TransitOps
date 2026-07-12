"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { type ActionState } from "@/lib/action-state";
import { addExpenseAction } from "@/lib/actions/finance";
import { EXPENSE_CATEGORIES } from "@/modules/fuel-expenses/expense.schema";

const initial: ActionState = { ok: true };

export function ExpenseForm({ vehicles }: { vehicles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addExpenseAction, initial);

  useEffect(() => {
    if (open && state.ok) {
      setOpen(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fe = !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <>
      <BrutalButton type="button" size="sm" onClick={() => setOpen(true)}>
        + Add Expense
      </BrutalButton>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense">
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Category" error={fe.category}>
              <Select name="category" defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (₹)" error={fe.amount}>
              <Input name="amount" type="number" step="0.01" placeholder="500" />
            </Field>
            <Field label="Notes" error={fe.notes}>
              <Input name="notes" placeholder="Optional…" />
            </Field>
          </div>

          {!state.ok && state.error && (
            <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
              ✕ {state.error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <BrutalButton type="button" variant="secondary" size="md" onClick={() => setOpen(false)}>
              Cancel
            </BrutalButton>
            <SubmitButton>Add Expense</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
