"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { type ActionState } from "@/lib/action-state";
import {
  createVehicleAction,
  updateVehicleAction,
} from "@/lib/actions/vehicles";
import { VEHICLE_TYPES } from "@/modules/vehicles/vehicle.schema";

export type VehicleRow = {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: string;
  odometerKm: string;
  acquisitionCost: string;
  region: string | null;
};

const initial: ActionState = { ok: true };

export function VehicleFormModal({ editing }: { editing?: VehicleRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(editing);
  const action = isEdit
    ? updateVehicleAction.bind(null, editing!.id)
    : createVehicleAction;
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
          + Add Vehicle
        </BrutalButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? `Edit ${editing!.name}` : "Add Vehicle"}
      >
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration No." error={fe.registrationNumber}>
              <Input
                name="registrationNumber"
                defaultValue={editing?.registrationNumber}
                placeholder="GJ01AB1234"
              />
            </Field>
            <Field label="Name / Model" error={fe.name}>
              <Input name="name" defaultValue={editing?.name} placeholder="VAN-05" />
            </Field>
            <Field label="Type" error={fe.type}>
              <Select name="type" defaultValue={editing?.type ?? ""}>
                <option value="" disabled>
                  Select…
                </option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Region" error={fe.region}>
              <Input name="region" defaultValue={editing?.region ?? ""} placeholder="Ahmedabad" />
            </Field>
            <Field label="Max Load (kg)" error={fe.maxLoadCapacityKg}>
              <Input
                name="maxLoadCapacityKg"
                type="number"
                step="0.01"
                defaultValue={editing?.maxLoadCapacityKg}
                placeholder="500"
              />
            </Field>
            <Field label="Odometer (km)" error={fe.odometerKm}>
              <Input
                name="odometerKm"
                type="number"
                step="0.01"
                defaultValue={editing?.odometerKm ?? "0"}
                placeholder="0"
              />
            </Field>
            <Field label="Acquisition Cost (₹)" error={fe.acquisitionCost} className="col-span-2">
              <Input
                name="acquisitionCost"
                type="number"
                step="0.01"
                defaultValue={editing?.acquisitionCost}
                placeholder="600000"
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
            <SubmitButton>{isEdit ? "Save Changes" : "Add Vehicle"}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
