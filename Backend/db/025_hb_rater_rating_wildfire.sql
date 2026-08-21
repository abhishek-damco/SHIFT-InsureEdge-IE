-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- IERatingEngine: HBRater_RatingWildfire — per-state wildfire modification factor (K8),
-- read by WildfireModificationValue(StateAbb). No bootstrap-from-Excel action exists for
-- this entity in the original module; rows are maintained via its CRUD actions
-- (CreateOrUpdateHBRater_RatingWildfire etc.) — seed data must be provided separately.
CREATE TABLE IF NOT EXISTS hb_rater_rating_wildfire (
    id         BIGSERIAL PRIMARY KEY,
    state      VARCHAR(50),
    k8         NUMERIC(37,8),
    created_by BIGINT REFERENCES "user"(id),
    created_on TIMESTAMPTZ,
    updated_by BIGINT REFERENCES "user"(id),
    updated_on TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hbrater_ratingwildfire_state ON hb_rater_rating_wildfire(state);
