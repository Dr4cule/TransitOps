import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const dec = (v: { toNumber: () => number } | null | undefined): number =>
  v == null ? 0 : v.toNumber();

type CompletedTrip = {
  vehicleId: string;
  actualDistanceKm: { toNumber: () => number } | null;
  fuelConsumedL: { toNumber: () => number } | null;
  revenue?: { toNumber: () => number } | null;
};

function isMissingColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022"
  );
}

function isMissingRevenueFieldError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown field `revenue`")
  );
}

export async function getAnalyticsData(companyId: string) {
  try {
    return await getAnalyticsDataUnsafe(companyId, true);
  } catch (error) {
    if (isMissingRevenueFieldError(error)) return getAnalyticsDataUnsafe(companyId, false);
    if (isMissingColumnError(error)) return getAnalyticsDataUnsafe(companyId, false);
    throw error;
  }
}

async function getAnalyticsDataUnsafe(companyId: string, includeRevenue: boolean) {
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
    prisma.vehicle.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.fuelLog.groupBy({ by: ["vehicleId"], where: { companyId }, _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ["vehicleId"], where: { companyId }, _sum: { cost: true } }),
    prisma.expense.groupBy({
      by: ["vehicleId"],
      where: { companyId, category: { in: ["TOLL", "OTHER"] } },
      _sum: { amount: true },
    }),
    prisma.fuelLog.aggregate({ where: { companyId }, _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ where: { companyId }, _sum: { cost: true } }),
    prisma.expense.aggregate({
      where: { companyId, category: { in: ["TOLL", "OTHER"] } },
      _sum: { amount: true },
    }),
    (includeRevenue
      ? prisma.trip.findMany({
          where: { companyId, status: "COMPLETED" },
          select: { vehicleId: true, actualDistanceKm: true, fuelConsumedL: true, revenue: true },
        })
      : prisma.trip.findMany({
          where: { companyId, status: "COMPLETED" },
          select: { vehicleId: true, actualDistanceKm: true, fuelConsumedL: true },
        })) as Promise<CompletedTrip[]>,
    prisma.vehicle.count({ where: { companyId, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { companyId, status: { not: "RETIRED" } } }),
  ]);

  const fuelBy = new Map(fuelByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const maintBy = new Map(maintByVehicle.map((r) => [r.vehicleId, dec(r._sum.cost)]));
  const expBy = new Map(expByVehicle.map((r) => [r.vehicleId, dec(r._sum.amount)]));

  // Per-vehicle revenue = Σ revenue over that vehicle's COMPLETED trips.
  const revenueBy = new Map<string, number>();
  for (const t of completedTrips) {
    const revenue = "revenue" in t ? dec(t.revenue) : 0;
    revenueBy.set(t.vehicleId, (revenueBy.get(t.vehicleId) ?? 0) + revenue);
  }

  // Per-vehicle operational cost = fuel + maintenance + TOLL/OTHER expenses.
  const perVehicle = vehicles
    .map((v) => {
      const fuel = fuelBy.get(v.id) ?? 0;
      const maint = maintBy.get(v.id) ?? 0;
      const exp = expBy.get(v.id) ?? 0;
      const revenue = revenueBy.get(v.id) ?? 0;
      const opCost = fuel + maint + exp;
      return { name: v.name, fuel, maint, exp, revenue, profit: revenue - opCost, opCost };
    })
    .filter((v) => v.opCost > 0 || v.revenue > 0)
    .sort((a, b) => b.opCost - a.opCost);

  // Fleet-wide KPIs
  const operationalCost =
    dec(fuelTotal._sum.cost) + dec(maintTotal._sum.cost) + dec(expTotal._sum.amount);
  const totalRevenue = completedTrips.reduce(
    (s, t) => s + ("revenue" in t ? dec(t.revenue) : 0),
    0,
  );
  const netProfit = totalRevenue - operationalCost;
  // ROI % = (revenue − operational cost) / operational cost × 100. Guard /0 → 0.
  const roi = operationalCost > 0 ? Math.round((netProfit / operationalCost) * 1000) / 10 : 0;
  const totalDistance = completedTrips.reduce((s, t) => s + dec(t.actualDistanceKm), 0);
  const totalFuel = completedTrips.reduce((s, t) => s + dec(t.fuelConsumedL), 0);
  const fuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : 0;
  const fleetUtilization = nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0;

  return {
    kpis: { fuelEfficiency, fleetUtilization, operationalCost, totalRevenue, netProfit, roi },
    perVehicle,
  };
}
