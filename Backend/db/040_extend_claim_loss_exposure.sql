-- Original-application loss exposure fields and damage detail payload.
ALTER TABLE claim_loss_exposure
    ADD COLUMN IF NOT EXISTS loss_party VARCHAR(30),
    ADD COLUMN IF NOT EXISTS claimant_reference VARCHAR(80),
    ADD COLUMN IF NOT EXISTS loss_exposure_type_id BIGINT,
    ADD COLUMN IF NOT EXISTS coverage_limit VARCHAR(100),
    ADD COLUMN IF NOT EXISTS severity VARCHAR(40),
    ADD COLUMN IF NOT EXISTS cause_of_loss_id BIGINT,
    ADD COLUMN IF NOT EXISTS cause_of_loss VARCHAR(250),
    ADD COLUMN IF NOT EXISTS percentage_allocation NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS property_usable BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS contractors_involved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mold_suspected BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS additional_living_expense_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS content_damage BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sprinkler_alarm_installed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lienholder_involved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS attorney_involved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS description_of_loss TEXT,
    ADD COLUMN IF NOT EXISTS damage_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS additional_services_required BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE claim_loss_exposure
SET loss_party = COALESCE(loss_party, claimant_type),
    severity = COALESCE(severity, loss_consequences),
    cause_of_loss = COALESCE(cause_of_loss, loss_consequences),
    description_of_loss = COALESCE(description_of_loss, notes)
WHERE loss_party IS NULL OR severity IS NULL OR cause_of_loss IS NULL;
