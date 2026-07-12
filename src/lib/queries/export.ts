import "server-only";
import { prisma } from "@/lib/prisma";
import { canAccess, type Domain } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";

type Row = Record<string, string | number | null>;

/** Which RBAC domain governs each exportable dataset. */
const DATASET_DOMAIN: Record<string, Domain> = {
  vehicles: "fleet",
  drivers: "drivers",
  trips: "dashboard",
  fuel: "expenses",
  expenses: "expenses",
  analytics: "analytics",
};

export function datasetDomain(dataset: string): Domain | null {
  return DATASET_DOMAIN[dataset] ?? null;
}

export function canExport(role: Role, dataset: string): boolean {
  const domain = datasetDomain(dataset);
  return domain ? canAccess(role, domain) !== null : false;
}

const dec = (v: { toNumber: () => number } | null | undefined): number | null =>
  v == null ? null : v.toNumber();
const day = (d: Date | null): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

/** Load a dataset as flat rows ready for CSV serialization. */
export async function loadDataset(dataset: string): Promise<Row[]> {
  switch (dataset) {
    case "vehicles": {
      const rows = await prisma.vehicle.findMany({ orderBy: { name: "asc" } });
      return rows.map((v) => ({
        registration_number: v.registrationNumber,
        name: v.name,
        type: v.type,
        max_load_capacity_kg: dec(v.maxLoadCapacityKg),
        odometer_km: dec(v.odometerKm),
        acquisition_cost: dec(v.acquisitionCost),
        status: v.status,
        region: v.region,
      }));
    }
    case "drivers": {
      const rows = await prisma.driver.findMany({ orderBy: { name: "asc" } });
      return rows.map((d) => ({
        name: d.name,
        license_number: d.licenseNumber,
        license_category: d.licenseCategory,
        license_expiry_date: day(d.licenseExpiryDate),
        contact_number: d.contactNumber,
        safety_score: dec(d.safetyScore),
        status: d.status,
      }));
    }
    case "trips": {
      const rows = await prisma.trip.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: { select: { name: true } },
          driver: { select: { name: true } },
        },
      });
      return rows.map((t) => ({
        trip_code: t.tripCode,
        source: t.source,
        destination: t.destination,
        vehicle: t.vehicle.name,
        driver: t.driver.name,
        cargo_weight_kg: dec(t.cargoWeightKg),
        planned_distance_km: dec(t.plannedDistanceKm),
        actual_distance_km: dec(t.actualDistanceKm),
        fuel_consumed_l: dec(t.fuelConsumedL),
        revenue: dec(t.revenue),
        status: t.status,
        dispatched_at: day(t.dispatchedAt),
        completed_at: day(t.completedAt),
      }));
    }
    case "fuel": {
      const rows = await prisma.fuelLog.findMany({
        orderBy: { date: "desc" },
        include: { vehicle: { select: { name: true } } },
      });
      return rows.map((f) => ({
        vehicle: f.vehicle.name,
        date: day(f.date),
        liters: dec(f.liters),
        cost: dec(f.cost),
      }));
    }
    case "expenses": {
      const rows = await prisma.expense.findMany({
        orderBy: { date: "desc" },
        include: { vehicle: { select: { name: true } } },
      });
      return rows.map((e) => ({
        vehicle: e.vehicle.name,
        category: e.category,
        amount: dec(e.amount),
        date: day(e.date),
        notes: e.notes,
      }));
    }
    case "analytics": {
      // per-vehicle operational cost = fuel + maintenance, + revenue & ROI
      const [vehicles, fuel, maint, revenue] = await Promise.all([
        prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
        prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
        prisma.maintenanceLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
        prisma.trip.groupBy({
          by: ["vehicleId"],
          where: { status: "COMPLETED" },
          _sum: { revenue: true },
        }),
      ]);
      const fuelBy = new Map(fuel.map((r) => [r.vehicleId, dec(r._sum.cost) ?? 0]));
      const maintBy = new Map(maint.map((r) => [r.vehicleId, dec(r._sum.cost) ?? 0]));
      const revBy = new Map(revenue.map((r) => [r.vehicleId, dec(r._sum.revenue) ?? 0]));
      return vehicles.map((v) => {
        const f = fuelBy.get(v.id) ?? 0;
        const m = maintBy.get(v.id) ?? 0;
        const rev = revBy.get(v.id) ?? 0;
        const acq = dec(v.acquisitionCost) ?? 0;
        const opCost = f + m;
        const roiPct = acq > 0 ? Math.round(((rev - opCost) / acq) * 1000) / 10 : null;
        return {
          vehicle: v.name,
          registration_number: v.registrationNumber,
          fuel_cost: f,
          maintenance_cost: m,
          operational_cost: opCost,
          revenue: rev,
          roi_pct: roiPct,
        };
      });
    }
    default:
      return [];
  }
}
