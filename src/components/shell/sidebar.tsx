"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r-[3px] border-ink bg-ink">
      <div className="border-b-[3px] border-panel-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center border-2 border-fg/20 bg-brand rounded-[4px] font-bold text-ink">
            T
          </span>
          <span className="text-xl font-bold text-fg">TransitOps</span>
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
                  : "text-fg-dim hover:bg-panel-3 hover:text-fg border-2 border-transparent",
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
