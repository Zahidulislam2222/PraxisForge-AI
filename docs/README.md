# Engineering documentation

This documentation describes the verified trusted-operator release as of 15 October 2026. Proposed systems and objectives are explicitly identified as future work. Repository-relative paths describe public source; production topology, recovery material and private execution evidence stay outside public artifacts.

| Guide                                                 | Purpose                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| [Architecture](architecture.md)                       | State ownership, workflow, trust boundaries and data flow         |
| [Configuration and setup](configuration.md)           | Typed settings, prerequisites and installation                    |
| [API reference](api.md)                               | Implemented endpoints, authentication and action semantics        |
| [Integrations](integrations.md)                       | Available capabilities and unimplemented provider connections     |
| [Deployment](deployment.md)                           | Immutable releases, provenance and rollback                       |
| [Operations](operations.md)                           | Checks, diagnostics, incidents and observability gaps             |
| [Security and threat model](security-threat-model.md) | Assets, surfaces, controls and residual risks                     |
| [Privacy and legal](privacy-legal.md)                 | Actual data handling, US/EU applicability and responsibilities    |
| [Evaluation](evaluation.md)                           | Recorded gates, real workflow evidence and future quality testing |
| [Disaster recovery](disaster-recovery.md)             | Encrypted snapshots, isolated restore and host-loss work          |
| [Scalability and SLO](scalability-slo.md)             | Future 1M+ concurrent-session model and 99% objective             |
| [Ten-phase roadmap](roadmap.md)                       | Incremental implementation and measurable exit criteria           |

Start with architecture, then setup. Before accepting sensitive business data, assess the threat model, privacy responsibilities and recovery limitations for the intended deployment. A successful bounded release does not establish suitability for regulated decisions, untrusted tenant execution or large-scale admission.

Repository policies: [security reporting](../SECURITY.md), [contributing](../CONTRIBUTING.md), [release history](../CHANGELOG.md), [third-party notices](../THIRD_PARTY_NOTICES.md).
