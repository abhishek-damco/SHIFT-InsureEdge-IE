-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- IERatingEngine: HBRater_LRHexzones — low-risk hex-zone rates by H3 zone + state
-- (Derecho per 1000, X-wind combined/all other perils, Earthquake, Sinkhole,
-- Liability, Flash flood). Populated once by BootstrapLRHexzones from
-- LRHexzones.xlsx (sheet "Sheet1", ~4,593 rows).
CREATE TABLE IF NOT EXISTS hb_rater_lr_hexzones (
    id                            BIGSERIAL PRIMARY KEY,
    lr_hexzones                   VARCHAR(50),
    state_abb                     VARCHAR(50),
    derechorateper1000            NUMERIC(37,8),
    xwind_combinedrate_allotherpe NUMERIC(37,8),
    earthquakerate                NUMERIC(37,8),
    sinkholerate                  NUMERIC(37,8),
    liabilityrates                NUMERIC(37,8),
    flashfloodrates               NUMERIC(37,8),
    created_by                    BIGINT REFERENCES "user"(id),
    created_on                    TIMESTAMPTZ,
    updated_by                    BIGINT REFERENCES "user"(id),
    updated_on                    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hbrater_lrhexzones_zone ON hb_rater_lr_hexzones(lr_hexzones);
CREATE INDEX IF NOT EXISTS idx_hbrater_lrhexzones_state ON hb_rater_lr_hexzones(state_abb);
