-- Dev helper after squashing numbered migrations into schema.sql.
-- Run once against an existing DB whose schema is already at head:
--
--   psql "$DATABASE_URL" -f apps/api/scripts/reset-migration-history.sql
--
-- This only resets bookkeeping in _schema_migrations; it does not change tables.

TRUNCATE _schema_migrations;

INSERT INTO _schema_migrations (version)
VALUES ('baseline')
ON CONFLICT (version) DO NOTHING;
