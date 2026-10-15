import { describe, expect, it } from "vitest";
import { detailSchema } from "../../src/lib/operations";

const taskId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const action = {
  workspace_id: "33333333-3333-4333-8333-333333333333",
  actor_id: "44444444-4444-4444-8444-444444444444",
  task_id: taskId,
  expires_at: "2026-10-15T12:00:00+00:00",
  subject: "Synthetic follow-up",
  body: "A source-backed draft for local verification.",
  recipient: "reviewer@example.test",
  account: "internal-drafts",
  operation: "record_draft_and_commitments",
  commitments: ["Review the agreed next step."],
  source_ids: [documentId],
  source_hashes: { [documentId]: "a".repeat(64) },
};
const detail = {
  id: taskId,
  status: "completed",
  stage: "verified",
  attempt: 1,
  request: {
    request: "Prepare a synthetic follow-up.",
    client: "Synthetic project",
    recipient: action.recipient,
    account: action.account,
    document_ids: [documentId],
  },
  error: null,
  created_at: "2026-10-15T11:00:00Z",
  updated_at: "2026-10-15T11:05:00Z",
  result: { summary: "Synthetic review complete.", source_ids: [documentId] },
  approval: {
    payload: action,
    payload_hash: "b".repeat(64),
    expires_at: action.expires_at,
    decision: "approved",
  },
  receipt: {
    id: "55555555-5555-4555-8555-555555555555",
    verification: "Internal draft recorded; no external message sent.",
    artifact: action,
  },
  events: [],
};

describe("receipt export data boundary", () => {
  it("retains the complete approved envelope and original evidence hashes", () => {
    const parsed = detailSchema.parse(detail);
    expect(parsed.approval?.payload).toEqual(action);
    expect(parsed.receipt?.artifact).toEqual(action);
  });

  it("rejects evidence keys and hashes that cannot represent the approval proof", () => {
    for (const source_hashes of [
      { "invalid-source": "a".repeat(64) },
      { [documentId]: "invalid-hash" },
    ]) {
      expect(
        detailSchema.safeParse({
          ...detail,
          receipt: {
            ...detail.receipt,
            artifact: { ...action, source_hashes },
          },
        }).success,
      ).toBe(false);
    }
  });

  it("strips unrelated authentication fields from the task and receipt artifact", () => {
    const parsed = detailSchema.parse({
      ...detail,
      csrf: "test-csrf",
      session: "test-session",
      receipt: {
        ...detail.receipt,
        artifact: { ...action, csrf: "test-csrf", session: "test-session" },
      },
    });
    expect(parsed).not.toHaveProperty("csrf");
    expect(parsed).not.toHaveProperty("session");
    expect(parsed.receipt?.artifact).toEqual(action);
  });
});
