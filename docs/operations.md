# Operations and observability

## Routine checks

Check the public site and authenticated application separately. `GET /api/health` establishes a database-backed API response, not usable inference or successful workflows. Authenticated capabilities report the actual engine/model boundary. Compose health checks cover service readiness and worker heartbeat; inspect the actual running image/configuration when investigating a mismatch.

| Signal                      | Interpretation                               | Operator response                                                                |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Public route or TLS failure | Edge/static publication unavailable          | Check owned route, origin certificate, current bundle and rollback compatibility |
| API health fails            | Control plane or database path unavailable   | Inspect service state, storage and connections before restarting                 |
| Worker heartbeat stale      | Worker may be stopped or blocked             | Compare process/lease state; allow fenced recovery, avoid duplicate submission   |
| Task remains queued/running | Admission, lease or inference delay          | Inspect events, attempt and stage; compare actual configured budget              |
| Task blocked/failed         | Evidence, output contract or runtime failure | Read safe failure state; correct evidence/configuration and submit deliberately  |
| Approval returns 409        | Changed, expired or consumed artifact        | Refresh and review a new exact artifact; never override the check                |
| Authentication 429          | Edge/application budget exhausted            | Respect retry window; investigate abuse without logging passwords                |
| Disk/RAM pressure           | Host resource risk                           | Pause admission/heavy jobs, preserve data, free only known disposable artifacts  |

Avoid running heavyweight builds and model work together without a measured memory envelope. CPU inference latency is substantial: the completed production run used about 14.5 minutes of model work. A long task should not be relabeled successful because services are healthy.

## Current diagnostic evidence

Task detail exposes attempt/stage, ordered events, approval and receipt. Workspace memory exposes episodes and commitments. Recent-task dashboards cover the most recent 100 tasks; they are not an aggregate queue metric. Heartbeats support liveness checks. These are useful operator records, not a complete OpenTelemetry deployment or tamper-proof external audit ledger.

Treat logs, events and artifacts as potentially sensitive: requests, selected source text, generated drafts and recipient details may be present. Restrict access, redact authentication values, and avoid copying raw customer data into public issues. Never log session/login responses, environment files or secrets. Verify log retention at the host and edge; no universal fixed retention period is enforced by this release.

## Incident handling

Record affected functions and last known-good release. Pause new work when identity, approval integrity or data consistency is in doubt. Preserve task states, artifacts and audit evidence; do not repair outcomes by editing business rows. Distinguish infrastructure failure, model quality, missing evidence and action-policy denial.

Use a compatible rollback or isolated restore when required. Reconcile tasks and receipts before resuming. For a credential exposure, revoke/rotate the actual affected material, invalidate relevant sessions and review dependent recovery copies. Assess legal notification duties against affected people and jurisdictions; a generic incident timer is not a substitute for that assessment.

## Planned observability

Add redacted request correlation and end-to-end traces across API, queue, roles, approval and receipt. Export aggregate admission/lease-age/recovery/error metrics, resource utilization, inference queue/service times and backup freshness. Build alerts from measured availability/error-budget burn, stalled work and recovery failures. Do not publish text, email addresses or tenant identifiers as metric labels.

Automated alert delivery, on-call coverage, synthetic monitoring history and aggregate latency distributions are not currently established. The [future SLO](scalability-slo.md) specifies measurement before availability claims; [evaluation](evaluation.md) separates business correctness from service uptime.
