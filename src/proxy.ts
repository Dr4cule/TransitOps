import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "transitops_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev_insecure_fallback_secret_change_me",
);

const PROTECTED = [
  "/dashboard",
  "/fleet",
  "/drivers",
  "/trips",
  "/maintenance",
  "/expenses",
  "/analytics",
  "/settings",
];

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await isAuthed(req);

  // Send logged-in users away from the login page and the root.
  if (authed && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Root → login when logged out.
  if (!authed && pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Gate the app routes.
  if (!authed && PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets and API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
