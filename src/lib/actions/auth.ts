"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  signSession,
  setSessionCookie,
  clearSessionCookie,
  type SessionPayload,
} from "@/lib/session";

export type LoginState = { error?: string } | null;

async function startSession(user: {
  id: string;
  name: string;
  email: string;
  role: SessionPayload["role"];
  companyId: string;
}) {
  const company = await prisma.company.findUnique({ where: { id: user.companyId } });
  const token = await signSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: company?.name ?? "",
  });
  await setSessionCookie(token);
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  if (!user.isActive) {
    return { error: "This account has been deactivated. Contact your admin." };
  }

  await startSession(user);
  redirect("/dashboard");
}

export type SignupState = { error?: string; fieldErrors?: Record<string, string> } | null;

/** Company self-registration: creates the Company + its first ADMIN user. */
export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fe: Record<string, string> = {};
  if (!companyName) fe.companyName = "Company name is required";
  if (!name) fe.name = "Your name is required";
  if (!email || !email.includes("@")) fe.email = "A valid work email is required";
  if (password.length < 6) fe.password = "Password must be at least 6 characters";
  if (Object.keys(fe).length) return { fieldErrors: fe };

  const domain = email.split("@")[1] ?? "";
  if (!domain) return { fieldErrors: { email: "Enter a valid email like admin@company.com" } };

  // Email must be free, and the company domain must be unclaimed.
  const [emailTaken, domainTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.company.findUnique({ where: { domain } }),
  ]);
  if (emailTaken) return { fieldErrors: { email: "That email is already registered." } };
  if (domainTaken) {
    return {
      error: `A company for “${domain}” already exists. Ask its admin to create your account, then sign in.`,
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: companyName, domain } });
    return tx.user.create({
      data: { companyId: company.id, name, email, passwordHash, role: "ADMIN" },
    });
  });

  await startSession(user);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
