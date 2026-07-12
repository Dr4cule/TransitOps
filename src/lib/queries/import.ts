import "server-only";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import type { VehicleStatus, DriverStatus, ExpenseCategory } from "@/generated/prisma/enums";

export type ImportResult = {
  created: number;
  skipped: { row: number; reason: string }[];
  total: number;
};

export type ImportDataset = "vehicles" | "drivers" | "fuel" | "expenses";

/** Column headers + one example row per dataset — drives both the sample CSV
 *  download and the importer. Keep in sync with the export column names. */
export const SAMPLE: Record<ImportDataset, { headers: string[]; example: string[][] }> = {
  vehicles: {
    headers: [
      "registration_number", "name", "type", "max_load_capacity_kg",
      "odometer_km", "acquisition_cost", "status", "region",
    ],
    example: [
      ["GJ01ZZ1001", "VAN-20", "Van", "600", "12000", "550000", "AVAILABLE", "Gandhinagar"],
      ["GJ01ZZ1002", "TRUCK-20", "Truck", "6000", "45000", "2600000", "AVAILABLE", "Ahmedabad"],
    ],
  },
  drivers: {
    headers: [
      "name", "license_number", "license_category", "license_expiry_date",
      "contact_number", "safety_score", "status",
    ],
    example: [
      ["Kabir Rao", "DL-55001", "LMV", "2027-12-31", "9800011111", "95", "AVAILABLE"],
      ["Nisha Verma", "DL-55002", "HMV", "2026-09-15", "9800022222", "88", "AVAILABLE"],
    ],
  },
  fuel: {
    headers: ["vehicle", "date", "liters", "cost"],
    example: [
      ["VAN-05", "2026-07-01", "40", "3000"],
      ["TRUCK-11", "2026-07-02", "105", "8100"],
    ],
  },
  expenses: {
    headers: ["vehicle", "category", "amount", "date", "notes"],
    example: [
      ["VAN-05", "TOLL", "150", "2026-07-01", "Expressway"],
      ["TRUCK-11", "OTHER", "200", "2026-07-02", "Loading help"],
    ],
  },
};

/** Build the sample CSV text (headers + example rows). */
export function sampleCsv(dataset: ImportDataset): string {
  const { headers, example } = SAMPLE[dataset];
  return Papa.unparse({ fields: headers, data: example });
}

type Row = Record<string, string>;

const VEHICLE_TYPES = ["Van", "Truck", "Mini", "Trailer", "Bus"];
const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];
const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];
const LICENSE_CATS = ["LMV", "HMV"];
const EXPENSE_CATS = ["TOLL", "MAINTENANCE", "OTHER"];

