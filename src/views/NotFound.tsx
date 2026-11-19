import Link from "next/link";
import { Mark } from "@/components/Logo";

// Shown for any address that does not exist. Kept in English because the language of a missing page is unknown.
export default function NotFound() {
  return (
    <div className="wrap grid min-h-[60vh] place-items-center py-16 text-center" lang="en" dir="ltr">
      <div>
        <Mark className="mx-auto h-14 w-14" />
        <h1 className="mt-6 text-[2.2rem]">This page is not here</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">The link may be old or mistyped. These will get you back on track.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-emerald">
            Home
          </Link>
          <Link href="/courses" className="btn btn-line">
            Courses
          </Link>
          <Link href="/free-trial" className="btn btn-primary">
            Book 3 Free Trial Classes
          </Link>
        </div>
      </div>
    </div>
  );
}
