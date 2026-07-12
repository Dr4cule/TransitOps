import { cn } from "@/lib/utils";

export type BarDatum = {
  label: string;
  value: number;
  /** tailwind bg-* class for the fill */
  color: string;
};

/**
 * Neo-brutalist horizontal bar chart built from divs — flat fill, black
 * border, hard offset shadow. No chart library, SSR-safe, always sharp.
 */
export function BarChart({
  data,
  className,
  unit,
}: {
  data: BarDatum[];
  className?: string;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="label w-20 shrink-0 !normal-case">{d.label}</div>
          <div className="relative h-6 flex-1 border-2 border-ink bg-panel rounded-[3px]">
            <div
              className={cn(
                "h-full border-r-2 border-ink rounded-[1px] transition-[width] duration-500",
                d.color,
              )}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="tnum w-12 shrink-0 text-right text-sm text-fg">
            {d.value}
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Vertical bar chart (Monthly Revenue style) — chunky bordered columns
 * with hard shadows.
 */
export function VBarChart({
  data,
  className,
}: {
  data: BarDatum[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn("flex items-stretch gap-3 h-56", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center">
          {/* bar area fills the column height; bar aligns to the bottom */}
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn(
                "w-full border-2 border-ink shadow-brutal-sm rounded-t-[3px] transition-[height] duration-500",
                d.color,
              )}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
          <div className="label mt-2 !normal-case">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
