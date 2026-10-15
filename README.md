# PraxisForge AI

**Evidence-backed operations, exact human approval, durable outcomes.**

PraxisForge AI is a self-hosted operations platform powered by Nous Research’s Hermes Agent. It turns a request and selected workspace knowledge into a reviewed draft, source-backed commitments and a downloadable receipt. PostgreSQL owns workflow and business records; bounded agents propose work; an authenticated person authorizes the exact artifact before the control plane commits it.

[Website](https://praxisforge.zahidul-islam.com) · [Documentation](docs/README.md) · [Backend](backend/README.md) · [Security](SECURITY.md)

## Current release

The operations console supports versioned text knowledge, durable tasks, three isolated roles, cancellation, bounded retry and restart recovery. Approval binds actor, workspace, task, account, recipient, operation, content, source hashes and expiry. An accepted action atomically records its internal draft, commitments, receipt and workflow memory. Completed receipts can be downloaded as JSON with the approved artifact and evidence hashes, excluding session material.

The supported operating boundary is a trusted operator on a self-hosted installation. External email, CRM and messaging delivery are unconfigured: approval records an internal artifact and does not send a message. Independent hostile tenants, enterprise identity, document OCR/vector indexing and unrestricted agent tools are further work. Dashboard counts cover the most recent 100 tasks rather than authoritative lifetime totals.

The public website has 20 routes, maintained product and policy content, responsive navigation, self-hosted fonts, restrained motion, a pause control and reduced-motion support. The workspace route uses example records; authenticated Operations executes business workflows.

## Architecture

- **One workflow owner:** PostgreSQL task state, row locks, fenced leases and idempotency keys coordinate attempts. Hermes does not run a competing business scheduler.
- **Evidence before action:** versioned sources and bounded context feed coordinator, researcher and operator roles. Incomplete or unsupported output can block the task.
- **Human authorization outside the model:** agents cannot approve proposals. The API rechecks ownership, source versions, expiry and payload hash inside the commit transaction.
- **Explicit limits:** private local inference, resource-limited containers, bounded input/output and task budgets. No paid model fallback is configured.
- **Verifiable recovery:** immutable release manifests, actual runtime identity checks, encrypted off-host snapshots and isolated restore comparisons.

See [architecture](docs/architecture.md), [threat model](docs/security-threat-model.md) and [integration status](docs/integrations.md).

## Development

Use Node 22 and Python 3.14. Frontend dependencies are exact in `package-lock.json`; backend dependencies are locked in `backend/requirements.lock`. Hermes revision, archive digest and runtime provenance are maintained in `config/core-runtime.json`.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

The build produces a static `out/` export and regenerates CSP script hashes from the exact emitted payloads. Keep those headers with the matching export. Full TypeScript checks remain enabled through the compiler API. Stop idle local inference when heavyweight builds exceed available memory.

The backend requires a configured PostgreSQL database, pinned Hermes installation and separately running local model. The frontend alone cannot execute authenticated workflows. Read [setup and configuration](docs/configuration.md), [backend instructions](backend/README.md) and [deployment](docs/deployment.md) before exposing an installation.

## Verified release evidence

Release verification on 15 October 2026 included:

| Area                        | Observed result                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend suite              | 26 tests; type, lint, format and production build passed                                                                  |
| Backend regressions         | 23 tests against actual PostgreSQL from the immutable image                                                               |
| Public browser              | 20 routes, 20 href checks, 30 responsive checks, 7 zero-violation axe scans, 16 interactions                              |
| Authenticated accessibility | 21 viewport checks, 10 axe scans, no reported violations or horizontal overflow                                           |
| Real workflow               | Natural recovery after interruption; three Hermes roles; altered/replayed approval rejected; receipt and memory persisted |
| Production recovery         | Encrypted off-host snapshot restored separately; schema and 11 business tables matched; source unchanged                  |
| Publication safety          | 152 exported files checked against 16 actual configured secret values and encoded variants; no matches                    |

Observed CPU model work for one completed production workflow took 866.32 seconds across three roles. This is one measured run, not a reliability distribution or throughput benchmark. Public browser checks recorded expected anonymous 401 responses and Cloudflare analytics injections blocked by CSP, with no JavaScript page errors. Automated accessibility checks supplement keyboard and responsive testing and do not establish universal conformance.

Public source and dependency scans passed their recorded release gates. They do not establish an absence of all vulnerabilities. [Evaluation](docs/evaluation.md) describes coverage and limits.

## Documentation

| Need                                | Guide                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Control plane and agent boundary    | [Architecture](docs/architecture.md)                                                                               |
| Local installation or configuration | [Setup](docs/configuration.md), [backend](backend/README.md)                                                       |
| Implemented API                     | [API reference](docs/api.md)                                                                                       |
| Deploy, observe and recover         | [Deployment](docs/deployment.md), [operations](docs/operations.md), [disaster recovery](docs/disaster-recovery.md) |
| Security, privacy and suitability   | [Threat model](docs/security-threat-model.md), [privacy and legal](docs/privacy-legal.md)                          |
| Evidence and future scale           | [Evaluation](docs/evaluation.md), [capacity and SLO](docs/scalability-slo.md), [roadmap](docs/roadmap.md)          |

Scheduled backup retention, WAL/PITR, clean-host replacement and measured host-loss recovery objectives remain further work. A single self-hosted installation does not provide multi-region availability. The future one-million-concurrent-session architecture and 99% SLO are planning targets, not achieved capacity or a contractual SLA.

## Project and rights

Maintained by Zahidul Islam. Repository: [Zahidulislam2222/PraxisForge-AI](https://github.com/Zahidulislam2222/PraxisForge-AI), with frontend and backend together. Original project code is source-available for inspection, with all rights reserved; request permission before reuse. Public GitHub visibility does not grant an open-source license. See [LICENSE](LICENSE), [contributing](CONTRIBUTING.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Dependencies, fonts and models retain their respective rights.
