import { cn } from "@/lib/utils";

/** Thick-bordered, hard-shadowed block. The atom of the whole UI. */
export function BrutalCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-[3px] border-ink bg-panel-2 shadow-brutal rounded-[4px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
