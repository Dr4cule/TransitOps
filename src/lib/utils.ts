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
