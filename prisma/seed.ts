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

async function main() {
  console.log("🌱 Seeding TransitOps…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Users (one per role; the DRIVER login is the trip-operations role) ──
  const users = [
    { name: "Fleet Manager", email: "manager@transitops.dev", role: "FLEET_MANAGER" as const },
    { name: "Raven K.", email: "driver@transitops.dev", role: "DRIVER" as const },
    { name: "Safety Officer", email: "safety@transitops.dev", role: "SAFETY_OFFICER" as const },
    { name: "Financial Analyst", email: "finance@transitops.dev", role: "FINANCIAL_ANALYST" as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { ...u, passwordHash },
    });
  }
  console.log(`  ✓ ${users.length} users (login with any email + "${PASSWORD}")`);

  // ── Vehicles (statuses spread so the status chart + dispatch rules show) ──
  const vehicles = [
    { registrationNumber: "GJ01AB4521", name: "VAN-05", type: "Van", maxLoadCapacityKg: 500, odometerKm: 74000, acquisitionCost: 620000, status: "AVAILABLE" as const, region: "Gandhinagar" },
    { registrationNumber: "GJ01AB9987", name: "TRUCK-11", type: "Truck", maxLoadCapacityKg: 5000, odometerKm: 182000, acquisitionCost: 2450000, status: "ON_TRIP" as const, region: "Ahmedabad" },
    { registrationNumber: "GJ01AB1120", name: "MINI-03", type: "Mini", maxLoadCapacityKg: 1000, odometerKm: 66000, acquisitionCost: 410000, status: "IN_SHOP" as const, region: "Ahmedabad" },
    { registrationNumber: "GJ01AB0089", name: "VAN-09", type: "Van", maxLoadCapacityKg: 750, odometerKm: 241900, acquisitionCost: 590000, status: "RETIRED" as const, region: "Vadodara" },
    { registrationNumber: "GJ05CD3310", name: "TRUCK-04", type: "Truck", maxLoadCapacityKg: 8000, odometerKm: 98500, acquisitionCost: 3120000, status: "AVAILABLE" as const, region: "Surat" },
    { registrationNumber: "GJ05CD7742", name: "VAN-12", type: "Van", maxLoadCapacityKg: 600, odometerKm: 33200, acquisitionCost: 640000, status: "AVAILABLE" as const, region: "Gandhinagar" },
  ];
  const vehicleByName: Record<string, string> = {};
  for (const v of vehicles) {
    const row = await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: v,
      create: v,
    });
    vehicleByName[v.name] = row.id;
  }
  console.log(`  ✓ ${vehicles.length} vehicles`);

  // ── Drivers (one expired license, one suspended → demonstrates blocking) ──
  const drivers = [
    { name: "Alex", licenseNumber: "DL-88213", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(720), contactNumber: "98765xxxxx", safetyScore: 96, status: "AVAILABLE" as const },
    { name: "John", licenseNumber: "DL-44120", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(-40), contactNumber: "98220xxxxx", safetyScore: 81, status: "SUSPENDED" as const },
    { name: "Priya", licenseNumber: "DL-77031", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(400), contactNumber: "99110xxxxx", safetyScore: 99, status: "ON_TRIP" as const },
    { name: "Suresh", licenseNumber: "DL-90045", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(210), contactNumber: "97440xxxxx", safetyScore: 88, status: "OFF_DUTY" as const },
    { name: "Meera", licenseNumber: "DL-63389", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(25), contactNumber: "97010xxxxx", safetyScore: 92, status: "AVAILABLE" as const },
  ];
  const driverByName: Record<string, string> = {};
  for (const d of drivers) {
    const row = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: d,
      create: d,
    });
    driverByName[d.name] = row.id;
  }
  console.log(`  ✓ ${drivers.length} drivers`);

  // ── Trips (span the lifecycle so the board + recent-trips table fill).
  //    Reset first so re-seeds stay clean (trips have no natural unique key). ──
  await prisma.fuelLog.deleteMany();
  await prisma.trip.deleteMany();
  const trips = [
    {
      source: "Gandhinagar Depot", destination: "Ahmedabad Hub",
      vehicleName: "TRUCK-11", driverName: "Priya", cargoWeightKg: 3200, plannedDistanceKm: 38,
      status: "DISPATCHED" as const, dispatchedAt: new Date(),
      actualDistanceKm: null as number | null, fuelConsumedL: null as number | null,
    },
    {
      source: "Ahmedabad Hub", destination: "Vadodara Yard",
      vehicleName: "VAN-05", driverName: "Alex", cargoWeightKg: 450, plannedDistanceKm: 110,
      status: "COMPLETED" as const, dispatchedAt: daysFromNow(-3), completedAt: daysFromNow(-3),
      actualDistanceKm: 112, fuelConsumedL: 13.4,
    },
    {
      source: "Vatva Industrial Area", destination: "Sanand Warehouse",
      vehicleName: "TRUCK-04", driverName: "Suresh", cargoWeightKg: 5200, plannedDistanceKm: 52,
      status: "DRAFT" as const, dispatchedAt: null,
      actualDistanceKm: null, fuelConsumedL: null,
    },
    {
      source: "Mansa", destination: "Kalol Depot",
      vehicleName: "MINI-03", driverName: "Meera", cargoWeightKg: 800, plannedDistanceKm: 27,
      status: "CANCELLED" as const, dispatchedAt: daysFromNow(-1), cancelledAt: daysFromNow(-1),
      actualDistanceKm: null, fuelConsumedL: null,
    },
  ];
  for (const t of trips) {
    const { vehicleName, driverName, ...rest } = t;
    await prisma.trip.create({
      data: {
        ...rest,
        vehicleId: vehicleByName[vehicleName],
        driverId: driverByName[driverName],
      },
    });
  }
  console.log(`  ✓ ${trips.length} trips`);

  // ── Fuel logs ──
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: vehicleByName["VAN-05"], liters: 42, cost: 3150, date: daysFromNow(-7) },
      { vehicleId: vehicleByName["TRUCK-11"], liters: 110, cost: 8400, date: daysFromNow(-6) },
      { vehicleId: vehicleByName["MINI-03"], liters: 28, cost: 2050, date: daysFromNow(-6) },
      { vehicleId: vehicleByName["TRUCK-04"], liters: 95, cost: 7180, date: daysFromNow(-4) },
      { vehicleId: vehicleByName["VAN-12"], liters: 30, cost: 2260, date: daysFromNow(-2) },
    ],
  });

  // ── Maintenance logs (MINI-03 active → keeps it IN_SHOP) ──
  await prisma.maintenanceLog.deleteMany();
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: vehicleByName["MINI-03"], description: "Tyre Replace", cost: 6200, status: "ACTIVE" },
      { vehicleId: vehicleByName["VAN-05"], description: "Oil Change", cost: 2500, status: "CLOSED", closedAt: daysFromNow(-5) },
      { vehicleId: vehicleByName["TRUCK-11"], description: "Engine Repair", cost: 18000, status: "CLOSED", closedAt: daysFromNow(-10) },
    ],
  });

  // ── Expenses (TOLL / OTHER count toward operational cost; MAINTENANCE is display-only) ──
  await prisma.expense.deleteMany();
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicleByName["VAN-05"], category: "TOLL", amount: 120, date: daysFromNow(-3) },
      { vehicleId: vehicleByName["TRUCK-11"], category: "TOLL", amount: 340, date: daysFromNow(-2) },
      { vehicleId: vehicleByName["TRUCK-11"], category: "OTHER", amount: 150, date: daysFromNow(-2), notes: "Loading assistance" },
    ],
  });

  console.log("  ✓ fuel logs, maintenance logs, expenses");
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
