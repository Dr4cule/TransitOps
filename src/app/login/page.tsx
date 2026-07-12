"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { BrutalButton } from "@/components/ui/brutal-button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Brand panel */}
      <aside className="flex flex-col justify-between bg-paper p-10 md:w-2/5 border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink">
        <div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-brand shadow-brutal rounded-[4px] text-2xl font-bold text-ink">
            T
          </div>
          <h1 className="text-4xl font-bold text-ink">TransitOps</h1>
          <p className="mt-1 text-ink/70">Smart Transport Operations Platform</p>

          <div className="mt-10">
            <div className="label !text-ink/60">Built for teams</div>
            <ul className="mt-3 space-y-2 text-ink">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-ink bg-brand" />
                One workspace per company
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-ink bg-brand" />
                Admin provisions the team
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-ink bg-brand" />
                Role-based access control
              </li>
            </ul>
          </div>
        </div>
        <p className="label !text-ink/40 mt-10">TRANSITOPS © 2026 · RBAC ENABLED</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center bg-panel p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-fg">Sign in to your account</h2>
          <p className="mt-1 text-fg-dim">Enter your credentials to continue</p>

          <form action={formAction} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourcompany.com"
                className="mt-1.5 w-full border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-2.5 text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_3px_3px_0_var(--color-brand)]"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1.5 w-full border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-2.5 text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_3px_3px_0_var(--color-brand)]"
              />
            </div>

            {state?.error && (
              <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
                ✕ {state.error}
              </div>
            )}

            <BrutalButton type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign In"}
            </BrutalButton>
          </form>

          <p className="mt-6 border-t-2 border-panel-3 pt-4 text-sm text-fg-dim">
            New here?{" "}
            <Link href="/signup" className="font-bold text-brand hover:underline">
              Create a company account →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
