# PraxisForge control plane

The backend owns authenticated workspace knowledge, durable task state, fenced worker execution, exact approvals, commitments, receipts and episodic records. Hermes supplies bounded planning and drafting; it receives neither business database credentials nor authority to commit actions.

Read the [architecture](../docs/architecture.md), [API](../docs/api.md), [configuration](../docs/configuration.md) and [threat model](../docs/security-threat-model.md) before exposing a deployment.

## Components

| Module                              | Responsibility                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `praxis/api.py`                     | Authentication, authorization, knowledge/tasks, approval transaction, health/capabilities |
| `praxis/worker.py`                  | PostgreSQL claiming, fenced leases, role progression, cancellation/failure                |
| `praxis/brain.py`                   | Isolated Hermes subprocess and structured-output boundary                                 |
| `praxis/model_protocol.py`          | Local model availability and protocol integration                                         |
| `praxis/contracts.py`               | Strict request and model-output schemas                                                   |
| `praxis/settings.py`                | Application, inference-child, bootstrap and deployment settings                           |
| `praxis/db.py`, `praxis/schema.sql` | Database connections and versioned schema bootstrap                                       |
| `data/prompts.json`                 | Maintained role instructions and output expectations                                      |

## Local setup

Python 3.14, PostgreSQL 18 and a separately configured Ollama service are required. Use a disposable local database and credentials. Copy [.env.public.example](.env.public.example) to the ignored `backend/.env.example` before running the configuration tests or preparing the Docker context. The example contains fictional test values and must be configured for an installation. Follow [setup](../docs/configuration.md#backend-setup) for the exact dependency lock, verified pinned Hermes archive, metadata patch and explicit environment loading.

With the environment loaded and the pinned Hermes import available, run from `backend/` in separate terminals:

```sh
python -m praxis.serve
python -m praxis.worker
```

API startup migrates the schema and creates the configured owner/workspace when absent. Changing the configured owner password updates its hash on startup and revokes existing owner sessions. This is a security-sensitive bootstrap operation, not a general account administration API.

## Verification

From the repository root, with development requirements, runtime variables explicitly loaded and a configured disposable PostgreSQL database named `praxis_qa`:

```sh
python -m ruff check --config backend/pyproject.toml backend/praxis backend/tests
python -m mypy --config-file backend/pyproject.toml backend/praxis
PYTHONPATH=backend python -m pytest -q backend/tests
```

Tests use real PostgreSQL. Inspect [fixtures](tests/conftest.py): they refuse other database names and truncate QA state. Never point tests at valuable data. Ensure the DSN names the disposable QA database rather than the example's application database. Host test execution uses the repository root because configuration inventory expects `backend/.env.example`; running from `backend/` changes that relative lookup. The final release ran 23 regressions inside the immutable image, plus real local and production UI workflows.

See [evaluation](../docs/evaluation.md) and [operations](../docs/operations.md). A model process exiting successfully does not complete a task; the business outcome requires the approved transaction and receipt.

## Boundaries

Supported account is `internal-drafts`; supported operation is `record_draft_and_commitments`. External email/CRM delivery, arbitrary browser/shell tools, public registration, OIDC, MFA and independent hostile-tenant service are unconfigured. Retrieval uses bounded text evidence without OCR/vector indexing. Generated prose requires human review. Privacy lifecycle automation, metrics export, WAL/PITR and clean-host recovery remain planned.
