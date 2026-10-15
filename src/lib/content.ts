import { z } from "zod";
import rawContent from "@/data/content.json";
import rawDemo from "@/data/demo.json";
import rawOperations from "@/data/operations.json";
import rawConfig from "../../config/frontend.json";
import { routeKeySchema } from "./site-pages";

const email = z.email();
const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  client: z.string(),
  type: z.string(),
  agent: z.string(),
  status: z.enum(["approval", "completed", "blocked", "unknown", "rejected"]),
  time: z.string(),
  description: z.string(),
  recipient: email,
  account: email,
  subject: z.string(),
  body: z.string(),
  sources: z.array(z.string()),
  events: z.array(z.string()),
});
const sourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  client: z.string(),
  version: z.string(),
  excerpt: z.string(),
  updated: z.string(),
});
const connectionSchema = z.object({
  name: z.string(),
  initial: z.string(),
  description: z.string(),
  scope: z.string(),
  state: z.string(),
});
const settingsSchema = z.object({
  siteUrl: z.url(),
  routes: z.record(routeKeySchema, z.string().regex(/^\/(?:[a-z0-9-]+\/)*$/)),
  seo: z.strictObject({ noIndexRoutes: z.array(routeKeySchema) }),
  core: z.object({
    apiPrefix: z.string(),
    pollMilliseconds: z.number().int().positive(),
  }),
  media: z.object({ hero: z.string(), heroSmall: z.string() }),
  motion: z.object({
    revealSeconds: z.number().positive(),
    microSeconds: z.number().positive(),
    scrollLerp: z.number().positive().max(1),
    revealDistance: z.number().nonnegative(),
    heroParallax: z.number().nonnegative(),
  }),
  preview: z.object({ port: z.number().int().positive(), host: z.string() }),
  demo: z.object({
    workspace: z.string(),
    workspaceTag: z.string(),
    label: z.string(),
    disclaimer: z.string(),
    date: z.string(),
    defaultTask: z.string(),
  }),
  external: z.object({ hermes: z.url() }),
});

export const settings = settingsSchema.parse({
  ...rawConfig,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || rawConfig.siteUrl,
});
type ContentNode = string | ContentNode[] | { [key: string]: ContentNode };
const contentTree: z.ZodType<ContentNode> = z.lazy(() =>
  z.union([
    z.string().min(1),
    z.array(contentTree).min(1),
    z.record(z.string(), contentTree),
  ]),
);
contentTree.parse(rawContent);
contentTree.parse(rawOperations);
export const operationsContent = rawOperations;
const navigationLink = z.strictObject({
  label: z.string().min(1),
  route: routeKeySchema,
});
export const content = {
  ...rawContent,
  nav: z.array(navigationLink).min(1).parse(rawContent.nav),
  footer: {
    ...rawContent.footer,
    groups: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          links: z.array(navigationLink).min(1),
        }),
      )
      .min(1)
      .parse(rawContent.footer.groups),
  },
};
export const demoData = z
  .object({
    tasks: z.array(taskSchema),
    sources: z.array(sourceSchema),
    connections: z.array(connectionSchema),
  })
  .parse(rawDemo);
export type DemoTask = z.infer<typeof taskSchema>;
export type TaskStatus = DemoTask["status"];
export type WorkspaceView =
  "overview" | "approvals" | "agents" | "knowledge" | "connections";
export const statusLabels: Record<TaskStatus, string> = {
  approval: content.ui.needsApproval,
  completed: content.ui.completed,
  blocked: content.ui.blocked,
  unknown: content.ui.unknown,
  rejected: content.ui.rejected,
};
