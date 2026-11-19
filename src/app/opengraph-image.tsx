import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { site } from "@/content/site";

export const alt = `${site.name} by ${site.organisation.name}: online Quran classes for kids and adults`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ARCH = "M12 92V47C12 35 21 28.5 31 23.5C38 20 44 13 48 4C52 13 58 20 65 23.5C75 28.5 84 35 84 47V92Z";
const PAGES = "M48 59C41 53 32 52 25.5 55V78C32 75 41 76 48 82ZM48 59C55 53 64 52 70.5 55V78C64 75 55 76 48 82Z";

/** The picture shown when a page is shared on WhatsApp, Facebook or X. Built once when the site is built. */
export default async function OgImage() {
  // The heading face. If the file cannot be read the image still renders, in the default face.
  const serif = await readFile(path.join(process.cwd(), "node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff")).catch(() => null);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#123D32", color: "#FAF7EF", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="92" height="92" viewBox="0 0 96 96">
            <path d={ARCH} fill="none" stroke="#C7A45D" strokeWidth="3" />
            <path d={PAGES} fill="#FAF7EF" />
            <circle cx="48" cy="40.5" r="5" fill="#C7A45D" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 50, fontFamily: "Cormorant", lineHeight: 1 }}>{site.shortName}</div>
            <div style={{ marginTop: 8, fontSize: 19, letterSpacing: 5, color: "#C7A45D" }}>{`ACADEMY BY ${site.organisation.name}`}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontFamily: "Cormorant", lineHeight: 1.02, maxWidth: 1000 }}>Online Quran classes for kids and adults</div>
          <div style={{ marginTop: 28, width: 120, height: 2, background: "#C7A45D" }} />
          <div style={{ marginTop: 28, fontSize: 32, color: "rgba(250,247,239,0.85)" }}>{`One teacher, one learner, or a small group. ${site.trial.classes} free trial classes.`}</div>
        </div>
      </div>
    ),
    { ...size, fonts: serif ? [{ name: "Cormorant", data: serif, weight: 600, style: "normal" }] : undefined },
  );
}
