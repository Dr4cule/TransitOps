// Canonical DB client lives in src/lib/prisma.ts (Prisma 7 + pg adapter singleton).
// Re-exported here so the team's `@/core/database/prisma` import path resolves to
// the SAME instance — no duplicate PrismaClient / connection pool.
export { prisma } from "@/lib/prisma";
