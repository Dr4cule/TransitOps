import { prisma } from "@/lib/prisma";

/** Non-retired vehicles for the fuel/expense select dropdowns. */
export function listVehiclesLite(companyId: string) {
  return prisma.vehicle.findMany({
    where: { companyId, status: { not: "RETIRED" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function listFuelLogs(companyId: string) {
  return prisma.fuelLog.findMany({
    where: { companyId },
    orderBy: { date: "desc" },
    include: { vehicle: { select: { name: true } } },
  });
}

export function listExpenses(companyId: string) {
  return prisma.expense.findMany({
    where: { companyId },
    orderBy: { date: "desc" },
    include: { vehicle: { select: { name: true } } },
  });
}

/**
 * Total operational cost. Fuel + Maintenance-log cost + Toll/Other expenses.
 * MAINTENANCE-category expenses are display-only and NOT summed (canonical).
 */
export async function operationalCost(companyId: string) {
  const [fuelAgg, maintAgg, tollOtherAgg] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true }, where: { companyId } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true }, where: { companyId } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { companyId, category: { in: ["TOLL", "OTHER"] } },
    }),
  ]);

  const fuel = Number(fuelAgg._sum.cost ?? 0);
  const maintenance = Number(maintAgg._sum.cost ?? 0);
  const tollOther = Number(tollOtherAgg._sum.amount ?? 0);
  const total = fuel + maintenance + tollOther;

  return { fuel, maintenance, tollOther, total };
}
