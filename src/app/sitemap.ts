import type { MetadataRoute } from "next";
import { settings } from "@/lib/content";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.entries(settings.routes)
    .filter(
      ([key]) =>
        !settings.seo.noIndexRoutes.includes(
          key as keyof typeof settings.routes,
        ),
    )
    .map(([, path]) => ({ url: new URL(path, settings.siteUrl).href }));
}
