"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

function Select({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-2 text-sm font-bold text-fg focus:outline-none focus:border-brand focus:shadow-[inset_2px_2px_0_var(--color-brand)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-panel-2">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DashboardFilters({
  types,
  regions,
}: {
  types: string[];
  regions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(name);
    else next.set(name, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const statuses = [
    { value: "all", label: "Status: All" },
    { value: "AVAILABLE", label: "Available" },
    { value: "ON_TRIP", label: "On Trip" },
    { value: "IN_SHOP", label: "In Shop" },
    { value: "RETIRED", label: "Retired" },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        name="type"
        label="Vehicle Type"
        value={params.get("type") ?? "all"}
        onChange={update}
        options={[
          { value: "all", label: "Type: All" },
          ...types.map((t) => ({ value: t, label: t })),
        ]}
      />
      <Select
        name="status"
        label="Status"
        value={params.get("status") ?? "all"}
        onChange={update}
        options={statuses}
      />
      <Select
        name="region"
        label="Region"
        value={params.get("region") ?? "all"}
        onChange={update}
        options={[
          { value: "all", label: "Region: All" },
          ...regions.map((r) => ({ value: r, label: r })),
        ]}
      />
    </div>
  );
}
