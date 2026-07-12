// Canonical auth/session helpers live in src/lib/session.ts (jose JWT + cookies)
// and src/lib/actions/auth.ts (login/logout). Re-exported here for the team's
// `@/core/security/auth` import path.
export {
  getSession,
  verifySession,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  type SessionPayload,
} from "@/lib/session";
export { loginAction, logoutAction } from "@/lib/actions/auth";
