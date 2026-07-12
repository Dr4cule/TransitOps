import { cn } from "@/lib/utils";

/** Labeled form field wrapper with optional inline error text. */
export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block", className)}>
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 font-mono text-xs text-st-red">{error}</p>}
    </label>
  );
}

const fieldBase =
  "w-full border-2 border-ink bg-panel rounded-[4px] px-3 py-2.5 text-[15px] text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_3px_3px_0_var(--color-brand)] disabled:opacity-50";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-20", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "font-bold", className)} {...props}>
      {children}
    </select>
  );
}
