# Security and threat model

## Scope and assets

The supported deployment is a trusted operator using authenticated self-hosted operations. Assets include workspace evidence, task inputs, drafts, recipient details, approval intent, business records, authentication material, model provenance and recovery artifacts. The release does not claim independent hostile-tenant isolation or safe arbitrary code/browser execution.

Threat entry points include browser requests, selected knowledge, model output, dependencies, deployment/configuration and privileged host access. Text from a source is untrusted evidence; it must not confer tool capability or override deterministic authorization.

| Threat                                      | Current mitigation                                                                                           | Residual boundary / further work                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Session theft, CSRF and credential guessing | Hashed opaque sessions/CSRF; secure HttpOnly Strict cookies; exact origin; edge and identity limits          | No MFA/OIDC; compromised browser/host can defeat this boundary                                                   |
| Cross-workspace access                      | Membership checks and workspace-qualified SQL; task-owner approval/cancellation                              | Not a hostile-tenant isolation certification; stronger policies and adversarial coverage needed before expansion |
| Prompt-injected action                      | Disabled general tools/egress, inference-only environment, strict output and human approval                  | Incorrect or persuasive prose remains possible; reviewer must inspect content                                    |
| Approval tamper or replay                   | Canonical hash, actor/workspace/task/account/recipient/content/source/expiry binding and transactional locks | Exact internal commit is proven; future provider effects need independent reconciliation                         |
| Duplicate or stale execution                | Workspace idempotency, fenced leases, cancellation and atomic settlement                                     | Read-only planning may repeat; no claim of external exactly-once delivery                                        |
| Resource exhaustion                         | Body/context/queue/runtime limits and container resources                                                    | Shared host and CPU model remain finite; no large-traffic benchmark                                              |
| Secret propagation                          | Separate runtime scopes; inference children lack business credentials; ignored recovery storage              | Host administrators retain access; encryption-at-rest is not claimed for all volumes                             |
| Dependency/model supply chain               | Exact lock, pinned source/image/model provenance, reviewed metadata patch and audits                         | Scanners miss issues; maintain patch/compatibility review                                                        |
| Malicious restore/artifact                  | Authenticated encryption, size limits and separate owned restore database                                    | Key loss or compromise defeats recovery; clean-host recovery still unmeasured                                    |

## Container and network controls

Application containers run nonroot and read-only with dropped capabilities, no-new-privileges, bounded temporary storage and no container-management socket. Database/model/worker use private networking; web ingress is loopback behind TLS. Model weights download under a separate bootstrap allowance that must be removed before execution. General agent shell/browser tools and cloud fallbacks are disabled.

Containers are not a complete boundary against host compromise, kernel vulnerabilities or mutually hostile customers. Before enabling untrusted execution, introduce a stronger isolation design, constrained egress and separate identities, then test the actual boundary.

## Approval integrity

The person approves a full artifact rather than a vague instruction. The API locks the relevant records and validates ownership, source versions, expiry and canonical hash in the same transaction as the commit. Receipts, commitments, episode and task completion settle together. Inaccessible/deleted/changed evidence invalidates approval. Replaying a consumed approval fails. The only implemented operation records internal drafts; external delivery is absent.

## Assurance limits

Real authorization/race/recovery regressions and source/dependency scanning passed the release gates. No penetration-test certification, SOC 2 report, ISO certification, GDPR certification or security guarantee is claimed. The application event ledger is not append-only against a privileged database administrator. Backups include sensitive authentication records and require equivalent access protection.

Report concerns through [SECURITY.md](../SECURITY.md). Use the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) as voluntary risk-management guidance, not a certification or law. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) provides a useful verification reference; no complete ASVS conformance claim is made.
