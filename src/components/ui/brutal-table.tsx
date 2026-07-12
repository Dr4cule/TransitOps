import { cn } from "@/lib/utils";

/** Brutalist data table: black header bar, thick rule, bordered wrapper. */
export function BrutalTable({
  headers,
  children,
  className,
}: {
  headers: { label: string; align?: "left" | "right" | "center" }[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto border-[3px] border-ink shadow-brutal rounded-[4px]",
        className,
      )}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-4 border-ink bg-ink">
            {headers.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "label !text-fg px-4 py-3 whitespace-nowrap",
                  h.align === "right" && "text-right",
                  h.align === "center" && "text-center",
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-panel-3 last:border-0 hover:bg-brand/10 transition-colors",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align,
  mono,
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[15px] text-fg align-middle",
        mono && "tnum",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
