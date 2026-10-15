# Integration status

Capabilities are explicit. A dependency's upstream features do not automatically become product features. The authenticated capabilities endpoint reports the current boundary; the table below describes the release verified on 15 October 2026.

| Capability                 | Current behavior                                                              | Further work                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Hermes Agent               | Pinned `AIAgent` surface; three isolated roles and strict artifact validation | Controlled skills, broader execution and evaluation-driven promotion                                         |
| Local inference            | Ollama-backed explicit model selection; private runtime and no paid fallback  | Measured accelerator scheduling, wider model comparisons and admission controls                              |
| Knowledge                  | Workspace text sources, versions, hashes, bounded selected context            | File extraction, OCR, embeddings, hybrid retrieval and deletion propagation                                  |
| Internal actions           | Exact human approval, atomic draft/commitments/receipt/episode                | External executor with independent capability policy                                                         |
| Email                      | Draft content and recipient are reviewable; no delivery                       | Account-scoped OAuth, minimal scopes, approval, idempotency/reconciliation and provider receipt verification |
| CRM                        | No connection or remote update                                                | Mapping, scoped credentials, field-level diffs, safe retries and verified outcomes                           |
| Drive and office documents | No remote file synchronization or document editing                            | Separate API capabilities for each supported resource and operation                                          |
| Chat/messaging             | No pairing, webhook ingestion or sending                                      | Verified identity, replay protection and operation-specific authorization                                    |
| Identity                   | Owner bootstrap, opaque sessions, workspace membership                        | OIDC, MFA, invitations, granular administration and stronger tenant isolation                                |
| Scheduling                 | Durable manually submitted tasks                                              | Timezone/DST rules, occurrence keys, missed-run policy and fairness                                          |
| Clouds                     | Existing self-hosted installation                                             | Independently cost-checked portability/validation profiles; no assumed ongoing free eligibility              |

## Connector admission contract

A new connector must declare the account owner, minimal scopes, allowed operations, destination policy, input/output schemas, rate limits, token lifecycle, audit fields and reconciliation strategy. Agents may propose an action; a separate deterministic executor must hold credentials and enforce policy. An unrestricted tool call is not an acceptable substitute.

Before activation, test two distinct accounts, revoked/expired tokens, forged callback state, repeated webhooks, provider throttling and timeouts before/after possible acceptance. Unknown outcomes require reconciliation rather than automatic resend. Record actual supported operations: a Drive read integration, for example, does not establish Docs/Sheets/Slides editing.

Changing provider, model or connector must pass configuration, privacy, licensing, security and quality review. Added service charges require an explicit cost decision; local inference has hardware and operating costs even without per-call API billing. See the [roadmap](roadmap.md) for incremental admission gates.
