import type { Metadata } from "next";
import { content, settings } from "./content";
import { pageKeys, sitePages, type PageKey, type RouteKey } from "./site-pages";

export function pageForSegments(
  segments: readonly string[],
): PageKey | undefined {
  const pathname = `/${segments.join("/")}/`;
  return pageKeys.find((key) => settings.routes[key] === pathname);
}

export function routeMetadata(
  title: string,
  description: string,
  key: RouteKey,
): Metadata {
  const canonical = new URL(settings.routes[key], settings.siteUrl).href;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: `${content.brand} ${content.brandSuffix}`,
      images: [{ url: settings.media.hero, width: 1600, height: 900 }],
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [settings.media.hero],
    },
  };
}

export function pageMetadata(key: PageKey): Metadata {
  const page = sitePages.pages[key];
  return routeMetadata(
    `${page.title} ${page.accent} — ${content.brand} ${content.brandSuffix}`,
    page.intro,
    key,
  );
}
