import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { ASSIGNABLE_ROLES } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";
import type { CreateUserInput } from "./user.schema";

/** Admin creates a teammate. Email is `local@companyDomain`, unique globally,
 *  role limited to the operational (non-admin) roles. */
export async function createCompanyUser(companyId: string, input: CreateUserInput) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new BusinessRuleError("Company not found.");

  const email = `${input.emailLocal}@${company.domain}`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new BusinessRuleError(`${email} is already registered.`);

  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: {
      companyId,
      name: input.name,
      email,
      passwordHash,
      role: input.role as Role,
    },
  });
}

/** Change a teammate's role. Cannot target an ADMIN, cannot assign ADMIN. */
export async function setUserRole(companyId: string, userId: string, role: Role) {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new BusinessRuleError("That role cannot be assigned.");
  }
  const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new BusinessRuleError("User not found.");
  if (user.role === "ADMIN") throw new BusinessRuleError("The admin's role cannot be changed.");
  return prisma.user.update({ where: { id: userId }, data: { role } });
}

/** Activate / deactivate a teammate. An admin cannot deactivate themselves. */
export async function setUserActive(
  companyId: string,
  actingUserId: string,
  userId: string,
  isActive: boolean,
) {
  const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new BusinessRuleError("User not found.");
  if (user.id === actingUserId) throw new BusinessRuleError("You cannot deactivate your own account.");
  if (user.role === "ADMIN") throw new BusinessRuleError("The admin account cannot be deactivated.");
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

/** Remove a teammate from the company. Cannot remove yourself or the admin.
 *  Any linked driver profile is detached (userId set to null), not deleted. */
export async function removeCompanyUser(
  companyId: string,
  actingUserId: string,
  userId: string,
) {
  const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
  if (!user) throw new BusinessRuleError("User not found.");
  if (user.id === actingUserId) throw new BusinessRuleError("You cannot remove your own account.");
  if (user.role === "ADMIN") throw new BusinessRuleError("The admin account cannot be removed.");
  return prisma.user.delete({ where: { id: userId } });
}
