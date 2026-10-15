# Ten-phase engineering roadmap

The verified release implements a bounded subset across several phases: public frontend, owner sessions/workspaces, durable three-role tasks, text evidence, exact internal approvals, receipts and isolated encrypted database restore. This does not mark all ten phases complete. Each expansion requires local implementation, real behavior, security/configuration gates, independent review and deployment parity.

| Phase                                | Current foundation                                                                                    | Remaining scope and exit evidence                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Foundation and product shell      | Static website, authenticated operations, health/capabilities, pinned runtime, immutable releases     | Reproduce clean-machine setup and documented ownership/capacity envelope; preserve rollback                                                                              |
| 2. Identity and workspace boundaries | Owner bootstrap, sessions, membership/resource checks                                                 | OIDC/MFA/invitations, granular roles and stronger isolation; prove two workspaces cannot cross API/storage/cache/worker boundaries and revocation is effective           |
| 3. Durable execution                 | PostgreSQL claims, fenced leases, three roles, bounded retry/cancellation and actual restart recovery | Broader batch ledger/dependencies and failure taxonomy; interrupt a declared 100-item workload and account for every outcome without duplicate settlement                |
| 4. Knowledge and memory              | Versioned text, selected evidence hashes, commitments/episodes                                        | Extraction/OCR, hybrid retrieval, permission-filtered reranking, correction/retention/deletion propagation; evaluate held-out retrieval and unsupported-answer handling  |
| 5. Approval and action safety        | Exact artifact binding and atomic internal commit                                                     | Separate connector executor, scoped capabilities, outcome-unknown reconciliation; test before/after-provider acceptance failures and prove replay/tamper rejection       |
| 6. Agency connectors                 | No external delivery configured                                                                       | Minimal-scope email/Drive/messaging/CRM adapters; prove account ownership, token revocation, incremental sync and approved account-specific action with provider receipt |
| 7. Scheduling and visibility         | Events, heartbeats, recent-task UI                                                                    | Timezone/DST occurrence keys, fairness, redacted traces, aggregate metrics/alerts; verify missed-run recovery and resource/admission budgets                             |
| 8. Evaluation and recovery           | Real PostgreSQL regressions, browser flows, source scans, encrypted isolated restore                  | Frozen repeated quality suite, lifecycle/retention tooling, clean-host drill, WAL/PITR decision and measured recovery objectives                                         |
| 9. Controlled advanced execution     | General browser/shell tools disabled                                                                  | Reviewed versioned skills, sandboxed code/browser/multimodal adapters and permission-aware graph work; reject regressions and prove isolation/rollback before activation |
| 10. Engineering lab and handover     | Pinned provenance and operating documentation                                                         | Isolated experiments without production credentials, licensed datasets/splits, reproducible baselines and new-operator rebuild/restore/reconciliation drill              |

## Delivery discipline

For every phase, define source-of-truth configuration, typed contracts, explicit permissions, adverse cases and acceptance before implementation. Build and verify locally before deployment. Freeze hashes and actual runtime identity, preserve incompatible/failed candidates privately, and close the phase only when its required behavior and review pass.

External providers require a separate cost, scope, privacy and licensing decision. Cloud validation profiles are conditional on actual account eligibility and current cost checks; consumed trial credits are not an ongoing allowance. A paid assessment, GPU or API must not be silently introduced to satisfy an aspirational milestone.

## Research boundary

Model/skill/prompt/context improvements need measured comparisons against the current system and a simpler baseline. Training recipes do not establish a completed training experiment. Fine-tuning, DPO, reinforcement learning and full-size multimodal workloads remain hardware/data-dependent research. Keep training data permission-reviewed and held-out evaluation separate from tuning.

The [1M+ concurrent-session target and 99% SLO](scalability-slo.md) require a distinct capacity/reliability program. They are not automatic consequences of completing functional phases, and neither is an achieved claim for this release.
