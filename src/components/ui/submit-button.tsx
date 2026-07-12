"use client";

import { useFormStatus } from "react-dom";
import { BrutalButton } from "./brutal-button";

/** Submit button that auto-disables + shows a pending label while the action runs. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <BrutalButton type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </BrutalButton>
  );
}
