-- Persist loss exposures created from the Claim Workflow / Loss Exposure tab.
CREATE TABLE IF NOT EXISTS claim_loss_exposure (
    id                 BIGSERIAL PRIMARY KEY,
    claim_id           BIGINT NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    client_id          BIGINT NOT NULL REFERENCES client(id),
    claimant_name      VARCHAR(200) NOT NULL,
    claimant_type      VARCHAR(80) NOT NULL,
    loss_type          VARCHAR(150) NOT NULL,
    loss_consequences  VARCHAR(250) NOT NULL,
    loss_estimate      NUMERIC(18,2) NOT NULL CHECK (loss_estimate >= 0),
    currency           VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes              TEXT NULL,
    created_by         BIGINT NULL,
    created_on         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by         BIGINT NULL,
    updated_on         TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_claim_loss_exposure_claim_client
    ON claim_loss_exposure (claim_id, client_id);
