import { prisma } from "@/lib/prisma";

/** Non-retired vehicles for the fuel/expense select dropdowns. */
export function listVehiclesLite() {
  return prisma.vehicle.findMany({
    where: { status: { not: "RETIRED" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function listFuelLogs() {
  return prisma.fuelLog.findMany({
    orderBy: { date: "desc" },
    include: { vehicle: { select: { name: true } } },
  });
}

export function listExpenses() {
  return prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { vehicle: { select: { name: true } } },
  });
}

/**
 * Total operational cost. Fuel + Maintenance-log cost + Toll/Other expenses.
 * MAINTENANCE-category expenses are display-only and NOT summed (canonical).
 */
export async function operationalCost() {
  const [fuelAgg, maintAgg, tollOtherAgg] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { category: { in: ["TOLL", "OTHER"] } },
    }),
  ]);

  const fuel = Number(fuelAgg._sum.cost ?? 0);
  const maintenance = Number(maintAgg._sum.cost ?? 0);
  const tollOther = Number(tollOtherAgg._sum.amount ?? 0);
  const total = fuel + maintenance + tollOther;

  return { fuel, maintenance, tollOther, total };
}
