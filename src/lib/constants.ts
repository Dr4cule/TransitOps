import type { Role } from "@/generated/prisma/enums";

/* ── Status → brutalist pill styling ─────────────────────────────
   Every pill: 2px black border, solid status fill, black text.     */
type PillStyle = { bg: string; label: string };

export const VEHICLE_STATUS_STYLE: Record<string, PillStyle> = {
  AVAILABLE: { bg: "bg-st-green", label: "Available" },
  ON_TRIP: { bg: "bg-st-blue", label: "On Trip" },
  IN_SHOP: { bg: "bg-st-orange", label: "In Shop" },
  RETIRED: { bg: "bg-st-redpink", label: "Retired" },
};

export const DRIVER_STATUS_STYLE: Record<string, PillStyle> = {
  AVAILABLE: { bg: "bg-st-green", label: "Available" },
  ON_TRIP: { bg: "bg-st-blue", label: "On Trip" },
  OFF_DUTY: { bg: "bg-st-grey", label: "Off Duty" },
  SUSPENDED: { bg: "bg-st-orange", label: "Suspended" },
};

export const TRIP_STATUS_STYLE: Record<string, PillStyle> = {
  DRAFT: { bg: "bg-st-grey", label: "Draft" },
  DISPATCHED: { bg: "bg-st-blue", label: "Dispatched" },
  COMPLETED: { bg: "bg-st-green", label: "Completed" },
  CANCELLED: { bg: "bg-st-red", label: "Cancelled" },
};

/* ── Roles ───────────────────────────────────────────────────── */
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

/** The operational roles an admin can assign to a teammate (ADMIN excluded). */
export const ASSIGNABLE_ROLES: Role[] = [
  "FLEET_MANAGER",
  "DRIVER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

/* ── RBAC matrix (domain → allowed roles) ────────────────────────
   'crud' = full access, 'view' = read-only. Missing = no access.
   Mirrors plan.md § RBAC Matrix (canonical). ADMIN owns tenant
   administration (users + settings) but not day-to-day operations. */
export type Access = "crud" | "view";
export type Domain =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics"
  | "users"
  | "settings";

export const RBAC: Record<Domain, Partial<Record<Role, Access>>> = {
  dashboard: { ADMIN: "view", FLEET_MANAGER: "view", DRIVER: "view", SAFETY_OFFICER: "view", FINANCIAL_ANALYST: "view" },
  fleet: { FLEET_MANAGER: "crud", DRIVER: "view", FINANCIAL_ANALYST: "view" },
  drivers: { FLEET_MANAGER: "crud", SAFETY_OFFICER: "crud" },
  trips: { FLEET_MANAGER: "view", DRIVER: "crud", SAFETY_OFFICER: "view" },
  maintenance: { FLEET_MANAGER: "crud" },
  expenses: { FINANCIAL_ANALYST: "crud" },
  analytics: { FLEET_MANAGER: "view", FINANCIAL_ANALYST: "crud" },
  users: { ADMIN: "crud" },
  settings: { ADMIN: "crud", FLEET_MANAGER: "view", DRIVER: "view", SAFETY_OFFICER: "view", FINANCIAL_ANALYST: "view" },
};

export function canAccess(role: Role, domain: Domain): Access | null {
  return RBAC[domain][role] ?? null;
}

/* ── Sidebar navigation ──────────────────────────────────────── */
export type NavItem = { href: string; label: string; domain: Domain; icon: string };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", domain: "dashboard", icon: "grid" },
  { href: "/fleet", label: "Fleet", domain: "fleet", icon: "truck" },
  { href: "/drivers", label: "Drivers", domain: "drivers", icon: "id" },
  { href: "/trips", label: "Trips", domain: "trips", icon: "route" },
  { href: "/maintenance", label: "Maintenance", domain: "maintenance", icon: "wrench" },
  { href: "/expenses", label: "Fuel & Expenses", domain: "expenses", icon: "fuel" },
  { href: "/analytics", label: "Analytics", domain: "analytics", icon: "chart" },
  { href: "/users", label: "Team", domain: "users", icon: "users" },
  { href: "/settings", label: "Settings", domain: "settings", icon: "gear" },
];
