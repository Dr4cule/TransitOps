import { requireAccess } from "@/lib/rbac";
import { listVehicles, vehicleRegions } from "@/modules/vehicles/vehicle.repository";
import { VEHICLE_TYPES } from "@/modules/vehicles/vehicle.schema";
import { inr, num } from "@/lib/utils";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { StatusPill } from "@/components/ui/status-pill";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ListFilters } from "@/components/ui/list-filters";
import { ExportButton } from "@/components/export-button";
import { VehicleFormModal, type VehicleRow } from "@/components/vehicles/VehicleForm";
import { RetireButton } from "@/components/vehicles/RetireButton";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>;
}) {
  const { access } = await requireAccess("fleet", "view");
  const canEdit = access === "crud";
  const sp = await searchParams;
  const [vehicles, regions] = await Promise.all([
    listVehicles({ type: sp.type, status: sp.status, search: sp.q }),
    vehicleRegions(),
  ]);
  void regions;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Vehicle Registry</h1>
        <div className="flex items-center gap-3">
          <ExportButton dataset="vehicles" label="Export CSV" />
          {canEdit && <VehicleFormModal />}
        </div>
      </div>

      <BrutalCard className="p-4">
        <ListFilters
          searchKey="q"
          searchPlaceholder="Search reg no / name…"
          selects={[
            {
              name: "type",
              label: "Type",
              options: [
                { value: "all", label: "Type: All" },
                ...VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
              ],
            },
            {
              name: "status",
              label: "Status",
              options: [
                { value: "all", label: "Status: All" },
                { value: "AVAILABLE", label: "Available" },
                { value: "ON_TRIP", label: "On Trip" },
                { value: "IN_SHOP", label: "In Shop" },
                { value: "RETIRED", label: "Retired" },
              ],
            },
          ]}
        />
      </BrutalCard>

      <BrutalTable
        headers={[
          { label: "Reg No." },
          { label: "Name / Model" },
          { label: "Type" },
          { label: "Capacity", align: "right" },
          { label: "Odometer", align: "right" },
          { label: "Acq. Cost", align: "right" },
          { label: "Status" },
          ...(canEdit ? [{ label: "Actions", align: "right" as const }] : []),
        ]}
      >
        {vehicles.length === 0 ? (
          <Tr>
            <Td className="text-fg-dim" >No vehicles registered — add your first.</Td>
            <Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td>
            {canEdit && <Td>{""}</Td>}
          </Tr>
        ) : (
          vehicles.map((v) => {
            const row: VehicleRow = {
              id: v.id,
              registrationNumber: v.registrationNumber,
              name: v.name,
              type: v.type,
              maxLoadCapacityKg: v.maxLoadCapacityKg.toString(),
              odometerKm: v.odometerKm.toString(),
              acquisitionCost: v.acquisitionCost.toString(),
              region: v.region,
            };
            return (
              <Tr key={v.id}>
                <Td mono>{v.registrationNumber}</Td>
                <Td>{v.name}</Td>
                <Td>{v.type}</Td>
                <Td mono align="right">{num(Number(v.maxLoadCapacityKg))} kg</Td>
                <Td mono align="right">{num(Number(v.odometerKm))}</Td>
                <Td mono align="right">{inr(Number(v.acquisitionCost))}</Td>
                <Td><StatusPill kind="vehicle" status={v.status} /></Td>
                {canEdit && (
                  <Td align="right">
                    <span className="inline-flex items-center gap-2">
                      <VehicleFormModal editing={row} />
                      {v.status !== "RETIRED" && <RetireButton id={v.id} name={v.name} />}
                    </span>
                  </Td>
                )}
              </Tr>
            );
          })
        )}
      </BrutalTable>

      <p className="label">
        Rule: Registration No. must be unique · Retired / In Shop vehicles are hidden from Trip dispatch.
      </p>
    </div>
  );
}
