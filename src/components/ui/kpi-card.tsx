import { cn } from "@/lib/utils";
import { BrutalCard } from "./brutal-card";

type Accent = "blue" | "green" | "orange" | "violet" | "redpink";

const STRIP: Record<Accent, string> = {
  blue: "bg-st-blue",
  green: "bg-st-green",
  orange: "bg-st-orange",
  violet: "bg-pop-violet",
  redpink: "bg-st-redpink",
};

/** KPI card: colored top strip + big mono value, matching the wireframe. */
export function KpiCard({
  caption,
  value,
  unit,
  accent = "blue",
  className,
}: {
  caption: string;
  value: string | number;
  unit?: string;
  accent?: Accent;
  className?: string;
}) {
  return (
    <BrutalCard className={cn("overflow-hidden p-0", className)}>
      <div className={cn("h-2 w-full border-b-[3px] border-ink", STRIP[accent])} />
      <div className="p-4">
        <div className="label">{caption}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="tnum text-[40px] font-bold leading-none text-fg">
            {value}
          </span>
          {unit && <span className="label !text-fg-dim">{unit}</span>}
        </div>
      </div>
    </BrutalCard>
  );
}
