# Evaluation and release evidence

## What was exercised

The release accepted on 15 October 2026 passed ten bounded core criteria with an explicit qualification: dashboard counts describe the most recent 100 tasks, not authoritative aggregate queue totals. Evidence combines deterministic regressions, actual browser operation, real inference and isolated recovery. These forms of evidence answer different questions.

| Layer                    | Recorded result                                                                                               | Limit                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Frontend regression      | 26 tests, TypeScript, lint, format and production build passed                                                | Does not replace actual browser behavior                                             |
| Backend regression       | 23 tests against real PostgreSQL in the immutable image                                                       | Defined cases, not exhaustive hostile-tenant testing                                 |
| Public browser           | 20 routes/20 hrefs, 30 responsive checks, 7 axe scans, 16 native interactions                                 | Sampled layouts and accessibility rules                                              |
| Owner UI                 | 21 viewport checks, 10 axe scans, no violations/overflow                                                      | No universal accessibility certification                                             |
| Authentication edge      | Twelve reserved fake identities returned six 401 and six 429 responses                                        | Defined probe, not a large denial-of-service test                                    |
| Live workflow            | Worker interruption, natural fenced recovery, three actual Hermes roles, exact approval and persisted outcome | One successful task, not a statistical benchmark                                     |
| Recovery                 | Encrypted off-host PostgreSQL snapshot restored separately; schema/11 business tables matched                 | Same-host isolated database, not replacement-host recovery                           |
| Artifact confidentiality | 152 export files checked against 16 actual secret values and encoded variants; no matches                     | Known-value scan plus pattern scanning; not a proof against all possible disclosures |

Real workflow verification covered evidence save, durable task submission, source-backed draft and two commitments, changed-hash rejection, native approval, replay rejection, receipt download, persisted episode/history after reload and logout. A semantic review checked seven expected facts against source material. Generated wording still requires editorial review; source support does not make every sentence necessary or well written.

Production model times were 201.60, 268.13 and 396.59 seconds across coordinator, researcher and operator, totaling 866.32 seconds. These CPU timings establish that the configured bounded flow completed. They do not establish p95 latency, throughput, multilingual quality or reliable service for simultaneous users.

## Security and supply-chain gates

Recorded release gates included Gitleaks, Semgrep, backend Bandit severity checks and dependency advisory audits, alongside independent source review. Public source/export scans found no reported secrets; frontend and locked Python audits reported no known vulnerabilities at the time checked. Private operator tooling has documented reviewed low/generic scanner advisories rather than suppressed findings. Security tooling and advisories change: rerun on the actual publication/release revision.

Actual browser logs retain expected anonymous authentication failures and blocked Cloudflare analytics injections. No JavaScript page errors were observed. Do not convert that into a claim of zero console observations. The current mobile gate waits for complete engine metadata before checking geometry, so a loading state cannot conceal later overflow.

## Future evaluation program

Create a frozen, permission-reviewed task set with unambiguous expected commitments, cited facts, missing/conflicting sources and malicious source instructions. Keep development, tuning and held-out test cases separate. Record model/source/prompt/configuration hashes, per-case outputs, attempts, latency, resources and human review decisions.

Measure evidence recall, factual support, commitment correctness, unsupported-action avoidance, approval integrity, permission adherence and workflow completion separately. Include a deterministic extraction/routing baseline and single-role comparison before attributing benefit to multiple agents. Repeat stochastic tasks and publish case-level outcomes with uncertainty, not only an average score.

The roadmap proposes at least 100 representative cases repeated three times, with a proposed verified-completion target of at least 90%. These evaluations and target attainment have not been run or established. Unauthorized-action findings remain release blockers even if average quality is high. Accessibility should add assistive-technology and manual review against [WCAG 2.1](https://www.w3.org/TR/WCAG21/), beyond automated axe rules.
