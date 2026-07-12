import { cn } from "@/lib/utils";
import {
  VEHICLE_STATUS_STYLE,
  DRIVER_STATUS_STYLE,
  TRIP_STATUS_STYLE,
} from "@/lib/constants";

type Kind = "vehicle" | "driver" | "trip";

const MAPS: Record<Kind, Record<string, { bg: string; label: string }>> = {
  vehicle: VEHICLE_STATUS_STYLE,
  driver: DRIVER_STATUS_STYLE,
  trip: TRIP_STATUS_STYLE,
};

/** Bordered, solid-fill status pill with black text — same construction for all. */
export function StatusPill({
  kind,
  status,
  className,
}: {
  kind: Kind;
  status: string;
  className?: string;
}) {
  const style = MAPS[kind][status] ?? { bg: "bg-st-grey", label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-ink rounded-[4px] px-2 py-0.5",
        "font-mono text-[11px] font-bold uppercase tracking-wide text-ink",
        style.bg,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full border border-ink bg-ink/70" />
      {style.label}
    </span>
  );
}
