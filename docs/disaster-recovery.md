# Backup and disaster recovery

## Verified recovery boundary

The current release completed an encrypted off-host production PostgreSQL backup and restored it into a fresh isolated database on the source host. Source schema and business state remained unchanged. The restored schema and canonical contents of 11 business tables matched the same snapshot. This establishes artifact readability and database restore consistency; it does not establish recovery after loss of the host, storage, administrative access or model volume.

The full dump includes authentication records. Only fingerprint comparisons exclude volatile sessions, login attempts and worker heartbeats. These are not omissions from the backup. Treat encrypted artifacts, restore databases and recovery keys as sensitive; encryption does not remove their privacy obligations.

## Snapshot and encryption design

A repeatable-read read-only transaction exports one PostgreSQL snapshot. `pg_dump` consumes that snapshot while schema and business-row fingerprints are computed consistently. A custom archive and its metadata are placed in an authenticated Fernet envelope, then written off-host. No plaintext dump file is produced by the verified helper. Chunk/queue/size/deadline limits prevent unbounded transport accumulation.

Restore authenticates and decrypts the envelope, validates its bounds/format, creates a fresh uniquely owned database, restores into that destination and compares schema plus business rows. Tampering is rejected. The workflow does not overwrite the source database or delete original state. Tested restore databases remain retained for operator-controlled disposition; no automatic destructive cleanup is implied.

See [PostgreSQL pg_dump snapshot support](https://www.postgresql.org/docs/current/app-pgdump.html) and [Fernet authenticated encryption](https://cryptography.io/en/latest/fernet/). The implemented small bounded backup holds plaintext in process memory; it is not a streaming multi-terabyte design. Larger datasets require a separately assessed bounded streaming encryption/archive strategy and resource measurements.

## Operator recovery procedure

1. Confirm the authorized source, exact Compose project/service and immutable configuration. Verify actual recovery key availability before exporting sensitive data. Use pinned authenticated transport; do not place passwords in arguments or logs.
2. Export one consistent snapshot, encrypt before off-host persistence, and record artifact size/hash plus source/restore parity metadata privately. Keep recovery keys separately accessible from the encrypted artifact, with documented ownership and access controls.
3. Test decryption and restore into a new isolated destination. Compare schema and relevant business fingerprints, including expected receipts/commitments/episodes. Validate source state is untouched. A successful backup command without restore evidence is insufficient.
4. Before promoting a restored service, reconcile tasks, approvals and receipts. Invalidate recovered sessions and rotate credentials where required. Preserve deletion obligations so recovery does not silently reintroduce previously erased data.
5. Rebuild compatible application/configuration/model artifacts, verify actual identities, run health/security/business checks, then route traffic deliberately. Preserve the source and restore evidence until the recovery is accepted.

## Remaining work and objectives

Scheduled backups, enforced retention, independent notification, geographic/storage independence, WAL archiving/PITR and replacement-host drills remain further work. The tested off-host encrypted database artifact is not a complete image of the application host. Database roles/global objects, model weights, TLS configuration, source/image manifests and credential recovery must be included in a complete recovery inventory.

No measured host-failure RPO/RTO is claimed. The roadmap proposes RPO at most 24 hours and RTO at most four hours for a declared dataset; these become supported objectives only after a timed end-to-end drill including credentials, configuration, data, routing and reconciliation. Choose objectives from business requirements and verify affordable capacity rather than treating an aspiration as a guarantee.
