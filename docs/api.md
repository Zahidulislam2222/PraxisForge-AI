# Implemented API

Current configured prefix is `/api`; it remains a typed setting. Paths below use it. The API is same-origin and cookie-authenticated. Interactive Swagger/ReDoc/OpenAPI routes are disabled in the deployed app. [contracts.py](../backend/praxis/contracts.py) and [api.py](../backend/praxis/api.py) are authoritative.

## Authentication and transport

`POST /api/login` accepts JSON email/password, requires the exact configured `Origin`, sets host-only secure HttpOnly SameSite=Strict cookies in HTTPS deployments, and returns email and CSRF value. `GET /api/session` returns account, memberships and CSRF value. Treat these responses as sensitive; never log them. Session/CSRF values are hashed in storage; the own-origin session response supplies CSRF to the browser client.

Authenticated mutations require the session cookie, exact `Origin` and `X-CSRF-Token`. POST/PUT/PATCH require JSON and a bounded declared content length. API responses use `Cache-Control: no-store`. The edge's shared authentication budget complements the application identity limit.

| Method and path                                           | Behavior                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET /api/health`                                         | Anonymous database-backed health; does not prove inference readiness    |
| `POST /api/login`                                         | Authenticate; 401 invalid credentials, 429 limited attempts             |
| `GET /api/session`                                        | Account and memberships; 401 without a valid session                    |
| `POST /api/logout`                                        | Revoke session and expire cookies                                       |
| `GET /api/capabilities`                                   | Authenticated engine/model availability and integration status          |
| `POST /api/workspaces`                                    | Create an owned workspace; 201                                          |
| `GET /api/workspaces/{workspace}/documents`               | Active workspace text evidence                                          |
| `POST /api/workspaces/{workspace}/documents`              | Add/version evidence; 201; identical active content can be deduplicated |
| `DELETE /api/workspaces/{workspace}/documents/{document}` | Clear that source's content and remove it from retrieval                |
| `POST /api/workspaces/{workspace}/tasks`                  | Durable submission; 202; `Idempotency-Key` required                     |
| `GET /api/workspaces/{workspace}/tasks`                   | Bounded recent history                                                  |
| `GET /api/workspaces/{workspace}/tasks/{task}`            | Task, events, approval and receipt; lease token omitted                 |
| `POST /api/workspaces/{workspace}/tasks/{task}/cancel`    | Owner cancellation of eligible unsettled work                           |
| `POST /api/workspaces/{workspace}/tasks/{task}/decision`  | Owner approves/rejects exact pending payload hash                       |
| `GET /api/workspaces/{workspace}/memory`                  | Bounded episode and commitment history                                  |

Membership is checked for workspace resources. Inaccessible resources commonly return 404 to avoid existence disclosure. Owner-only mutations can return 403.

## Contracts

| Request   | Fields                                                                                     |
| --------- | ------------------------------------------------------------------------------------------ |
| Workspace | `name`                                                                                     |
| Document  | `title`, `content`, `source`                                                               |
| Task      | `request`, `client`, `recipient`, `account: "internal-drafts"`, `document_ids`             |
| Decision  | `decision: "approve"` or `"reject"`, `payload_hash` as 64 lowercase hexadecimal characters |

Schemas reject extra fields. UUIDs identify resources. Runtime limits can be stricter than contract maxima. Task evidence requires 1–10 source identifiers belonging to the selected workspace.

## Idempotency, approval and errors

Task creation accepts an 8–120-character workspace-scoped `Idempotency-Key`. Same-input replay returns the original task; different input with the same key returns 409. Full queues return 429. This deduplicates internal submission, not future external effects.

Review the task detail's complete approval artifact, then submit its returned payload hash. Actor/workspace/task/expiry/source identity changes, expiration, hash mismatch or replay return 409. Only account `internal-drafts` and operation `record_draft_and_commitments` can commit. The receipt proves internal atomic state; no message is sent. Rejection settles without that commit. Already-settled cancellation returns 409.

Other expected classes: 401 authentication; 403 origin/CSRF/ownership/operation; 404 inaccessible resource/evidence; 413 body size; 415 media type; 422 schema/runtime limit; 429 admission/rate limiting. Expose failures clearly, preserve intended idempotency and request a new artifact when approval is stale. Never blindly retry a future external action whose provider outcome is uncertain.
