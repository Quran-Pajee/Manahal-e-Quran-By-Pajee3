import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Admin" },
  robots: { index: false, follow: false },
};

// The admin panel is in English whatever language the public site was last viewed in.
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" dir="ltr" className="min-h-screen bg-ivory font-sans text-[1.0625rem] leading-[1.6]">
      {children}
    </div>
  );
}
