// Thin route file. The page itself lives in src/views so English, Urdu and Arabic share one implementation.
import Page, { generateMetadata as meta } from "@/views/free-trial/thank-you/page";

const params = Promise.resolve({ lang: "en" });
export const generateMetadata = () => meta({ params });
export default function Route() {
  return <Page params={params} />;
}
