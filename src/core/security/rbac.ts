// Canonical RBAC lives in src/lib/rbac.ts (guards) and src/lib/constants.ts (matrix).
// Re-exported here for the team's `@/core/security/rbac` import path.
export { requireUser, requireAccess, assertRole } from "@/lib/rbac";
export { RBAC, canAccess, type Access, type Domain } from "@/lib/constants";
