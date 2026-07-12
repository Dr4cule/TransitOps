import "server-only";
import { prisma } from "@/lib/prisma";

const dec = (v: { toNumber: () => number } | null | undefined): number =>
  v == null ? 0 : v.toNumber();

export async function getAnalyticsData() {
  const [
    vehicles,
    fuelByVehicle,
    maintByVehicle,
    revByVehicle,
    fuelTotal,
    maintTotal,
    completedTrips,
    onTrip,
    nonRetired,
  ] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
    prisma.trip.groupBy({
      by: ["vehicleId"],
      where: { status: "COMPLETED" },
      _sum: { revenue: true },
    }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.trip.findMany({
      where: { status: "COMPLETED" },
      select: { actualDistanceKm: true, fuelConsumedL: true, revenue: true, completedAt: true },
    }),
    prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { status: { not: "RETIRED" } } }),
  ]);

  const fuelBy = new Map(fuelByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const maintBy = new Map(maintByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const revBy = new Map(revByVehicle.map((r) => [r.vehicleId, dec(r._sum.revenue)]));

  // Per-vehicle operational cost + ROI
  const perVehicle = vehicles
    .map((v) => {
      const fuel = fuelBy.get(v.id) ?? 0;
      const maint = maintBy.get(v.id) ?? 0;
      const rev = revBy.get(v.id) ?? 0;
      const acq = dec(v.acquisitionCost);
      const opCost = fuel + maint;
      const roiPct = acq > 0 ? Math.round(((rev - opCost) / acq) * 1000) / 10 : 0;
      return { name: v.name, fuel, maint, opCost, revenue: rev, roiPct };
    })
    .filter((v) => v.opCost > 0)
    .sort((a, b) => b.opCost - a.opCost);

  // Fleet-wide KPIs
  const operationalCost = dec(fuelTotal._sum.cost) + dec(maintTotal._sum.cost);
  const totalDistance = completedTrips.reduce((s, t) => s + dec(t.actualDistanceKm), 0);
  const totalFuel = completedTrips.reduce((s, t) => s + dec(t.fuelConsumedL), 0);
  const fuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : 0;
  const fleetUtilization = nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0;

  const totalRevenue = perVehicle.reduce((s, v) => s + v.revenue, 0);
  const totalAcq = vehicles.reduce((s, v) => s + dec(v.acquisitionCost), 0);
  const roiPct =
    totalAcq > 0 ? Math.round(((totalRevenue - operationalCost) / totalAcq) * 1000) / 10 : 0;

  // Monthly revenue (by completedAt)
  const monthMap = new Map<string, number>();
  for (const t of completedTrips) {
    if (!t.completedAt) continue;
    const key = t.completedAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthMap.set(key, (monthMap.get(key) ?? 0) + dec(t.revenue));
  }
  const monthlyRevenue = Array.from(monthMap, ([label, value]) => ({ label, value }));

  return {
    kpis: { fuelEfficiency, fleetUtilization, operationalCost, roiPct },
    perVehicle,
    monthlyRevenue,
  };
}
