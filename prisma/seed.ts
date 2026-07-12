import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "password123";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

type Spec = {
  companyName: string;
  domain: string;
  adminName: string;
  region: string;
  plate: string; // registration prefix, keeps plates unique per company
};

async function seedCompany(spec: Spec, passwordHash: string) {
  const { companyName, domain, adminName, region, plate } = spec;

  // Upsert the company, then wipe its data so re-seeds are clean & idempotent.
  const company = await prisma.company.upsert({
    where: { domain },
    update: { name: companyName },
    create: { name: companyName, domain },
  });
  const companyId = company.id;
  await prisma.fuelLog.deleteMany({ where: { companyId } });
  await prisma.expense.deleteMany({ where: { companyId } });
  await prisma.maintenanceLog.deleteMany({ where: { companyId } });
  await prisma.trip.deleteMany({ where: { companyId } });
  await prisma.driver.deleteMany({ where: { companyId } });
  await prisma.vehicle.deleteMany({ where: { companyId } });

  // ── Users: one ADMIN + one per operational role ──
  const users = [
    { name: adminName, email: `admin@${domain}`, role: "ADMIN" as const },
    { name: "Fleet Manager", email: `manager@${domain}`, role: "FLEET_MANAGER" as const },
    { name: "Raven K.", email: `driver@${domain}`, role: "DRIVER" as const },
    { name: "Safety Officer", email: `safety@${domain}`, role: "SAFETY_OFFICER" as const },
    { name: "Financial Analyst", email: `finance@${domain}`, role: "FINANCIAL_ANALYST" as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, companyId, isActive: true },
      create: { ...u, passwordHash, companyId },
    });
  }

  // ── Vehicles (statuses spread so charts + dispatch rules show) ──
  const vehicles = [
    { registrationNumber: `${plate}4521`, name: "VAN-05", type: "Van", maxLoadCapacityKg: 500, odometerKm: 74000, acquisitionCost: 620000, status: "AVAILABLE" as const },
    { registrationNumber: `${plate}9987`, name: "TRUCK-11", type: "Truck", maxLoadCapacityKg: 5000, odometerKm: 182000, acquisitionCost: 2450000, status: "ON_TRIP" as const },
    { registrationNumber: `${plate}1120`, name: "MINI-03", type: "Mini", maxLoadCapacityKg: 1000, odometerKm: 66000, acquisitionCost: 410000, status: "IN_SHOP" as const },
    { registrationNumber: `${plate}0089`, name: "VAN-09", type: "Van", maxLoadCapacityKg: 750, odometerKm: 241900, acquisitionCost: 590000, status: "RETIRED" as const },
    { registrationNumber: `${plate}3310`, name: "TRUCK-04", type: "Truck", maxLoadCapacityKg: 8000, odometerKm: 98500, acquisitionCost: 3120000, status: "AVAILABLE" as const },
    { registrationNumber: `${plate}7742`, name: "VAN-12", type: "Van", maxLoadCapacityKg: 600, odometerKm: 33200, acquisitionCost: 640000, status: "AVAILABLE" as const },
  ];
  const vehicleByName: Record<string, string> = {};
  for (const v of vehicles) {
    const row = await prisma.vehicle.create({ data: { ...v, region, companyId } });
    vehicleByName[v.name] = row.id;
  }

  // ── Drivers (one expired licence, one suspended → demonstrates blocking) ──
  const drivers = [
    { name: "Alex", licenseNumber: `${plate}L88213`, licenseCategory: "LMV", licenseExpiryDate: daysFromNow(720), contactNumber: "98765xxxxx", safetyScore: 96, status: "AVAILABLE" as const },
    { name: "John", licenseNumber: `${plate}L44120`, licenseCategory: "HMV", licenseExpiryDate: daysFromNow(-40), contactNumber: "98220xxxxx", safetyScore: 81, status: "SUSPENDED" as const },
    { name: "Priya", licenseNumber: `${plate}L77031`, licenseCategory: "LMV", licenseExpiryDate: daysFromNow(400), contactNumber: "99110xxxxx", safetyScore: 99, status: "ON_TRIP" as const },
    { name: "Suresh", licenseNumber: `${plate}L90045`, licenseCategory: "HMV", licenseExpiryDate: daysFromNow(210), contactNumber: "97440xxxxx", safetyScore: 88, status: "OFF_DUTY" as const },
    { name: "Meera", licenseNumber: `${plate}L63389`, licenseCategory: "LMV", licenseExpiryDate: daysFromNow(25), contactNumber: "97010xxxxx", safetyScore: 92, status: "AVAILABLE" as const },
  ];
  const driverByName: Record<string, string> = {};
  for (const d of drivers) {
    const row = await prisma.driver.create({ data: { ...d, companyId } });
    driverByName[d.name] = row.id;
  }

  // ── Trips (span the lifecycle) ──
  const trips = [
    { source: "Depot", destination: "Hub", vehicleName: "TRUCK-11", driverName: "Priya", cargoWeightKg: 3200, plannedDistanceKm: 38, status: "DISPATCHED" as const, dispatchedAt: new Date(), actualDistanceKm: null as number | null, fuelConsumedL: null as number | null },
    { source: "Hub", destination: "Yard", vehicleName: "VAN-05", driverName: "Alex", cargoWeightKg: 450, plannedDistanceKm: 110, status: "COMPLETED" as const, dispatchedAt: daysFromNow(-3), completedAt: daysFromNow(-3), actualDistanceKm: 112, fuelConsumedL: 13.4 },
    { source: "Vatva", destination: "Sanand", vehicleName: "TRUCK-04", driverName: "Suresh", cargoWeightKg: 5200, plannedDistanceKm: 52, status: "DRAFT" as const, dispatchedAt: null, actualDistanceKm: null, fuelConsumedL: null },
    { source: "Mansa", destination: "Kalol", vehicleName: "MINI-03", driverName: "Meera", cargoWeightKg: 800, plannedDistanceKm: 27, status: "CANCELLED" as const, dispatchedAt: daysFromNow(-1), cancelledAt: daysFromNow(-1), actualDistanceKm: null, fuelConsumedL: null },
  ];
  for (const t of trips) {
    const { vehicleName, driverName, ...rest } = t;
    await prisma.trip.create({
      data: { ...rest, companyId, vehicleId: vehicleByName[vehicleName], driverId: driverByName[driverName] },
    });
  }

  await prisma.fuelLog.createMany({
    data: [
      { companyId, vehicleId: vehicleByName["VAN-05"], liters: 42, cost: 3150, date: daysFromNow(-7) },
      { companyId, vehicleId: vehicleByName["TRUCK-11"], liters: 110, cost: 8400, date: daysFromNow(-6) },
      { companyId, vehicleId: vehicleByName["MINI-03"], liters: 28, cost: 2050, date: daysFromNow(-6) },
      { companyId, vehicleId: vehicleByName["TRUCK-04"], liters: 95, cost: 7180, date: daysFromNow(-4) },
      { companyId, vehicleId: vehicleByName["VAN-12"], liters: 30, cost: 2260, date: daysFromNow(-2) },
    ],
  });
  await prisma.maintenanceLog.createMany({
    data: [
      { companyId, vehicleId: vehicleByName["MINI-03"], description: "Tyre Replace", cost: 6200, status: "ACTIVE" },
      { companyId, vehicleId: vehicleByName["VAN-05"], description: "Oil Change", cost: 2500, status: "CLOSED", closedAt: daysFromNow(-5) },
      { companyId, vehicleId: vehicleByName["TRUCK-11"], description: "Engine Repair", cost: 18000, status: "CLOSED", closedAt: daysFromNow(-10) },
    ],
  });
  await prisma.expense.createMany({
    data: [
      { companyId, vehicleId: vehicleByName["VAN-05"], category: "TOLL", amount: 120, date: daysFromNow(-3) },
      { companyId, vehicleId: vehicleByName["TRUCK-11"], category: "TOLL", amount: 340, date: daysFromNow(-2) },
      { companyId, vehicleId: vehicleByName["TRUCK-11"], category: "OTHER", amount: 150, date: daysFromNow(-2), notes: "Loading assistance" },
    ],
  });

  console.log(`  ✓ ${companyName} (@${domain}): 5 users, 6 vehicles, 5 drivers, 4 trips`);
}

async function main() {
  console.log("🌱 Seeding TransitOps (multi-tenant)…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await seedCompany(
    { companyName: "TransitOps Demo", domain: "transitops.dev", adminName: "Aria Admin", region: "Gandhinagar", plate: "GJ01AB" },
    passwordHash,
  );
  await seedCompany(
    { companyName: "Acme Logistics", domain: "acme.com", adminName: "Raj Patel", region: "Mumbai", plate: "MH02CX" },
    passwordHash,
  );

  console.log(`✅ Seed complete. Log in with any seeded email + "${PASSWORD}".`);
  console.log("   e.g. admin@transitops.dev (admin) · driver@transitops.dev (driver) · admin@acme.com (2nd company)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
