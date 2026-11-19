import { notFound } from "next/navigation";

// Catches every address that no other page claims and shows the "page not found" screen with the normal header and footer.
export default function CatchAll() {
  notFound();
}
