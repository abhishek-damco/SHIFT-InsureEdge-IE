-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Reinstates the "_ex" columns on policy_limit_coverage that db/010 originally collapsed
-- into single canonical columns (assuming they were just hardcoded UI defaults). The
-- LenderDock integration's WDEDUCTIBLE formula — If(PhysicalDamageDeductible = 0,
-- PhysicalDamageDeductible_EX, PhysicalDamageDeductible) — proved that assumption wrong:
-- these hold the original rating-engine/Excel-computed value, distinct from whatever the
-- user later edits into the plain column on the "Plans Overview" step.
--
-- All additive (ADD COLUMN IF NOT EXISTS) — existing rows get NULL _ex values (there's no
-- historical "first computed" snapshot to backfill from); going forward the app captures
-- each pair's _ex value once, at row-creation time, per SubmissionRepository's coverage
-- save logic.

ALTER TABLE policy_limit_coverage
    ADD COLUMN IF NOT EXISTS physical_damage_deductible_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS coverage_level_ex varchar(50),
    ADD COLUMN IF NOT EXISTS liability_coverage_ex varchar(50),
    ADD COLUMN IF NOT EXISTS excess_blanket_pl_ex varchar(50),
    ADD COLUMN IF NOT EXISTS covered_liability_sir_ex varchar(50),
    ADD COLUMN IF NOT EXISTS sinkhole_catastrophic_ground_collapse_ex varchar(50),
    ADD COLUMN IF NOT EXISTS earthquake_ex varchar(50),
    ADD COLUMN IF NOT EXISTS flood_ex varchar(50),
    ADD COLUMN IF NOT EXISTS wind_hail_ex varchar(50),
    ADD COLUMN IF NOT EXISTS wild_fire_ex varchar(50),
    ADD COLUMN IF NOT EXISTS resident_worker_nfm_ex varchar(50),
    ADD COLUMN IF NOT EXISTS small_scale_farming_endorsement_ex varchar(50),
    ADD COLUMN IF NOT EXISTS landlord_endorsement_ex varchar(50),
    ADD COLUMN IF NOT EXISTS home_office_endorsement_ex varchar(50),
    ADD COLUMN IF NOT EXISTS prior_policy_period_premium_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS rate_modification_ex numeric(18,3),
    ADD COLUMN IF NOT EXISTS excess_blanket_pl_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS sinkhole_catastrophic_ground_collapse_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS earthquake_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS flood_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS wind_hail_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS wild_fire_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS resident_worker_nfm_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS small_scale_farming_endorsement_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS landlord_endorsement_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS home_office_endorsement_value_ex numeric(18,2),
    ADD COLUMN IF NOT EXISTS base_premium_ex numeric(18,2);
