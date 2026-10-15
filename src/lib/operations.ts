import { z } from "zod";
import { operationsContent, settings } from "./content";

export const sessionSchema = z.object({
  email: z.string(),
  csrf: z.string(),
  workspaces: z.array(
    z.object({ id: z.uuid(), name: z.string(), role: z.string() }),
  ),
});
export type OwnerSession = z.infer<typeof sessionSchema>;
export const documentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  source: z.string(),
  version: z.number(),
  content_hash: z.string(),
  content: z.string(),
  created_at: z.string(),
});
export type KnowledgeDocument = z.infer<typeof documentSchema>;
const requestSchema = z.object({
  request: z.string(),
  client: z.string(),
  recipient: z.string(),
  account: z.string(),
  document_ids: z.array(z.string()),
});
export const taskSchema = z.object({
  id: z.uuid(),
  status: z.enum([
    "queued",
    "running",
    "approval",
    "completed",
    "blocked",
    "failed",
    "cancelled",
    "rejected",
  ]),
  stage: z.string(),
  attempt: z.number(),
  request: requestSchema,
  error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RealTask = z.infer<typeof taskSchema>;
const actionSchema = z.object({
  workspace_id: z.uuid(),
  actor_id: z.uuid(),
  task_id: z.uuid(),
  expires_at: z.iso.datetime({ offset: true }),
  subject: z.string(),
  body: z.string(),
  recipient: z.string(),
  account: z.string(),
  operation: z.string(),
  commitments: z.array(z.string()),
  source_ids: z.array(z.uuid()),
  source_hashes: z.record(z.uuid(), z.string().regex(/^[a-f0-9]{64}$/)),
});
export const detailSchema = taskSchema.extend({
  result: z
    .object({ summary: z.string(), source_ids: z.array(z.string()) })
    .nullable(),
  approval: z
    .object({
      payload: actionSchema,
      payload_hash: z.string(),
      expires_at: z.string(),
      decision: z.string().nullable(),
    })
    .nullable(),
  receipt: z
    .object({
      id: z.string(),
      verification: z.string(),
      artifact: actionSchema,
    })
    .nullable(),
  events: z.array(
    z.object({
      kind: z.string(),
      detail: z.record(z.string(), z.unknown()),
      created_at: z.string(),
    }),
  ),
});
export type TaskDetail = z.infer<typeof detailSchema>;
export const capabilitiesSchema = z.object({
  engine: z.string(),
  revision: z.string(),
  model: z.string(),
  local_only: z.boolean(),
  model_available: z.boolean(),
  limits: z.object({
    requestChars: z.number().int().positive(),
    documentChars: z.number().int().positive(),
  }),
  roles: z.array(z.string()),
  connectors: z.record(z.string(), z.string()),
});
export type Capabilities = z.infer<typeof capabilitiesSchema>;
export const memorySchema = z.object({
  episodes: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      task_id: z.string(),
      created_at: z.string(),
    }),
  ),
  commitments: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      task_id: z.string(),
      created_at: z.string(),
    }),
  ),
});
export type WorkspaceMemory = z.infer<typeof memorySchema>;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function coreApi(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    csrf?: string;
    idempotencyKey?: string;
  } = {},
): Promise<unknown> {
  const response = await fetch(settings.core.apiPrefix + path, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.csrf ? { "X-CSRF-Token": options.csrf } : {}),
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  if (!response.ok) {
    let message = operationsContent.genericError;
    try {
      const error = await response.json();
      if (typeof error.detail === "string") message = error.detail;
    } catch {
      message = operationsContent.genericError;
    }
    throw new ApiError(response.status, message);
  }
  return response.json();
}
