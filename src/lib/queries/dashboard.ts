import "server-only";
import { prisma } from "@/lib/prisma";
import type { VehicleStatus } from "@/generated/prisma/enums";

export type DashboardFilters = {
  type?: string;
  status?: string;
  region?: string;
};

/** Build a Prisma `where` for vehicles from the dashboard filters. */
function vehicleWhere(f: DashboardFilters) {
  const where: Record<string, unknown> = {};
  if (f.type && f.type !== "all") where.type = f.type;
  if (f.status && f.status !== "all") where.status = f.status as VehicleStatus;
  if (f.region && f.region !== "all") where.region = f.region;
  return where;
}

export async function getDashboardData(f: DashboardFilters) {
  const where = vehicleWhere(f);

  const [
    vehicleGroups,
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    recentTrips,
    types,
    regions,
  ] = await Promise.all([
    // status distribution for the bar chart (respecting filters)
    prisma.vehicle.groupBy({ by: ["status"], _count: true, where }),
    prisma.vehicle.count({ where: { ...where, status: { not: "RETIRED" } } }),
    prisma.vehicle.count({ where: { ...where, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { ...where, status: "IN_SHOP" } }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.driver.count({ where: { status: "ON_TRIP" } }),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        vehicle: { select: { name: true } },
        driver: { select: { name: true } },
      },
    }),
    // filter option sources (unfiltered)
    prisma.vehicle.findMany({ distinct: ["type"], select: { type: true } }),
    prisma.vehicle.findMany({
      distinct: ["region"],
      select: { region: true },
      where: { region: { not: null } },
    }),
  ]);

  const statusCounts: Record<string, number> = {
    AVAILABLE: 0,
    ON_TRIP: 0,
    IN_SHOP: 0,
    RETIRED: 0,
  };
  for (const g of vehicleGroups) statusCounts[g.status] = g._count;

  const onTrip = statusCounts.ON_TRIP;
  const nonRetired = activeVehicles; // count(!= RETIRED)
  const fleetUtilization =
    nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0;

  return {
    kpis: {
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    },
    statusCounts,
    recentTrips: recentTrips.map((t) => ({
      id: t.id,
      // No stored trip code in the canonical schema — derive a stable display code.
      tripCode: "TR-" + t.id.slice(-5).toUpperCase(),
      vehicle: t.vehicle.name,
      driver: t.driver.name,
      status: t.status,
    })),
    filterOptions: {
      types: types.map((t) => t.type).sort(),
      regions: regions
        .map((r) => r.region)
        .filter((r): r is string => Boolean(r))
        .sort(),
    },
  };
}

/** Human ETA string mirroring the wireframe (derived from status). */
export function etaLabel(status: string): string {
  if (status === "DISPATCHED") return "En route";
  if (status === "COMPLETED") return "Delivered";
  if (status === "DRAFT") return "Awaiting dispatch";
  if (status === "CANCELLED") return "—";
  return "—";
}
