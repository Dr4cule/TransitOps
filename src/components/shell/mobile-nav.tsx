"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

/** Mobile hamburger + slide-in drawer (shown only < md). */
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-panel-2 rounded-[4px] text-fg brutal-press shadow-brutal-sm"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/60"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-64 border-r-[3px] border-ink bg-ink p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-2 py-2">
              <span className="text-xl font-bold text-[#f4f1e9]">TransitOps</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="h-7 w-7 border-2 border-[#2a2d38] bg-[#1e2029] rounded-[4px] text-[#f4f1e9]"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-[4px] px-3 py-2.5 text-[15px] font-bold",
                      active
                        ? "border-2 border-ink bg-brand text-ink"
                        : "text-[#9a9ead] hover:bg-[#2a2d38] border-2 border-transparent",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
