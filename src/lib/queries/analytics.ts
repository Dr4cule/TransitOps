import "server-only";
import { prisma } from "@/lib/prisma";

const dec = (v: { toNumber: () => number } | null | undefined): number =>
  v == null ? 0 : v.toNumber();

export async function getAnalyticsData() {
  const [
    vehicles,
    fuelByVehicle,
    maintByVehicle,
    expByVehicle,
    fuelTotal,
    maintTotal,
    expTotal,
    completedTrips,
    onTrip,
    nonRetired,
  ] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
    prisma.expense.groupBy({
      by: ["vehicleId"],
      where: { category: { in: ["TOLL", "OTHER"] } },
      _sum: { amount: true },
    }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({
      where: { category: { in: ["TOLL", "OTHER"] } },
      _sum: { amount: true },
    }),
    prisma.trip.findMany({
      where: { status: "COMPLETED" },
      select: { actualDistanceKm: true, fuelConsumedL: true },
    }),
    prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { status: { not: "RETIRED" } } }),
  ]);

  const fuelBy = new Map(fuelByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const maintBy = new Map(maintByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const expBy = new Map(expByVehicle.map((r) => [r.vehicleId, dec(r._sum.amount)]));

  // Per-vehicle operational cost = fuel + maintenance + TOLL/OTHER expenses.
  const perVehicle = vehicles
    .map((v) => {
      const fuel = fuelBy.get(v.id) ?? 0;
      const maint = maintBy.get(v.id) ?? 0;
      const exp = expBy.get(v.id) ?? 0;
      return { name: v.name, fuel, maint, exp, opCost: fuel + maint + exp };
    })
    .filter((v) => v.opCost > 0)
    .sort((a, b) => b.opCost - a.opCost);

  // Fleet-wide KPIs
  const operationalCost =
    dec(fuelTotal._sum.cost) + dec(maintTotal._sum.cost) + dec(expTotal._sum.amount);
  const totalDistance = completedTrips.reduce((s, t) => s + dec(t.actualDistanceKm), 0);
  const totalFuel = completedTrips.reduce((s, t) => s + dec(t.fuelConsumedL), 0);
  const fuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : 0;
  const fleetUtilization = nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0;

  return {
    kpis: { fuelEfficiency, fleetUtilization, operationalCost },
    perVehicle,
  };
}
