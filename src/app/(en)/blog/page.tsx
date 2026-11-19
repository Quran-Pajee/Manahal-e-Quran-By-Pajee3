// Thin route file. The page itself lives in src/views.
import Page, { generateMetadata as meta } from "@/views/blog/page";

// The list refreshes within five minutes, and straight away when a guide is published in the admin panel.
export const revalidate = 300;
export const generateMetadata = () => meta();
export default function Route() {
  return <Page params={Promise.resolve({ lang: "en" })} />;
}
