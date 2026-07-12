import { prisma } from "@/lib/prisma";
import type { DriverStatus } from "@/generated/prisma/enums";

export type DriverFilters = {
  status?: string;
  search?: string;
};

export function listDrivers(f: DriverFilters = {}) {
  const where: Record<string, unknown> = {};
  if (f.status && f.status !== "all") where.status = f.status as DriverStatus;
  if (f.search) {
    where.OR = [
      { name: { contains: f.search, mode: "insensitive" } },
      { licenseNumber: { contains: f.search, mode: "insensitive" } },
    ];
  }
  return prisma.driver.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { trips: true } } },
  });
}

export function findByLicense(licenseNumber: string) {
  return prisma.driver.findUnique({ where: { licenseNumber } });
}
