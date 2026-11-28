# Safe data migration

The command defaults to a read-only dry run. It never drops or truncates a MySQL or PostgreSQL table. UUIDs are deterministic UUIDv5 values derived from the fixed namespace in `migrate.js` and the pair `entity-type:legacy-id`.

1. Create and checksum a MySQL dump and an upload archive.
2. Start the isolated PostgreSQL microservices project and apply its versioned migrations.
3. Export `MYSQL_*` plus `IDENTITY_DATABASE_URL`, `USER_DATABASE_URL`, `COMPANY_DATABASE_URL`, `JOB_DATABASE_URL`, `RESUME_DATABASE_URL`, `APPLICATION_DATABASE_URL`, and `NOTIFICATION_DATABASE_URL`.
4. Run `npm install && npm run dry-run` and review duplicate reports.
5. Run `npm run apply`, then `npm run verify`.

Legacy base64 document bytes are decoded into `bytea`; legacy paths are retained in JSONB metadata. This makes the migration resumable before a separate, checksum-verified object-store import. The old MySQL database and volume are never modified by this script.
