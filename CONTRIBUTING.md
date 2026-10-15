# Contributing

PraxisForge AI's original code is source-available for inspection with all rights reserved. Read [LICENSE](LICENSE) and request permission before reuse. Third-party licenses remain separate. Discuss proposed code contributions and their rights with the maintainer before submission; no automatic broad contributor-license grant is created by this guide.

## Change workflow

1. Define the problem, supported use and acceptance criteria before code. Keep one reviewable concern per change.
2. Inventory changeable values. Typed settings own environment/provider/deployment decisions; validated data files own copy/prompts; secrets stay private.
3. Implement locally with explicit authorization and input/output contracts. Models cannot authorize their own business writes. Preserve existing tests and add meaningful regressions for the changed behavior.
4. Run the applicable tests, type/lint/format/build, security and dependency checks. Exercise the real HTTP/UI/CLI flow. Distinguish mocked transport evidence from actual service behavior.
5. Obtain an independent review. Include exact behavior, evidence and limitations. Resolve blockers rather than suppressing scanners or weakening tests.
6. If deployment is authorized, reconcile drift first, stage a unique immutable bundle and verify actual local/live parity afterward. Do not edit production as the primary fix.

Frontend commands are in [README](README.md); backend setup and real PostgreSQL tests are in [backend/README](backend/README.md). Personal manual scripts stay in their ignored folder; tracked automated suites remain public. Never submit private execution artifacts or customer data as fixtures.

## Security checks

The project uses Gitleaks, Bandit and Semgrep. Follow the repository pre-commit configuration and public CI workflow. Tool availability, a successful syntax check and source review do not substitute for running the gates. Report missing gates honestly. New dependencies require official registry verification, licensing/advisory review and an exact reproducible lock.

Do not disable hooks, add scanner suppressions to avoid findings or move files outside scan scope. Safe placeholder values belong in public examples; production-looking test secrets are forbidden. Route security concerns through [SECURITY.md](SECURITY.md).

## Documentation quality

Describe current behavior separately from planned capabilities and measured results separately from targets. Preserve internal-only action semantics, the trusted-operator boundary and recovery limits. Never publish private host paths, IPs, account identifiers, task records or incident narratives. Keep public claims synchronized with maintained configuration and release evidence.
