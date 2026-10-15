# Security policy

## Report a concern

Contact [muhammadzahidulislam2222@gmail.com](mailto:muhammadzahidulislam2222@gmail.com) privately with a concise description, affected version/component, impact and a safe reproduction using synthetic data. Do not post credentials, private data, tokens, exploit dumps or production infrastructure details in a public issue. Ask for an appropriate secure exchange method before sending sensitive evidence.

Do not test against the live service without explicit authorization. Do not access other people's data, persist access, exhaust resources or send external messages. A public repository is not permission for intrusive testing. No bounty, guaranteed response time or formal coordinated-disclosure SLA is offered.

## Supported boundary

The current documented release supports trusted-operator self-hosting with bounded local inference and internal draft actions. Only the current maintained revision is assessed; no formal long-term-support matrix is established. Operators must review dependency advisories, patch compatible images and rerun gates on their own installation. No unrestricted agent tool or independent hostile-tenant service is enabled.

Current controls include resource authorization, exact origin/CSRF checks, opaque hashed sessions, rate limits, lease fencing, exact approval binding, transactional receipts, scoped child environments, private networking and resource-limited containers. Their coverage and limits are described in the [threat model](docs/security-threat-model.md).

## Sensitive handling

Keep runtime environments, keys, recovery documents, backups, source evidence and private operator tooling out of Git and browser assets. Scan the actual staged content and history before publishing; ignoring a file does not remove it from existing history. Never bypass secret-scanning hooks or push protection. If material is exposed, revoke/rotate it and assess affected sessions, artifacts and backups; deleting a public file alone is insufficient.

Release scans and defined adversarial tests are evidence, not security certification. The project does not claim universal vulnerability absence, SOC 2/ISO certification, legal compliance certification or an external penetration-test result.
