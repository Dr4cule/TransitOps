import { requireAccess } from "@/lib/rbac";
import { getDashboardData, etaLabel } from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/ui/kpi-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalTable, Tr, Td } from "@/components/ui/brutal-table";
import { StatusPill } from "@/components/ui/status-pill";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { ExportButton } from "@/components/export-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; region?: string }>;
}) {
  await requireAccess("dashboard", "view");
  const filters = await searchParams;
  const data = await getDashboardData(filters);
  const { kpis, statusCounts, recentTrips, filterOptions } = data;

  const statusBars: BarDatum[] = [
    { label: "Available", value: statusCounts.AVAILABLE, color: "bg-st-green" },
    { label: "On Trip", value: statusCounts.ON_TRIP, color: "bg-st-blue" },
    { label: "In Shop", value: statusCounts.IN_SHOP, color: "bg-st-orange" },
    { label: "Retired", value: statusCounts.RETIRED, color: "bg-st-redpink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Dashboard</h1>
        <ExportButton dataset="trips" label="Export Trips CSV" />
      </div>

      {/* Filters */}
      <BrutalCard className="p-4">
        <DashboardFilters
          types={filterOptions.types}
          regions={filterOptions.regions}
        />
      </BrutalCard>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard caption="Active Vehicles" value={kpis.activeVehicles} accent="blue" />
        <KpiCard caption="Available Vehicles" value={kpis.availableVehicles} accent="green" />
        <KpiCard caption="In Maintenance" value={kpis.inShopVehicles} accent="orange" />
        <KpiCard caption="Active Trips" value={kpis.activeTrips} accent="blue" />
        <KpiCard caption="Pending Trips" value={kpis.pendingTrips} accent="violet" />
        <KpiCard caption="Drivers On Duty" value={kpis.driversOnDuty} accent="green" />
        <KpiCard caption="Fleet Utilization" value={kpis.fleetUtilization} unit="%" accent="orange" />
      </div>

      {/* Recent trips + status chart */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-3">
          <div className="label">Recent Trips</div>
          <BrutalTable
            headers={[
              { label: "Trip" },
              { label: "Vehicle" },
              { label: "Driver" },
              { label: "Status" },
              { label: "ETA", align: "right" },
            ]}
          >
            {recentTrips.length === 0 ? (
              <Tr>
                <Td className="text-fg-dim">No trips yet — dispatch one from Trips.</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
              </Tr>
            ) : (
              recentTrips.map((t) => (
                <Tr key={t.id}>
                  <Td mono>{t.tripCode}</Td>
                  <Td mono>{t.vehicle}</Td>
                  <Td>{t.driver}</Td>
                  <Td>
                    <StatusPill kind="trip" status={t.status} />
                  </Td>
                  <Td align="right" className="text-fg-dim">
                    {etaLabel(t.status, t.etaMinutes)}
                  </Td>
                </Tr>
              ))
            )}
          </BrutalTable>
        </div>

        <div className="space-y-3">
          <div className="label">Vehicle Status</div>
          <BrutalCard className="p-4">
            <BarChart data={statusBars} />
          </BrutalCard>
        </div>
      </div>
    </div>
  );
}
