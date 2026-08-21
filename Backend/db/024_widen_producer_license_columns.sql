-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Producer creation 500'd with "value too long for type character varying(10)":
-- pl_license/cl_license/plcl_combined_license (db/010_quotes_policies_schema.sql) were
-- sized for a short code, but these hold real state-issued license numbers, which
-- routinely exceed 10 characters. Widen to varchar(50) to match residential_state/country.
-- Run AFTER 023_test_group_view_permissions.sql

ALTER TABLE producer
    ALTER COLUMN pl_license             TYPE varchar(50),
    ALTER COLUMN cl_license             TYPE varchar(50),
    ALTER COLUMN plcl_combined_license  TYPE varchar(50);
