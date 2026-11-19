// Thin route file. The page itself lives in src/views.
import Page, { generateMetadata as meta, generateStaticParams as staticParams } from "@/views/blog/[slug]/page";

type Props = { params: Promise<{ slug: string }> };
const withLang = (p: Props["params"]) => p.then((x) => ({ ...x, lang: "en" }));

// Guides can be added and changed in the admin panel, so new addresses are allowed and pages refresh within five minutes.
// Publishing or saving a guide refreshes its page straight away.
export const dynamicParams = true;
export const revalidate = 300;
export const generateStaticParams = () => staticParams({ params: { lang: "en" } });
export const generateMetadata = ({ params }: Props) => meta({ params: withLang(params) });
export default function Route({ params }: Props) {
  return <Page params={withLang(params)} />;
}
