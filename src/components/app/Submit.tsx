"use client";

import { useFormStatus } from "react-dom";

/** A submit button that switches off while its form is being sent, so a double click cannot save the same thing twice. */
export function Submit({ children, className = "btn btn-emerald" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending || undefined}>
      {children}
    </button>
  );
}
