import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink",
  secondary: "bg-panel-3 text-fg",
  danger: "bg-st-red text-white",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-[15px]",
  lg: "px-6 py-3.5 text-base",
};

export function BrutalButton({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 border-[3px] border-ink rounded-[4px] font-bold",
        "shadow-brutal brutal-press focus-visible:outline-3 focus-visible:outline-pop-blue focus-visible:outline-offset-2",
        VARIANTS[variant],
        SIZES[size],
        disabled &&
          "cursor-not-allowed border-dashed bg-st-grey text-ink/50 shadow-none pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
