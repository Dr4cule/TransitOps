"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { type ActionState } from "@/lib/action-state";
import {
  createDriverAction,
  updateDriverAction,
} from "@/lib/actions/drivers";
import { LICENSE_CATEGORIES } from "@/modules/drivers/driver.schema";

export type DriverRow = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: string;
};

const initial: ActionState = { ok: true };

export function DriverFormModal({ editing }: { editing?: DriverRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(editing);
  const action = isEdit
    ? updateDriverAction.bind(null, editing!.id)
    : createDriverAction;
  const [state, formAction] = useActionState(action, initial);

  // Close + refresh when the action succeeds (only while open).
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
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-2 border-ink bg-panel-3 rounded-[4px] px-2 py-1 text-xs font-bold text-fg brutal-press shadow-brutal-sm"
        >
          Edit
        </button>
      ) : (
        <BrutalButton type="button" size="sm" onClick={() => setOpen(true)}>
          + Add Driver
        </BrutalButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? `Edit ${editing!.name}` : "Add Driver"}
      >
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" error={fe.name}>
              <Input name="name" defaultValue={editing?.name} placeholder="Ravi Kumar" />
            </Field>
            <Field label="License No." error={fe.licenseNumber}>
              <Input
                name="licenseNumber"
                defaultValue={editing?.licenseNumber}
                placeholder="GJ0120210001234"
              />
            </Field>
            <Field label="Category" error={fe.licenseCategory}>
              <Select name="licenseCategory" defaultValue={editing?.licenseCategory ?? ""}>
                <option value="" disabled>
                  Select…
                </option>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="License Expiry" error={fe.licenseExpiryDate}>
              <Input
                name="licenseExpiryDate"
                type="date"
                defaultValue={editing?.licenseExpiryDate}
              />
            </Field>
            <Field label="Contact" error={fe.contactNumber}>
              <Input
                name="contactNumber"
                defaultValue={editing?.contactNumber}
                placeholder="+91 98250 12345"
              />
            </Field>
            <Field label="Safety Score" error={fe.safetyScore}>
              <Input
                name="safetyScore"
                type="number"
                step="0.01"
                defaultValue={editing?.safetyScore ?? "100"}
                placeholder="100"
              />
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
            <SubmitButton>{isEdit ? "Save Changes" : "Add Driver"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
