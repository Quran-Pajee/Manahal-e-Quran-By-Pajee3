import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7EF",
    theme_color: "#123D32",
    icons: [
      { src: "/brand/manahil-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/manahil-app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/manahil-app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
