import { z } from "zod";
import rawPages from "@/data/site-pages.json";

export const pageKeys = [
  "pricing",
  "about",
  "product",
  "features",
  "use-cases",
  "security",
  "contact",
  "docs",
  "changelog",
  "status",
  "legal",
  "privacy",
  "terms",
  "cookies",
  "accessibility",
  "resources",
] as const;
export const pageKeySchema = z.enum(pageKeys);

const copy = z.string().trim().min(1);
export const routeKeySchema = z.enum([
  "home",
  "workspace",
  "operations",
  "principles",
  ...pageKeys,
]);
const linkSchema = z.strictObject({ label: copy, route: routeKeySchema });
const sourceSchema = z.strictObject({
  label: copy,
  url: z.url({ protocol: /^https$/ }),
});
const itemSchema = z.strictObject({
  title: copy,
  body: copy,
  eyebrow: copy.optional(),
  meta: copy.optional(),
  bullets: z.array(copy).min(1).optional(),
  link: linkSchema.optional(),
  price: z
    .strictObject({ amount: copy, period: copy, detail: copy })
    .optional(),
  featured: z.boolean().optional(),
  status: z.enum(["available", "planned", "limited"]).optional(),
});

export const siteSectionSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    eyebrow: copy.optional(),
    title: copy,
    intro: copy.optional(),
    layout: z.enum(["cards", "steps", "rows", "faq", "timeline", "prose"]),
    items: z.array(itemSchema),
    paragraphs: z.array(copy).min(1).optional(),
    sources: z.array(sourceSchema).min(1).optional(),
  })
  .refine(
    (section) => section.items.length > 0 || !!section.paragraphs?.length,
    {
      message: "A section must contain items or prose.",
    },
  );

export const sitePageSchema = z
  .strictObject({
    eyebrow: copy,
    title: copy,
    accent: copy,
    intro: copy,
    notice: z.strictObject({ label: copy, text: copy }).optional(),
    updated: z.iso.date().optional(),
    sources: z.array(sourceSchema).min(1).optional(),
    sections: z.array(siteSectionSchema).min(1),
    cta: z.strictObject({
      eyebrow: copy,
      title: copy,
      text: copy,
      primary: linkSchema,
      secondary: linkSchema.optional(),
    }),
  })
  .superRefine((page, context) => {
    const seen = new Set<string>();
    page.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        context.addIssue({
          code: "custom",
          message: "Section IDs must be unique within a page.",
          path: ["sections", index, "id"],
        });
      }
      seen.add(section.id);
    });
  });

export const sitePagesSchema = z.strictObject({
  pages: z.record(pageKeySchema, sitePageSchema),
  common: z.strictObject({
    previewLabel: copy,
    availableLabel: copy,
    plannedLabel: copy,
    limitedLabel: copy,
    sectionLabel: copy,
    backToTop: copy,
    contactEmail: z.email(),
    contactEyebrow: copy,
    contactTitle: copy,
    contactText: copy,
    contactLinkLabel: copy,
    breadcrumbHome: copy,
    readMore: copy,
    updatedLabel: copy,
    sourcesLabel: copy,
  }),
});

export const sitePages = sitePagesSchema.parse(rawPages);
export type PageKey = z.infer<typeof pageKeySchema>;
export type SitePage = z.infer<typeof sitePageSchema>;
export type SiteSection = z.infer<typeof siteSectionSchema>;
export type RouteKey = z.infer<typeof routeKeySchema>;
export type SiteRoute = RouteKey;
