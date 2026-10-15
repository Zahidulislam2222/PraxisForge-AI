# Future capacity model and reliability objectives

## Current capacity boundary

The existing trusted-operator installation has no million-user load result, horizontally scaled inference fleet or measured availability history. One completed CPU workflow used 866.32 seconds of model work. Its 600-second per-role budget permits bounded completion but does not increase compute throughput. Static-page availability, API availability and correct AI completion are distinct measurements.

## Target: 1M+ concurrent users

The future architecture targets at least one million simultaneously connected or active sessions under an explicitly defined workload. This is not a count of registered users, daily visitors or simultaneous model executions. Define the mix before sizing: browsing sessions, authenticated API activity, workflow submissions, awaiting approvals and active inference all consume different resources.

The following arithmetic is an illustrative planning scenario, not benchmark evidence or a hardware recommendation:

| Assumption                                                           | Result                                                                                    |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1,000,000 connected sessions; 5% make one API request per 10 seconds | 5,000 requests/second average before bursts                                               |
| 1 KiB connection bookkeeping per session                             | About 0.95 GiB bookkeeping alone, excluding TLS, buffers, processes and application state |
| 0.01% of connected sessions submit one workflow per minute           | 100 submissions/minute, about 1.67/second                                                 |
| Serial-equivalent model service time of 866.32 seconds/workflow      | About 1,444 continuously busy single-workflow slots at that arrival rate, before headroom |
| Operate those hypothetical slots at 60% target utilization           | About 2,407 slots required under the same unrealistic linear assumptions                  |

The latter estimates use arrival rate × service time and deliberately expose the inference bottleneck. Actual hardware, batching, model quality, token lengths and task mix can change service time radically. Repeating one CPU measurement cannot predict an accelerator fleet. Measure the chosen deployment and queueing behavior; reject capacity claims without observed workloads and costs.

## Proposed architecture

Serve immutable public assets through a CDN/object origin with independently scalable routing. Keep APIs stateless apart from authoritative storage, use bounded connection pools and central session/revocation semantics, and scale from measured request latency/CPU/saturation. Replace frequent polling with authenticated resumable event delivery only after its fan-out and reconnect load are tested.

Separate durable admission/control from inference. Maintain per-workspace quotas, weighted fairness, backpressure, bounded queues and retry budgets. Autoscale on queue age and measured service demand as well as resource use. Preserve fencing and exact approval semantics across worker replicas. Do not allow horizontal scaling to create duplicate ownership or bypass account policy.

Evolve PostgreSQL with measured indexes/query plans, partitioned event/task history, archival retention and read replicas for explicitly stale-tolerant reads. Keep authorization and approval commits on authoritative transactional paths. Introduce cache/object storage with workspace-qualified keys, explicit invalidation and deletion propagation. Database sharding comes only after validating transaction boundaries and migration/reconciliation procedures; it is not an immediate remedy for slow inference.

Use separate inference pools by model/task class with measured accelerator memory, batching, concurrency and quality. Admission must account for model token and runtime budgets. Keep connector executors separate, rate-aware and reconciliable. Multi-zone or regional recovery requires state replication, failover fencing and tested ownership transfer rather than merely adding API replicas. [Kubernetes autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) describes one possible mechanism; Kubernetes is not part of the current deployed runtime.

## Progressive evidence gates

| Gate                            | Required evidence before admission expands                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Workload definition             | Session/activity/inference mix, payloads, burst factor, fairness and cost assumptions                                        |
| 100 → 1,000 concurrent sessions | Repeatable load generator, latency/error/resource measurements and zero lost submitted outcomes                              |
| 10,000 → 100,000                | Distributed tests, connection churn, sustained queue stability, tenant fairness and database contention                      |
| 1M+                             | Independently observed sustained workload, controlled regional/service failure, verified recovery and capacity/cost envelope |

Every gate needs declared duration, p50/p95/p99 latency, failures, queue growth, correctness, resource usage and spend. Use isolated non-production load infrastructure and licensed/synthetic data. No scale infrastructure purchase or paid load test is implied by this plan.

## Proposed 99% availability SLO

The future objective is 99% availability over a rolling 30-day window. For a time-based SLI, 30 days × 24 hours × 1% gives **7.2 hours** of unavailability. For a request-based SLI, the budget is 1% of eligible requests; converting that to hours is invalid without a defined time measurement. This is an objective to instrument and test, not an achieved result or contractual SLA.

Define separate indicators: public-page reachability, valid API request success, durable submission acceptance, and verified workflow completion/latency. Count service-caused errors and timeouts consistently. Exclude expected invalid authentication, contract rejection and policy denial from service-error denominators; do not hide capacity rejections or broken legitimate requests as user errors. Track them separately. Report planned maintenance transparently rather than subtracting it silently.

Instrument multiple external checks, actual request metrics and redacted workflow outcomes before publishing attainment. Specify sampling cadence, aggregation, partial failures, incident start/end and missing-data treatment. Alert on rapid/slow budget consumption and stalled work. When the budget is exhausted, prioritize reliability/security repair and restrict ordinary feature rollout until recovery, with explicit operator ownership. [Google SRE's error-budget guidance](https://sre.google/workbook/error-budget-policy/) informs this proposed policy; no equivalent operational staffing or historical attainment is claimed.

Availability cannot substitute for correct receipts, permission enforcement or useful drafts. Retain separate quality/security gates even when uptime meets its objective. See [evaluation](evaluation.md) and [recovery](disaster-recovery.md).
