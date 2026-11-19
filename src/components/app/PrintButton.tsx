"use client";

/** Opens the browser's print box, where the page can also be saved as a PDF. */
export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="btn btn-line print:hidden" onClick={() => window.print()}>
      {children}
    </button>
  );
}
