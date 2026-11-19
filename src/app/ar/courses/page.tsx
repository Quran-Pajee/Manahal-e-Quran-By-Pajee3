// Thin route file. The page itself lives in src/views so English, Urdu and Arabic share one implementation.
import Page, { generateMetadata as meta } from "@/views/courses/page";

const params = Promise.resolve({ lang: "ar" });
export const generateMetadata = () => meta({ params });
export default function Route() {
  return <Page params={params} />;
}
