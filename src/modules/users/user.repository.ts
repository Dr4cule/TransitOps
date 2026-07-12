import { prisma } from "@/lib/prisma";

/** All users in a company (admins first, then by name). */
export function listCompanyUsers(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export function getCompany(companyId: string) {
  return prisma.company.findUnique({ where: { id: companyId } });
}

export function findUserInCompany(companyId: string, id: string) {
  return prisma.user.findFirst({ where: { id, companyId } });
}
