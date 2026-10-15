import type { MetadataRoute } from "next";
import { settings } from "@/lib/content";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...settings.seo.noIndexRoutes.map((key) => settings.routes[key]),
        `${settings.core.apiPrefix}/`,
      ],
    },
    sitemap: new URL("/sitemap.xml", settings.siteUrl).href,
  };
}
