"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

/** Fixed left rail. Stays a dark brutalist anchor in BOTH themes, so its
 *  colours are constant (not the flipping --fg tokens). */
export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r-[3px] border-ink bg-ink">
      <div className="border-b-[3px] border-[#2a2d38] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center border-2 border-[#f4f1e9]/20 bg-brand rounded-[4px] font-bold text-ink">
            T
          </span>
          <span className="text-xl font-bold text-[#f4f1e9]">TransitOps</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[4px] px-3 py-2.5 text-[15px] font-bold transition-colors",
                active
                  ? "border-2 border-ink bg-brand text-ink shadow-brutal-sm"
                  : "text-[#9a9ead] hover:bg-[#2a2d38] hover:text-[#f4f1e9] border-2 border-transparent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
