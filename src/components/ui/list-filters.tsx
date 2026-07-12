"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/field";

/** Generic URL-synced filter bar: renders labeled selects + a debounced search box. */
export function ListFilters({
  selects = [],
  searchKey,
  searchPlaceholder = "Search…",
}: {
  selects?: { name: string; label: string; options: { value: string; label: string }[] }[];
  searchKey?: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(name);
    else next.set(name, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {selects.map((s) => (
        <label key={s.name} className="flex flex-col gap-1">
          <span className="label">{s.label}</span>
          <Select
            value={params.get(s.name) ?? "all"}
            onChange={(e) => set(s.name, e.target.value)}
            className="text-sm"
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      ))}
      {searchKey && (
        <label className="flex flex-1 flex-col gap-1 min-w-48">
          <span className="label">Search</span>
          <input
            defaultValue={params.get(searchKey) ?? ""}
            onChange={(e) => set(searchKey, e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full border-2 border-ink bg-panel rounded-[4px] px-3 py-2 text-sm text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_2px_2px_0_var(--color-brand)]"
          />
        </label>
      )}
    </div>
  );
}
