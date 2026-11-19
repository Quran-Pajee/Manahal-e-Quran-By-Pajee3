// Thin route file. The page itself lives in src/views so English, Urdu and Arabic share one implementation.
import Page, { generateMetadata as meta, generateStaticParams as staticParams } from "@/views/courses/[slug]/page";

type Props = { params: Promise<{ slug: string }> };
const withLang = (p: Props["params"]) => p.then((x) => ({ ...x, lang: "ur" }));

export const dynamicParams = false;
export const generateStaticParams = () => staticParams();
export const generateMetadata = ({ params }: Props) => meta({ params: withLang(params) });
export default function Route({ params }: Props) {
  return <Page params={withLang(params)} />;
}
