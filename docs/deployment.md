# Deployment and release integrity

## Supported model

The release uses a static Next.js export, same-origin reverse proxy and five core Compose services: PostgreSQL, local inference, API, worker and core web. A separate static website release can preserve the existing API route. Database/model/worker stay private; public ingress binds loopback behind a TLS edge. This describes a self-hosted operating model, not a managed hosting promise.

Public templates are in `deploy/core/`, `deploy/site/` and `deploy/`. Copy `deploy/site/runtime.example.json` to the ignored `runtime.json` and configure installation-specific values. Do not treat fictional paths, ports, networks or example credentials as allocations. Inventory actual listeners, routes, Docker networks, available RAM/disk and resource ownership before choosing them.

The backend Dockerfile requires a verified Hermes archive in its build context and an explicit Python image argument from `config/core-runtime.json`. Use `python3 scripts/prepare-core-build.py` to assemble the public allowlisted context; read its generated manifest and build a new local image tag from that context. Database/model/web images are digest-pinned through deployment settings. Build/pull preparation happens before activation; templates use `pull_policy: never`. Model bootstrap temporarily permits weight download, then removes that network before worker execution.

## Local-first release sequence

1. **Freeze and reconcile.** Snapshot the live files, running images, source manifests, configuration and data fingerprints for the affected project. Compare with local. Reconcile newer live changes locally before proceeding. Record unrelated shared resources that must remain untouched.
2. **Prepare locally.** Change source/configuration locally; run tests, type/lint/security/dependency checks and a fresh review. Produce the export, generated CSP, backend image and source provenance. Rehearse Compose configuration and actual startup.
3. **Seal a unique bundle.** Include matching static assets, generated headers, resolved templates, private settings and content hashes. Refuse an existing release identifier instead of replacing it. Protect private settings and keep them out of the public repository.
4. **Stage without routing traffic.** Transfer the immutable artifact, verify every remote hash and expected image/source identity, validate rendered configuration and start the candidate on its own verified loopback listener. Preserve the previous healthy release.
5. **Publish narrowly.** Validate the complete candidate proxy configuration before installing the project's route. Change only its owned route. Preserve unrelated routing/DNS. If proxy reload fails, restore only the route this release owns; do not perform broad shared-service cleanup.
6. **Verify actual runtime.** Check origin TLS, public HTTPS, all public routes, API health/session behavior, cookies/security headers, network isolation, actual container identities, image/model provenance and local/live file parity. Exercise browser functionality and recovery before declaring the supported release accepted.

Use an unchanged explicit Compose project name and the same bundle's Compose and environment files for every command. Mixing a candidate environment with an older Compose file can recreate the wrong services. A healthy container is only one check; it does not establish correct business state or action semantics.

## Rollback

Keep the previous compatible bundle, headers, images and private configuration. Route rollback can return to a healthy static release while preserving backend data. Backend rollback requires migration and settings compatibility, lease fencing and action reconciliation. Do not roll an older database over newer approved records or assume routing rollback reverses an action.

No destructive volume removal belongs in ordinary rollback. A restored database is first a separate recovery target. Preserve evidence of failed releases, and verify the rollback's actual files/runtime after routing it. Full host replacement and continuous recovery objectives remain distinct work; see [disaster recovery](disaster-recovery.md).

## Reference documentation

[Docker Compose production guidance](https://docs.docker.com/compose/how-tos/production/), [Compose service reference](https://docs.docker.com/reference/compose-file/services/), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Caddy configuration workflow](https://caddyserver.com/docs/running).
