import "server-only";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";

export type SearchHit = {
  type: "vehicle" | "driver" | "trip";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

/** Company-scoped, role-aware global search across vehicles, drivers and trips. */
export async function globalSearch(
  companyId: string,
  role: Role,
  raw: string,
): Promise<SearchHit[]> {
  const q = raw.trim();
  if (q.length < 2) return [];

  const canFleet = canAccess(role, "fleet") !== null;
  const canDrivers = canAccess(role, "drivers") !== null;
  const canTrips = canAccess(role, "trips") !== null;

  const contains = { contains: q, mode: "insensitive" as const };
  const PER = 5;

  const [vehicles, drivers, trips] = await Promise.all([
    canFleet
      ? prisma.vehicle.findMany({
          where: {
            companyId,
            OR: [{ name: contains }, { registrationNumber: contains }, { region: contains }],
          },
          select: { id: true, name: true, registrationNumber: true, status: true },
          take: PER,
        })
      : [],
    canDrivers
      ? prisma.driver.findMany({
          where: {
            companyId,
            OR: [{ name: contains }, { licenseNumber: contains }, { contactNumber: contains }],
          },
          select: { id: true, name: true, licenseNumber: true, status: true },
          take: PER,
        })
      : [],
    canTrips
      ? prisma.trip.findMany({
          where: {
            companyId,
            OR: [{ source: contains }, { destination: contains }],
          },
          select: {
            id: true,
            source: true,
            destination: true,
            status: true,
            vehicle: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: PER,
        })
      : [],
  ]);

  const hits: SearchHit[] = [];

  for (const v of vehicles) {
    hits.push({
      type: "vehicle",
      id: v.id,
      title: v.name,
      subtitle: `${v.registrationNumber} · ${v.status}`,
      href: "/fleet",
    });
  }
  for (const d of drivers) {
    hits.push({
      type: "driver",
      id: d.id,
      title: d.name,
      subtitle: `${d.licenseNumber} · ${d.status}`,
      href: "/drivers",
    });
  }
  for (const t of trips) {
    hits.push({
      type: "trip",
      id: t.id,
      title: `${t.source} → ${t.destination}`,
      subtitle: `${t.vehicle?.name ?? "—"} · ${t.status}`,
      href: "/trips",
    });
  }

  return hits;
}
