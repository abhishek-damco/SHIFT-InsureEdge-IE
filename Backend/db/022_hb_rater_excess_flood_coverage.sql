-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- IERatingEngine OutDoc §3.3: HBRater_ExcessFloodCoverage — excess flood coverage
-- P-values by type / building / flood zone / base flood elevation. Populated by
-- BootstrapExcessFloodCoverages from "New XLSX Worksheet (2).xlsx" (sheet
-- "ExcessFloodCoverage") when the table is empty.
CREATE TABLE IF NOT EXISTS hb_rater_excess_flood_coverage (
    id                   BIGSERIAL PRIMARY KEY,
    type                 VARCHAR(50),
    type_of_building     VARCHAR(50),
    building_description VARCHAR(100),
    base_flood_elevation INTEGER,
    flood_zone           VARCHAR(50),
    p_value              NUMERIC(37,8),
    created_by           BIGINT REFERENCES "user"(id),
    created_on           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by           BIGINT REFERENCES "user"(id),
    updated_on           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hbrater_excessflood_zone ON hb_rater_excess_flood_coverage(flood_zone, type);
