-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- IERatingEngine: HBRater_HRHexzone — high-risk hex-zone catastrophe rates
-- (Hurricane per 1000 / Tornado / Hail by H3 hex-zone id). Populated by
-- BootstrapHRHexzones from HRHexzones.xlsx (sheet "Sheet1", ~30,941 rows).
-- NOTE: the entity intentionally has NO wildfire column — the Excel's Wildfire
-- rate is not persisted here (see HBRater_RatingWildfire in the original app).
CREATE TABLE IF NOT EXISTS hb_rater_hr_hexzone (
    id                     BIGSERIAL PRIMARY KEY,
    hr_hexzones            VARCHAR(50),
    hurricanerateper1000   NUMERIC(37,8),
    tornado                NUMERIC(37,8),
    hail                   NUMERIC(37,8),
    created_by             BIGINT REFERENCES "user"(id),
    created_on             TIMESTAMPTZ,
    updated_by             BIGINT REFERENCES "user"(id),
    updated_on             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hbrater_hrhexzone_zone ON hb_rater_hr_hexzone(hr_hexzones);
