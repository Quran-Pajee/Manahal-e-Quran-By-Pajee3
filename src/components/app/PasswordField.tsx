"use client";

import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "type">;

/** Accessible visibility control, without changing the existing field appearance. */
export function PasswordField({ className = "field", style, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input {...props} className={className} style={{ ...style, paddingRight: "3.25rem" }} type={visible ? "text" : "password"} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        style={{ position: "absolute", right: "0.4rem", top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center", width: "2.5rem", height: "2.5rem", border: 0, background: "transparent", color: "var(--color-charcoal)", cursor: "pointer" }}
      >
        {visible ? (
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c5 0 9 4 10 7a12.7 12.7 0 0 1-3.1 4.2"/><path d="M6.2 6.2C4.3 7.5 2.8 9.5 2 12c1 3 5 7 10 7 1.7 0 3.2-.4 4.5-1"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>
        ) : (
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  );
}
