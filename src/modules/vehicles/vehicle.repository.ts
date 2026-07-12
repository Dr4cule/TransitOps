import { prisma } from "@/lib/prisma";
import type { VehicleStatus } from "@/generated/prisma/enums";

export type VehicleFilters = {
  type?: string;
  status?: string;
  search?: string;
};

export function listVehicles(companyId: string, f: VehicleFilters = {}) {
  const where: Record<string, unknown> = { companyId };
  if (f.type && f.type !== "all") where.type = f.type;
  if (f.status && f.status !== "all") where.status = f.status as VehicleStatus;
  if (f.search) {
    where.OR = [
      { registrationNumber: { contains: f.search, mode: "insensitive" } },
      { name: { contains: f.search, mode: "insensitive" } },
    ];
  }
  return prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
}

export function getVehicle(companyId: string, id: string) {
  return prisma.vehicle.findFirst({ where: { companyId, id } });
}

export function findByRegistration(companyId: string, registrationNumber: string) {
  return prisma.vehicle.findFirst({ where: { companyId, registrationNumber } });
}

/** Distinct regions for the filter dropdown. */
export async function vehicleRegions(companyId: string): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({
    distinct: ["region"],
    select: { region: true },
    where: { companyId, region: { not: null } },
  });
  return rows.map((r) => r.region).filter((r): r is string => Boolean(r)).sort();
}
