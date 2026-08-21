-- 038_repair_claim_coverage_master_preserve_legacy.sql
-- Repairs environments where 022_claim_coverage_master.sql was not applied.
-- Archives the legacy per-claim rows and converts them to claim_impacted_coverage
-- after installing the claim coverage/cause-of-loss master catalog.

\set ON_ERROR_STOP on

BEGIN;

-- Refuse to run against an already-upgraded or unexpected schema. This keeps
-- the repair fail-safe instead of mutating a database whose shape differs from
-- the legacy environment this migration is designed for.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'claim_coverage'
          AND column_name = 'claim_id'
    ) THEN
        RAISE EXCEPTION 'Migration 038 requires the legacy claim_coverage.claim_id column';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS claim_coverage_legacy_archive_038 (
    id            bigint PRIMARY KEY,
    claim_id      bigint,
    coverage      varchar(200),
    cause_of_loss varchar(200),
    client_id     bigint,
    archived_on   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claim_coverage_asset_legacy_archive_038 (
    id                bigint PRIMARY KEY,
    claim_coverage_id bigint,
    asset_name        varchar(200),
    archived_on       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO claim_coverage_legacy_archive_038
    (id, claim_id, coverage, cause_of_loss, client_id)
SELECT id, claim_id, coverage, cause_of_loss, client_id
FROM claim_coverage
ON CONFLICT (id) DO NOTHING;

INSERT INTO claim_coverage_asset_legacy_archive_038
    (id, claim_coverage_id, asset_name)
SELECT id, claim_coverage_id, asset_name
FROM claim_coverage_asset
ON CONFLICT (id) DO NOTHING;

-- Install the canonical catalog schema and seed data. This script contains no
-- transaction boundary, so any failure rolls back this entire repair.
\ir 022_claim_coverage_master.sql

-- Convert every archived per-claim row into the replacement transaction table.
-- A left join retains coverage rows that did not have an asset link.
INSERT INTO claim_impacted_coverage
    (claim_id, coverage_id, cause_of_loss_id, asset_type, client_id)
SELECT
    legacy.claim_id,
    coverage_master.id,
    cause_master.id,
    asset.asset_name,
    legacy.client_id
FROM claim_coverage_legacy_archive_038 legacy
LEFT JOIN claim_coverage_asset_legacy_archive_038 asset
    ON asset.claim_coverage_id = legacy.id
LEFT JOIN LATERAL (
    SELECT id
    FROM claim_coverage
    WHERE coverage = legacy.coverage
    ORDER BY id
    LIMIT 1
) coverage_master ON true
LEFT JOIN LATERAL (
    SELECT id
    FROM claim_coverage
    WHERE cause_of_loss = legacy.cause_of_loss
    ORDER BY id
    LIMIT 1
) cause_master ON true
WHERE legacy.claim_id IS NOT NULL
  AND legacy.client_id IS NOT NULL;

-- Validation failures abort and roll back both the schema/data upgrade and the
-- archive writes.
DO $$
DECLARE
    legacy_coverage_count bigint;
    legacy_asset_count bigint;
    migrated_count bigint;
    master_cause_count bigint;
BEGIN
    SELECT count(*) INTO legacy_coverage_count
    FROM claim_coverage_legacy_archive_038;

    SELECT count(*) INTO legacy_asset_count
    FROM claim_coverage_asset_legacy_archive_038;

    SELECT count(*) INTO migrated_count
    FROM claim_impacted_coverage impacted
    WHERE impacted.claim_id IN (
        SELECT claim_id
        FROM claim_coverage_legacy_archive_038
        WHERE claim_id IS NOT NULL
    );

    SELECT count(*) INTO master_cause_count
    FROM claim_coverage
    WHERE cause_of_loss IS NOT NULL
      AND cause_of_loss <> '';

    IF legacy_coverage_count = 0 THEN
        RAISE EXCEPTION 'Legacy claim coverage archive is unexpectedly empty';
    END IF;

    IF migrated_count < legacy_coverage_count THEN
        RAISE EXCEPTION
            'Only % impacted rows were migrated for % legacy coverage rows',
            migrated_count, legacy_coverage_count;
    END IF;

    IF master_cause_count = 0 THEN
        RAISE EXCEPTION 'Cause-of-loss master data was not seeded';
    END IF;

    RAISE NOTICE
        'Archived % coverage rows and % asset links; created % impacted rows; loaded % causes of loss',
        legacy_coverage_count, legacy_asset_count, migrated_count, master_cause_count;
END $$;

COMMIT;
