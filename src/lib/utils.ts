import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as INR-style grouped currency (no decimals). */
export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Format a plain number with Indian digit grouping. */
export function num(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Today at 00:00 local — the single boundary for "licence expired" checks so
 *  the drivers list, the dispatch picker, and createTrip all agree. A licence
 *  is valid through the whole of its expiry date. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
