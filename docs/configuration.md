# Configuration and local setup

## Configuration owners

| Concern                                   | Public definition                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend origin, routes and UI settings   | `config/frontend.json`, typed through `src/lib/content.ts` and related schemas |
| Canonical origin override                 | Root `.env.example`: `NEXT_PUBLIC_SITE_URL`                                    |
| Copy, public sections and example records | `src/data/` JSON with `src/lib/` validators                                    |
| Backend runtime limits                    | `backend/praxis/settings.py`: `Settings`                                       |
| Owner bootstrap                           | `BootstrapSettings`; private owner credentials                                 |
| Inference-child environment               | `BrainSettings` and `brain_environment()` allowlist                            |
| Container/release settings                | `DeploymentSettings`, Compose and public environment examples                  |
| Standalone website settings               | `deploy/site/runtime.example.json`; copy to private `runtime.json`             |
| Hermes/base-image provenance              | `config/core-runtime.json`                                                     |
| Role instructions                         | `backend/data/prompts.json`                                                    |
| Dependency compatibility patch            | `backend/patches/dependency-pins.json` and `patch_hermes.py`                   |

Do not duplicate model IDs, endpoints, budgets or copy in business logic. Public digests identify artifacts; passwords/private keys do not belong in source, logs, command arguments or browser data. Keep deployment settings separate from API/worker environments. Do not inject the full host environment into inference processes.

## Frontend setup

Install Node 22 and run `npm ci`. Copy root `.env.example` to a private local environment file if an origin override is required; configure the example origin before publication. Run `npm run dev`, then type/lint/test/build commands from the root README. Build emits `out/` and updates `deploy/headers.conf` from emitted inline scripts. A standalone static server serves public pages; operations additionally require a same-origin API proxy.

## Backend setup

1. Install Python 3.14, PostgreSQL 18 and Ollama. Create a dedicated local database and application role. Never reuse production credentials for development or regression tests.
2. Create an environment and install locked dependencies. Development requirements are for development/test only.

   ```sh
   python3.14 -m venv .venv
   . .venv/bin/activate
   python -m pip install -r backend/requirements.lock
   python -m pip install -r backend/requirements-dev.txt
   cp backend/.env.public.example backend/.env.example
   ```

3. Obtain the Hermes archive for the revision in `config/core-runtime.json` from the [official repository](https://github.com/NousResearch/hermes-agent). Verify its SHA-256 against `archiveSha256` before extraction. Keep it in a local dependency directory; do not follow the default branch implicitly. Docker preparation expects the verified archive as `hermes-pinned.tar.gz` in the backend build context.
4. Run `python backend/patches/patch_hermes.py <hermes-directory>/pyproject.toml`, then `python -m pip install --no-deps --editable <hermes-directory>`. The patch changes dependency metadata only; review the manifest before using another revision. Confirm `from run_agent import AIAgent` imports under the final runtime user with a valid home directory.
5. Configure the private environment: database DSN, explicit local model URL and tested model ID, owner credentials, exact browser origin, allowed hosts, paths and budgets. Paths in the example are root-relative; resolve them for the process working directory, or use installation-specific absolute paths privately. Select and inspect the actual model artifact instead of trusting a mutable generic tag. Weight download belongs to a controlled bootstrap network that is removed before agents run.
6. Load the private environment through a process manager's environment-file facility, preserving JSON such as allowed-host lists. `Settings` deliberately does not auto-discover dotenv files. Run `python -m praxis.serve` and `python -m praxis.worker` from `backend/` with their respective settings. API startup also consumes owner bootstrap settings. For a local terminal, the locked `python-dotenv` package can explicitly load the ignored file before the module starts; run each command separately from `backend/`:

   ```sh
   python -c "from dotenv import load_dotenv; import runpy; load_dotenv('.env.example', override=False); runpy.run_module('praxis.serve', run_name='__main__')"
   python -c "from dotenv import load_dotenv; import runpy; load_dotenv('.env.example', override=False); runpy.run_module('praxis.worker', run_name='__main__')"
   ```

Use a same-origin local reverse proxy matching `PRAXIS_ORIGIN` and the configured prefix. Do not bypass origin checks with broad CORS. Local HTTP requires explicitly disabled secure cookies; exposed installations require HTTPS and secure cookies.

## Tests and budgets

Copying the public example to the ignored `.env.example` supplies the configuration-test inventory; it does not automatically load runtime variables. Before PostgreSQL tests, set the DSN to the disposable database named `praxis_qa`; fixtures truncate QA state. The public example's application DSN is not the test database.

Example limits are fictional local settings, not deployment capacity recommendations. Runtime schemas enforce body/input/context limits, attempts and deadlines. Budget changes need hardware measurements and a verified release. Current production uses a 600-second per-role budget; the example's lower value is not its deployed setting.

Record actual recovery material in private access-controlled storage and verify Git exclusion before writing. Unknown secrets stay unconfigured. Use distinct database-bootstrap and application roles. Read [deployment](deployment.md) before exposing an installation.

## Public build context

Run `python3 scripts/prepare-core-build.py` from the root. It reads `config/core-build.json` and the pinned runtime provenance, verifies the official archive's exact hash/revision/path/member limits without executing it, and assembles a fresh ignored `build/core` context from a public allowlist. An already downloaded official archive can be supplied with `--archive`. Do not use the repository root as a Docker context or copy private runtime files into it.

Read the generated `build-manifest.json` for `buildArguments.PYTHON_IMAGE`; pass that exact digest as Docker's `PYTHON_IMAGE` build argument and select a new local image tag. Build from the generated context. Do not blindly overwrite the tested runtime tag in `config/core-runtime.json`. Preparation verifies inputs; an actual image build, final-user import and PostgreSQL regressions must still pass before release.

## Local security tooling

For Linux/WSL, create and activate a Python 3.12 `.venv-security`, install `.github/requirements-security.txt`, install the verified Gitleaks 8.30.1 CLI on PATH and run `pre-commit install`. Create the ignored scanner output directory with `mkdir -p memory/security` before running hooks. Keep the security environment active so Semgrep and Gitleaks resolve on PATH. The pinned requirements include pre-commit, Bandit and Semgrep; none of the three scanner hooks should be disabled.

The public CI workflow is a reproducible gate definition. Local equivalent checks are recorded separately; a hosted run is successful only when an actual GitHub Actions result is observed. See [contributing](../CONTRIBUTING.md) for change and reporting rules.
