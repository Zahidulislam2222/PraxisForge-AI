import { describe, expect, it } from "vitest";
import { pageKeys, sitePages, sitePagesSchema } from "../../src/lib/site-pages";
import { settings, content } from "../../src/lib/content";
import { pageForSegments, pageMetadata } from "../../src/lib/site-routing";
import sitemap from "../../src/app/sitemap";
import robots from "../../src/app/robots";

describe("complete public website contract", () => {
  it("provides every page at a unique reachable path and resolves nested legal routes", () => {
    expect(pageKeys).toHaveLength(16);
    expect(Object.keys(settings.routes)).toHaveLength(20);
    expect(new Set(Object.values(settings.routes)).size).toBe(20);
    for (const key of pageKeys) {
      expect(
        pageForSegments(settings.routes[key].split("/").filter(Boolean)),
      ).toBe(key);
      expect(sitePages.pages[key].sections.length).toBeGreaterThan(0);
    }
    expect(pageForSegments(["legal", "privacy"])).toBe("privacy");
    expect(pageForSegments(["does-not-exist"])).toBeUndefined();
  });
  it("keeps public metadata distinct and private/demo routes outside the sitemap", () => {
    const titles = pageKeys.map((key) => pageMetadata(key).title);
    expect(new Set(titles).size).toBe(16);
    for (const key of pageKeys)
      expect(pageMetadata(key).alternates?.canonical).toBe(
        new URL(settings.routes[key], settings.siteUrl).href,
      );
    expect(sitemap()).toHaveLength(18);
    for (const key of settings.seo.noIndexRoutes)
      expect(
        sitemap().some(
          (entry) =>
            entry.url === new URL(settings.routes[key], settings.siteUrl).href,
        ),
      ).toBe(false);
    expect(JSON.stringify(robots().rules)).toContain(settings.core.apiPrefix);
  });
  it("makes every page discoverable through the shared footer", () => {
    const linked = content.footer.groups.flatMap((group) =>
      group.links.map((link) => link.route),
    );
    for (const key of pageKeys) expect(linked).toContain(key);
  });
  const invalidCases: [string, (draft: Record<string, unknown>) => void][] = [
    [
      "missing page",
      (draft) => {
        delete (draft.pages as Record<string, unknown>).pricing;
      },
    ],
    [
      "unknown route",
      (draft) => {
        (draft.pages as typeof sitePages.pages).pricing.cta.primary.route =
          "missing" as never;
      },
    ],
    [
      "duplicate section",
      (draft) => {
        const page = (draft.pages as typeof sitePages.pages).privacy;
        page.sections[1].id = page.sections[0].id;
      },
    ],
    [
      "empty section",
      (draft) => {
        const section = (draft.pages as typeof sitePages.pages).pricing
          .sections[0];
        section.items = [];
        delete section.paragraphs;
      },
    ],
    [
      "invalid email",
      (draft) => {
        (draft.common as typeof sitePages.common).contactEmail =
          "missing-at.example.test";
      },
    ],
    [
      "unsafe citation",
      (draft) => {
        (draft.pages as typeof sitePages.pages).privacy.sources = [
          { label: "Unsafe", url: "javascript:alert(1)" },
        ];
      },
    ],
    [
      "invalid date",
      (draft) => {
        (draft.pages as typeof sitePages.pages).privacy.updated = "2026-02-30";
      },
    ],
    [
      "unknown field",
      (draft) => {
        draft.unreviewed = true;
      },
    ],
  ];
  for (const [name, mutate] of invalidCases)
    it(`rejects ${name} before rendering`, () => {
      const draft = structuredClone(sitePages) as Record<string, unknown>;
      mutate(draft);
      expect(sitePagesSchema.safeParse(draft).success).toBe(false);
    });
});
