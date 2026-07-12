import { requireAccess } from "@/lib/rbac";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { inr } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { ExportButton } from "@/components/export-button";

const POP = ["bg-pop-blue", "bg-brand", "bg-pop-violet", "bg-st-green", "bg-pop-lime", "bg-st-blue"];

export default async function AnalyticsPage() {
  await requireAccess("analytics", "view");
  const { kpis, perVehicle } = await getAnalyticsData();

  const costliest: BarDatum[] = perVehicle.slice(0, 6).map((v, i) => ({
    label: v.name,
    value: Math.round(v.opCost),
    color: POP[i % POP.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-fg">Reports &amp; Analytics</h1>
        <ExportButton dataset="analytics" label="Export Analytics CSV" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard caption="Fuel Efficiency" value={kpis.fuelEfficiency} unit="km/l" accent="blue" />
        <KpiCard caption="Fleet Utilization" value={kpis.fleetUtilization} unit="%" accent="green" />
        <KpiCard caption="Operational Cost" value={inr(kpis.operationalCost)} accent="orange" />
      </div>

      <p className="label">
        Operational Cost = Σ Fuel + Σ Maintenance + Σ Expenses (Toll / Other)
      </p>

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
  );
}
