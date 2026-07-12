import { requireAccess } from "@/lib/rbac";
import {
  listMaintenanceLogs,
  vehiclesForMaintenance,
} from "@/modules/maintenance/maintenance.repository";
import { inr } from "@/lib/utils";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { BrutalCard } from "@/components/ui/brutal-card";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { CloseButton } from "@/components/maintenance/CloseButton";

const MAINT_PILL: Record<string, { bg: string; label: string }> = {
  ACTIVE: { bg: "bg-st-orange", label: "In Shop" },
  CLOSED: { bg: "bg-st-green", label: "Completed" },
};

function MaintPill({ status }: { status: string }) {
  const s = MAINT_PILL[status] ?? { bg: "bg-st-grey", label: status };
  return (
    <span
      className={`inline-block border-2 border-ink rounded-[4px] px-2 py-0.5 font-mono text-[11px] uppercase text-ink ${s.bg}`}
    >
      {s.label}
    </span>
  );
}

export default async function MaintenancePage() {
  const { access, session } = await requireAccess("maintenance", "view");
  const canEdit = access === "crud";

  const [vehicles, logs] = await Promise.all([
    vehiclesForMaintenance(session.companyId),
    listMaintenanceLogs(session.companyId),
  ]);

  const vehicleOptions = vehicles.map((v) => ({ id: v.id, name: v.name }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-fg">Maintenance</h1>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          {canEdit ? (
            <MaintenanceForm vehicles={vehicleOptions} />
          ) : (
            <BrutalCard className="p-5">
              <p className="text-sm text-fg-dim">
                You have read-only access to maintenance records.
              </p>
            </BrutalCard>
          )}
          <p className="label">
            Active → In Shop · Close → Available unless Retired
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-fg">Service Log</h2>
          <BrutalTable
            headers={[
              { label: "Vehicle" },
              { label: "Service" },
              { label: "Cost", align: "right" },
              { label: "Status" },
              ...(canEdit ? [{ label: "Actions", align: "right" as const }] : []),
            ]}
          >
            {logs.length === 0 ? (
              <Tr>
                <Td className="text-fg-dim">No service records yet.</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                {canEdit && <Td>{""}</Td>}
              </Tr>
            ) : (
              logs.map((log) => (
                <Tr key={log.id}>
                  <Td>{log.vehicle.name}</Td>
                  <Td>{log.description}</Td>
                  <Td mono align="right">{inr(Number(log.cost))}</Td>
                  <Td><MaintPill status={log.status} /></Td>
                  {canEdit && (
                    <Td align="right">
                      {log.status === "ACTIVE" && <CloseButton logId={log.id} />}
                    </Td>
                  )}
                </Tr>
              ))
            )}
          </BrutalTable>
        </div>
      </div>
    </div>
  );
}