function numOr(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse + validate + insert. Company-scoped; unknown/invalid rows are skipped
 *  with a reason (never abort the whole file). Duplicate keys are skipped. */
export async function importCsv(
  dataset: ImportDataset,
  companyId: string,
  csvText: string,
): Promise<ImportResult> {
  const parsed = Papa.parse<Row>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const rows = parsed.data;
  const skipped: { row: number; reason: string }[] = [];
  let created = 0;

  // Vehicle-name → id lookup for fuel/expenses (scoped to this company).
  const vehiclesByName = new Map<string, string>();
  if (dataset === "fuel" || dataset === "expenses") {
    const vs = await prisma.vehicle.findMany({ where: { companyId }, select: { id: true, name: true } });
    for (const v of vs) vehiclesByName.set(v.name.toLowerCase(), v.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // +1 header, +1 to 1-index

    try {
      if (dataset === "vehicles") {
        const reg = (r.registration_number ?? "").trim().toUpperCase();
        const name = (r.name ?? "").trim();
        const type = (r.type ?? "").trim();
        const cap = numOr(r.max_load_capacity_kg);
        const odo = numOr(r.odometer_km) ?? 0;
        const cost = numOr(r.acquisition_cost) ?? 0;
        const status = (r.status ?? "AVAILABLE").trim().toUpperCase();
        if (!reg || !name) { skipped.push({ row: rowNo, reason: "Missing registration_number or name" }); continue; }
        if (!VEHICLE_TYPES.includes(type)) { skipped.push({ row: rowNo, reason: `Invalid type "${type}" (${VEHICLE_TYPES.join("/")})` }); continue; }
        if (cap == null || cap <= 0) { skipped.push({ row: rowNo, reason: "max_load_capacity_kg must be > 0" }); continue; }
        if (!VEHICLE_STATUSES.includes(status)) { skipped.push({ row: rowNo, reason: `Invalid status "${status}"` }); continue; }
        const exists = await prisma.vehicle.findFirst({ where: { companyId, registrationNumber: reg } });
        if (exists) { skipped.push({ row: rowNo, reason: `Registration ${reg} already exists` }); continue; }
        await prisma.vehicle.create({
          data: {
            companyId, registrationNumber: reg, name, type,
            maxLoadCapacityKg: cap, odometerKm: odo, acquisitionCost: cost,
            status: status as VehicleStatus, region: (r.region ?? "").trim() || null,
          },
        });
        created++;
      } else if (dataset === "drivers") {
        const name = (r.name ?? "").trim();
        const lic = (r.license_number ?? "").trim().toUpperCase();
        const cat = (r.license_category ?? "").trim().toUpperCase();
        const expiry = (r.license_expiry_date ?? "").trim();
        const contact = (r.contact_number ?? "").trim();
        const score = numOr(r.safety_score) ?? 100;
        const status = (r.status ?? "AVAILABLE").trim().toUpperCase();
        if (!name || !lic) { skipped.push({ row: rowNo, reason: "Missing name or license_number" }); continue; }
        if (!LICENSE_CATS.includes(cat)) { skipped.push({ row: rowNo, reason: `Invalid license_category "${cat}" (LMV/HMV)` }); continue; }
        const d = new Date(expiry);
        if (isNaN(d.getTime())) { skipped.push({ row: rowNo, reason: `Invalid license_expiry_date "${expiry}" (use YYYY-MM-DD)` }); continue; }
        if (!contact) { skipped.push({ row: rowNo, reason: "Missing contact_number" }); continue; }
        if (!DRIVER_STATUSES.includes(status)) { skipped.push({ row: rowNo, reason: `Invalid status "${status}"` }); continue; }
        const exists = await prisma.driver.findFirst({ where: { companyId, licenseNumber: lic } });
        if (exists) { skipped.push({ row: rowNo, reason: `Licence ${lic} already exists` }); continue; }
        await prisma.driver.create({
          data: {
            companyId, name, licenseNumber: lic, licenseCategory: cat,
            licenseExpiryDate: d, contactNumber: contact, safetyScore: score,
            status: status as DriverStatus,
          },
        });
        created++;
      } else if (dataset === "fuel") {
        const vName = (r.vehicle ?? "").trim().toLowerCase();
        const vId = vehiclesByName.get(vName);
        const liters = numOr(r.liters);
        const cost = numOr(r.cost);
        if (!vId) { skipped.push({ row: rowNo, reason: `Unknown vehicle "${r.vehicle}"` }); continue; }
        if (liters == null || liters <= 0) { skipped.push({ row: rowNo, reason: "liters must be > 0" }); continue; }
        if (cost == null || cost < 0) { skipped.push({ row: rowNo, reason: "cost must be >= 0" }); continue; }
        const date = r.date ? new Date(r.date) : new Date();
        await prisma.fuelLog.create({
          data: { companyId, vehicleId: vId, liters, cost, date: isNaN(date.getTime()) ? new Date() : date },
        });
        created++;
      } else {
        // expenses
        const vName = (r.vehicle ?? "").trim().toLowerCase();
        const vId = vehiclesByName.get(vName);
        const cat = (r.category ?? "").trim().toUpperCase();
        const amount = numOr(r.amount);
        if (!vId) { skipped.push({ row: rowNo, reason: `Unknown vehicle "${r.vehicle}"` }); continue; }
        if (!EXPENSE_CATS.includes(cat)) { skipped.push({ row: rowNo, reason: `Invalid category "${cat}" (TOLL/MAINTENANCE/OTHER)` }); continue; }
        if (amount == null || amount < 0) { skipped.push({ row: rowNo, reason: "amount must be >= 0" }); continue; }
        const date = r.date ? new Date(r.date) : new Date();
        await prisma.expense.create({
          data: {
            companyId, vehicleId: vId, category: cat as ExpenseCategory, amount,
            date: isNaN(date.getTime()) ? new Date() : date, notes: (r.notes ?? "").trim() || null,
          },
        });
        created++;
      }
    } catch (e) {
      skipped.push({ row: rowNo, reason: e instanceof Error ? e.message : "Unexpected error" });
    }
  }

  return { created, skipped, total: rows.length };
}
