import { requireAccess } from "@/lib/rbac";
import { listDrivers } from "@/modules/drivers/driver.repository";
import { DRIVER_STATUSES } from "@/modules/drivers/driver.schema";
import { num } from "@/lib/utils";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { StatusPill } from "@/components/ui/status-pill";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ListFilters } from "@/components/ui/list-filters";
import { ExportButton } from "@/components/export-button";
import { DriverFormModal, type DriverRow } from "@/components/drivers/DriverForm";
import { DriverStatusToggle } from "@/components/drivers/DriverStatusToggle";

/** yyyy-mm-dd (local) for a date value. */
function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { access, session } = await requireAccess("drivers", "view");
  const canEdit = access === "crud";
  const sp = await searchParams;
  const drivers = await listDrivers(session.companyId, { status: sp.status, search: sp.q });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Drivers &amp; Safety</h1>
        <div className="flex items-center gap-3">
          <ExportButton dataset="drivers" label="Export CSV" />
          {canEdit && <DriverFormModal />}
        </div>
      </div>

      <BrutalCard className="p-4">
        <ListFilters
          searchKey="q"
          searchPlaceholder="Search name / license no…"
          selects={[
            {
              name: "status",
              label: "Status",
              options: [
                { value: "all", label: "Status: All" },
                ...DRIVER_STATUSES.map((s) => ({
                  value: s,
                  label: s
                    .split("_")
                    .map((w) => w[0] + w.slice(1).toLowerCase())
                    .join(" "),
                })),
              ],
            },
          ]}
        />
      </BrutalCard>

      <BrutalTable
        headers={[
          { label: "Driver" },
          { label: "License No" },
          { label: "Category" },
          { label: "Expiry" },
          { label: "Contact" },
          { label: "Trip Compl", align: "right" },
          { label: "Status" },
          ...(canEdit ? [{ label: "Actions", align: "right" as const }] : []),
        ]}
      >
        {drivers.length === 0 ? (
          <Tr>
            <Td className="text-fg-dim">No drivers registered — add your first.</Td>
            <Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td>
            {canEdit && <Td>{""}</Td>}
          </Tr>
        ) : (
          drivers.map((d) => {
            const expiry = new Date(d.licenseExpiryDate);
            const expired = expiry < today;
            const row: DriverRow = {
              id: d.id,
              name: d.name,
              licenseNumber: d.licenseNumber,
              licenseCategory: d.licenseCategory,
              licenseExpiryDate: toDateInput(expiry),
              contactNumber: d.contactNumber,
              safetyScore: d.safetyScore.toString(),
            };
            return (
              <Tr key={d.id}>
                <Td>{d.name}</Td>
                <Td mono>{d.licenseNumber}</Td>
                <Td>{d.licenseCategory}</Td>
                <Td mono>
                  {expired ? (
                    <span className="text-st-orange font-bold">
                      {toDateInput(expiry)} EXPIRED
                    </span>
                  ) : (
                    toDateInput(expiry)
                  )}
                </Td>
                <Td mono>{d.contactNumber}</Td>
                <Td mono align="right">{num(d._count.trips)}</Td>
                <Td><StatusPill kind="driver" status={d.status} /></Td>
                {canEdit && (
                  <Td align="right">
                    <span className="inline-flex items-center gap-2">
                      <DriverFormModal editing={row} />
                      {d.status === "ON_TRIP" ? (
                        <StatusPill kind="driver" status={d.status} />
                      ) : (
                        <DriverStatusToggle id={d.id} status={d.status} />
                      )}
                    </span>
                  </Td>
                )}
              </Tr>
            );
          })
        )}
      </BrutalTable>

      <p className="label">
        Rule: Expired licence or Suspended status → blocked from trip assignment.
      </p>
    </div>
  );
}
