"use client";

import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/constants";
import type { Role } from "@/generated/prisma/enums";

export function Topbar({ name, role }: { name: string; role: Role }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b-[3px] border-ink bg-panel px-4">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Search…"
          className="w-full max-w-sm border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-1.5 text-sm text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_2px_2px_0_var(--color-brand)]"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold text-fg leading-tight">{name}</div>
          <div className="label !text-[10px]">{ROLE_LABEL[role]}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-brand rounded-full font-bold text-ink text-sm">
          {initials}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="border-2 border-ink bg-panel-3 rounded-[4px] px-2.5 py-1.5 text-xs font-bold text-fg brutal-press shadow-brutal-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
