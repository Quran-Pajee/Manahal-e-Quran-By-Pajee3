// Thin route file. The page itself lives in src/views so English, Urdu and Arabic share one implementation.
import Page, { generateMetadata as meta } from "@/views/page";

export const revalidate = 3600;

const params = Promise.resolve({ lang: "ar" });
export const generateMetadata = () => meta({ params });
export default function Route() {
  return <Page params={params} />;
}
