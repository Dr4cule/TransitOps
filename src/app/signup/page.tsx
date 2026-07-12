"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type SignupState } from "@/lib/actions/auth";
import { BrutalButton } from "@/components/ui/brutal-button";

const inputCls =
  "mt-1.5 w-full border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-2.5 text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_3px_3px_0_var(--color-brand)]";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    null,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Brand panel */}
      <aside className="flex flex-col justify-between bg-paper p-10 md:w-2/5 border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink">
        <div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-brand shadow-brutal rounded-[4px] text-2xl font-bold text-ink">
            T
          </div>
          <h1 className="text-4xl font-bold text-ink">Start your fleet</h1>
          <p className="mt-2 text-ink/70">
            Create your company workspace. You become its <strong>admin</strong> — then
            you invite your team and assign each person a role.
          </p>
          <div className="mt-8 border-[3px] border-ink bg-brand/20 shadow-brutal rounded-[4px] p-4 text-sm text-ink">
            Your email domain becomes your company domain. If you sign up as
            <span className="tnum"> raj@acme.com</span>, every teammate you add must use an
            <span className="tnum"> @acme.com</span> address.
          </div>
        </div>
        <p className="label !text-ink/40 mt-10">TRANSITOPS © 2026</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center bg-panel p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-fg">Create a company account</h2>
          <p className="mt-1 text-fg-dim">You&rsquo;ll be the workspace administrator.</p>

          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="companyName">Company name</label>
              <input id="companyName" name="companyName" placeholder="Acme Logistics" className={inputCls} />
              {fe.companyName && <p className="mt-1 font-mono text-xs text-st-red">{fe.companyName}</p>}
            </div>
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" name="name" placeholder="Raj Patel" className={inputCls} />
              {fe.name && <p className="mt-1 font-mono text-xs text-st-red">{fe.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="email">Work email (becomes admin login)</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="raj@acme.com" className={inputCls} />
              {fe.email && <p className="mt-1 font-mono text-xs text-st-red">{fe.email}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" className={inputCls} />
              {fe.password && <p className="mt-1 font-mono text-xs text-st-red">{fe.password}</p>}
            </div>

            {state?.error && (
              <div className="border-2 border-st-red bg-st-red/15 rounded-[4px] px-3 py-2 text-sm text-st-red">
                ✕ {state.error}
              </div>
            )}

            <BrutalButton type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Creating workspace…" : "Create workspace & admin"}
            </BrutalButton>
          </form>

          <p className="mt-6 border-t-2 border-panel-3 pt-4 text-sm text-fg-dim">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
