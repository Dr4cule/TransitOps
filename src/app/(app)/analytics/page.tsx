import { requireAccess } from "@/lib/rbac";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { inr } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BarChart, VBarChart, type BarDatum } from "@/components/ui/bar-chart";
import { ExportButton } from "@/components/export-button";

const POP = ["bg-pop-blue", "bg-brand", "bg-pop-violet", "bg-st-green", "bg-pop-lime", "bg-st-blue"];

export default async function AnalyticsPage() {
  await requireAccess("analytics", "view");
  const { kpis, perVehicle, monthlyRevenue } = await getAnalyticsData();

  const costliest: BarDatum[] = perVehicle.slice(0, 6).map((v, i) => ({
    label: v.name,
    value: Math.round(v.opCost),
    color: POP[i % POP.length],
  }));

  const revenueBars: BarDatum[] = monthlyRevenue.map((m) => ({
    label: m.label,
    value: Math.round(m.value),
    color: "bg-brand",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Reports & Analytics</h1>
        <ExportButton dataset="analytics" label="Export Analytics CSV" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard caption="Fuel Efficiency" value={kpis.fuelEfficiency} unit="km/l" accent="blue" />
        <KpiCard caption="Fleet Utilization" value={kpis.fleetUtilization} unit="%" accent="green" />
        <KpiCard caption="Operational Cost" value={inr(kpis.operationalCost)} accent="orange" />
        <KpiCard caption="Vehicle ROI" value={kpis.roiPct} unit="%" accent="violet" />
      </div>

      <p className="label">
        ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost
      </p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="label">Monthly Revenue</div>
          <BrutalCard className="p-5">
            {revenueBars.length > 0 ? (
              <VBarChart data={revenueBars} />
            ) : (
              <p className="text-fg-dim">No completed trips yet.</p>
            )}
          </BrutalCard>
        </div>

        <div className="space-y-3">
          <div className="label">Top Costliest Vehicles</div>
          <BrutalCard className="p-5">
            {costliest.length > 0 ? (
              <BarChart data={costliest} />
            ) : (
              <p className="text-fg-dim">No operational cost recorded yet.</p>
            )}
          </BrutalCard>
        </div>
      </div>
    </div>
  );
}
