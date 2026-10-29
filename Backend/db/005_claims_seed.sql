-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Claims reference data seed + dev sample claims
-- Run AFTER 004_claims_schema.sql
-- Source: PRD ClaimsEnquiry.md Section 6 (verified enumerations)

-- ─── Claim Initiation Channels ────────────────────────────────────────────────
INSERT INTO claim_initiation_channel (name) VALUES
  ('Phone'),
  ('Email'),
  ('Mobile App')
ON CONFLICT (name) DO NOTHING;

-- ─── Cause of Loss (~68 values from PRD Section 6) ───────────────────────────
INSERT INTO cause_of_loss (name) VALUES
  ('Fire'),
  ('Flood'),
  ('Windstorm'),
  ('Theft'),
  ('Earthquake'),
  ('Hail'),
  ('Lightning'),
  ('Vandalism'),
  ('Water Damage'),
  ('Sinkhole'),
  ('Collapse'),
  ('Ice / Snow / Sleet'),
  ('Explosion'),
  ('Smoke'),
  ('Aircraft / Vehicle Impact'),
  ('Falling Objects'),
  ('Weight of Ice and Snow'),
  ('Freezing Pipes'),
  ('Sudden and Accidental Discharge'),
  ('Overflow of Water or Steam'),
  ('Mold'),
  ('Termites / Insects'),
  ('Rot / Deterioration'),
  ('Animal Damage'),
  ('Power Surge'),
  ('Mechanical Breakdown'),
  ('Employee Dishonesty'),
  ('Forgery / Alteration'),
  ('Counterfeit Currency'),
  ('Computer Fraud'),
  ('Bodily Injury'),
  ('Property Damage - Liability'),
  ('Personal Injury'),
  ('Advertising Injury'),
  ('Medical Payments'),
  ('Product Liability'),
  ('Completed Operations'),
  ('Professional Liability'),
  ('Directors and Officers'),
  ('Employment Practices'),
  ('Cyber Attack / Data Breach'),
  ('Equipment Breakdown'),
  ('Inland Marine'),
  ('Builder Risk'),
  ('Installation Floater'),
  ('Contractors Equipment'),
  ('Riot / Civil Commotion'),
  ('Terrorism'),
  ('War / Military Action'),
  ('Nuclear Hazard'),
  ('Governmental Action'),
  ('Utility Failure'),
  ('Pollution'),
  ('Asbestos / Lead'),
  ('Fungi / Bacteria'),
  ('Mysterious Disappearance'),
  ('Breakage of Glass'),
  ('Sprinkler Leakage'),
  ('Debris Removal'),
  ('Ordinance or Law'),
  ('Inflation Guard'),
  ('Rental Value'),
  ('Business Income'),
  ('Extra Expense'),
  ('Contingent Business Income'),
  ('Leasehold Interest'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ─── Consequences of Loss (from PRD Section 6) ───────────────────────────────
INSERT INTO consequence_of_loss (name) VALUES
  ('Dwelling damage'),
  ('Other Structures Damage'),
  ('Property damage'),
  ('Personal Property Loss'),
  ('Loss of Use'),
  ('Additional Living Expenses'),
  ('Debris Removal'),
  ('Loss Settlement'),
  ('Increased Costs of Construction'),
  ('Loss of Rents'),
  ('Bodily Injury Damages'),
  ('Legal Defense Costs'),
  ('Medical Payments to Others'),
  ('Pain and Suffering'),
  ('General Damages'),
  ('Reputational'),
  ('Total loss'),
  ('Settlements or Judgments')
ON CONFLICT (name) DO NOTHING;

-- ─── Coverage Types (LOB-dependent; from PRD BR-CLM-001) ─────────────────────
INSERT INTO coverage_type (name) VALUES
  ('Dwelling Asset'),
  ('Appurtenant structure'),
  ('Personal assets (other than fixed assets)'),
  ('Dwelling occupancy disruption')
ON CONFLICT DO NOTHING;

-- ─── Impacted Assets (from PRD Section 6 multi-select) ───────────────────────
INSERT INTO impacted_asset (name) VALUES
  ('Fixed assets'),
  ('Newly constructed/remodeled'),
  ('Aircraft asset'),
  ('Animal asset'),
  ('Automobile asset'),
  ('Boat asset'),
  ('Business personal property'),
  ('Camera/Photographic equipment'),
  ('Clothing and personal effects'),
  ('Computer equipment'),
  ('Electronic equipment'),
  ('Fine arts'),
  ('Firearms'),
  ('Furniture and fixtures'),
  ('Jewelry and watches'),
  ('Machinery and equipment'),
  ('Money and securities'),
  ('Musical instruments'),
  ('Other structures'),
  ('Personal liability'),
  ('Portable electronics'),
  ('Silverware and goldware'),
  ('Sports equipment'),
  ('Tools and equipment'),
  ('Valuable papers and records')
ON CONFLICT (name) DO NOTHING;

-- ─── Dev Sample Policy ────────────────────────────────────────────────────────
INSERT INTO policy (id, policy_number, insured_name, address, effective_date, lob, sub_product, status, client_id)
VALUES
  (1, 'HB-2024-00001', 'John & Mary Smith', '4521 Oak Avenue, Austin, TX 78701', '2024-01-15', 'E&S Homeowners', 'HO - Physical Damage', 'Active', 1),
  (2, 'HB-2024-00002', 'Greenleaf LLC',     '890 Commerce Blvd, Dallas, TX 75201', '2024-03-01', 'E&S Commercial', 'HO - Personal Liability', 'Active', 1),
  (3, 'HB-2024-00003', 'Patricia Williams', '221 Maple Street, Houston, TX 77001', '2023-11-01', 'E&S Homeowners', 'HO - Physical Damage', 'Active', 1)
ON CONFLICT (policy_number, client_id) DO NOTHING;

SELECT setval('policy_id_seq', 3);

-- Insured records for sample policies
INSERT INTO insured (policy_id, first_name, last_name, address_line1, city, state, zip_code, telephone, email, client_id)
VALUES
  (1, 'John',      'Smith',    '4521 Oak Avenue',    'Austin',   'TX', '78701', '512-555-0101', 'john.smith@email.com',    1),
  (2, 'Greenleaf', 'LLC',      '890 Commerce Blvd',  'Dallas',   'TX', '75201', '214-555-0202', 'contact@greenleaf.com',   1),
  (3, 'Patricia',  'Williams', '221 Maple Street',   'Houston',  'TX', '77001', '713-555-0303', 'pat.williams@email.com',  1)
ON CONFLICT DO NOTHING;

-- Risk locations
INSERT INTO risk_location (policy_id, property_location, occupancy_type, construction_type, client_id)
VALUES
  (1, '4521 Oak Avenue, Austin, TX 78701',    'Owner Occupied', 'Frame',    1),
  (2, '890 Commerce Blvd, Dallas, TX 75201',  'Commercial',     'Masonry',  1),
  (3, '221 Maple Street, Houston, TX 77001',  'Owner Occupied', 'Frame',    1)
ON CONFLICT DO NOTHING;

-- ─── Dev Sample Claims ────────────────────────────────────────────────────────
-- 3 non-DRAFT claims for the enquiry grid + 1 DRAFT for policy modal demo
INSERT INTO claim (
    id, claim_number, policy_id, client_id, status, last_step_number,
    is_claim_reported_by_insured,
    reporter_first_name, reporter_last_name, reporter_relationship,
    reporter_telephone, reporter_email,
    date_of_loss, time_of_loss,
    claim_initiation_channel, claim_type,
    main_cause_of_loss, consequences_of_loss,
    inspection_required, claim_reimbursement_type,
    loss_description, physical_damage, claim_only_third_party,
    loss_address_line1, loss_city, loss_state, loss_zip_code,
    claim_estimate,
    assigned_to, created_by, created_on
) VALUES
  (1, 'CLM-2024-00001', 1, 1, 'OPEN',   4, true,
   'John', 'Smith', 'Self', '512-555-0101', 'john.smith@email.com',
   '2024-02-10', '14:30:00',
   'Phone', 'HO - Physical Damage',
   'Fire', 'Dwelling damage',
   true, 'Replacement Cost Value (RCV)',
   'Fire started in kitchen, spread to living room. Significant structural damage.', true, false,
   '4521 Oak Avenue', 'Austin', 'TX', '78701',
   '85000',
   1, 1, '2024-02-10 15:00:00+00'),

  (2, 'CLM-2024-00002', 1, 1, 'OPEN',   4, true,
   'John', 'Smith', 'Self', '512-555-0101', 'john.smith@email.com',
   '2024-05-22', '08:00:00',
   'Email', 'HO - Physical Damage',
   'Windstorm', 'Other Structures Damage',
   false, 'Actual Cash Value (ACV)',
   'Hailstorm caused significant roof damage and broken windows throughout.', true, false,
   '4521 Oak Avenue', 'Austin', 'TX', '78701',
   '12500',
   1, 1, '2024-05-22 09:30:00+00'),

  (3, 'CLM-2024-00003', 3, 1, 'CLOSED', 4, false,
   'Patricia', 'Williams', 'Self', '713-555-0303', 'pat.williams@email.com',
   '2024-01-05', '22:00:00',
   'Mobile App', 'HO - Physical Damage',
   'Theft', 'Personal Property Loss',
   false, 'Replacement Cost Value (RCV)',
   'Residential burglary, laptop, jewelry, and cash stolen.', false, false,
   '221 Maple Street', 'Houston', 'TX', '77001',
   '8200',
   1, 1, '2024-01-06 10:00:00+00'),

  -- DRAFT claim (excluded from enquiry grid; shown in policy FNOL modal)
  (4, NULL, 2, 1, 'DRAFT', 2, false,
   NULL, NULL, NULL, NULL, NULL,
   NULL, NULL,
   NULL, NULL,
   NULL, NULL,
   false, NULL,
   NULL, NULL, NULL,
   NULL, NULL, NULL, NULL,
   NULL,
   NULL, 1, '2024-06-01 08:00:00+00')
ON CONFLICT DO NOTHING;

SELECT setval('claim_id_seq', 4);

-- Coverage rows for claim 1
INSERT INTO claim_coverage (claim_id, coverage, cause_of_loss, client_id) VALUES
  (1, 'Dwelling Asset', 'Fire', 1)
ON CONFLICT DO NOTHING;

INSERT INTO claim_coverage_asset (claim_coverage_id, asset_name) VALUES
  (1, 'Fixed assets'),
  (1, 'Furniture and fixtures')
ON CONFLICT DO NOTHING;

-- Coverage rows for claim 2
INSERT INTO claim_coverage (claim_id, coverage, cause_of_loss, client_id) VALUES
  (2, 'Appurtenant structure', 'Windstorm', 1)
ON CONFLICT DO NOTHING;

INSERT INTO claim_coverage_asset (claim_coverage_id, asset_name) VALUES
  (2, 'Other structures')
ON CONFLICT DO NOTHING;

-- Claimant for claim 2 (third-party demo — using claim 2 even though flag is false in seed; demo purposes)
-- In a real scenario, is_third_party_damage would be true
INSERT INTO claimant (claim_id, client_id, party_type, first_name, last_name, relationship_with_insured, telephone, email)
VALUES (2, 1, 'Individual', 'Robert', 'Jones', 'No Prior Relationship', '512-555-0999', 'robert.jones@email.com')
ON CONFLICT DO NOTHING;
