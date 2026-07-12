"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalCard } from "@/components/ui/brutal-card";
import { type ActionState } from "@/lib/action-state";
import { createTripAction } from "@/lib/actions/trips";

export type PickerVehicle = { id: string; name: string; maxLoadCapacityKg: number };
export type PickerDriver = { id: string; name: string };

const initial: ActionState = { ok: true };

export function CreateTripForm({
  vehicles,
  drivers,
}: {
  vehicles: PickerVehicle[];
  drivers: PickerDriver[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createTripAction, initial);
  const [vehicleId, setVehicleId] = useState("");
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    if (state.ok && (vehicleId || cargo)) {
      // created — reset the live-validation inputs and refresh the board
      setVehicleId("");
      setCargo("");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const selected = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId],
  );
  const cargoNum = Number(cargo);
  const capacity = selected?.maxLoadCapacityKg ?? 0;
  const overBy = selected && cargoNum > 0 ? cargoNum - capacity : 0;
  const exceeded = overBy > 0;
  const noneAvailable = vehicles.length === 0 || drivers.length === 0;
  const fe = !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <BrutalCard className="p-5">
      <div className="label mb-3">Create Trip</div>
      <form action={formAction} className="space-y-4">
        <Field label="Source" error={fe.source}>
          <Input name="source" placeholder="Gandhinagar Depot" />
        </Field>
        <Field label="Destination" error={fe.destination}>
          <Input name="destination" placeholder="Ahmedabad Hub" />
        </Field>

        <Field label="Vehicle (available only)" error={fe.vehicleId}>
          <Select
            name="vehicleId"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="" disabled>
              {vehicles.length ? "Select vehicle…" : "None available"}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.maxLoadCapacityKg} kg
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Driver (available only)" error={fe.driverId}>
          <Select name="driverId" defaultValue="">
            <option value="" disabled>
              {drivers.length ? "Select driver…" : "None available"}
            </option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cargo Weight (kg)" error={fe.cargoWeightKg}>
            <Input
              name="cargoWeightKg"
              type="number"
              step="0.01"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="450"
            />
          </Field>
          <Field label="Planned Distance (km)" error={fe.plannedDistanceKm}>
            <Input name="plannedDistanceKm" type="number" step="0.01" placeholder="38" />
          </Field>
        </div>

        {/* Live cargo-vs-capacity validation (Rule 5) */}
        {selected && cargoNum > 0 && (
          <div
            className={`border-2 rounded-[4px] px-3 py-2 text-sm ${
              exceeded
                ? "border-st-red bg-st-red/15 text-st-red"
                : "border-st-green bg-st-green/15 text-st-green"
            }`}
          >
            {exceeded ? (
              <>✕ Capacity exceeded by {overBy} kg — dispatch will be blocked.</>
            ) : (
              <>✓ Within capacity ({cargoNum} / {capacity} kg).</>
            )}
          </div>
        )}

        {!state.ok && state.error && (
          <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
            ✕ {state.error}
          </div>
        )}

        {exceeded ? (
          <BrutalButton type="button" disabled className="w-full">
            Dispatch blocked — over capacity
          </BrutalButton>
        ) : (
          <SubmitButton className="w-full" pendingLabel="Creating…">
            Create Trip (Draft)
          </SubmitButton>
        )}
        {noneAvailable && (
          <p className="font-mono text-xs text-fg-dim text-center">
            Need at least one available vehicle and driver to dispatch.
          </p>
        )}
      </form>
    </BrutalCard>
  );
}
