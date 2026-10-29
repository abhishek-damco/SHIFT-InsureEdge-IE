-- QA User Management UM-12 (§2 rule): Country offers United States and Canada.
-- Canada → State becomes Province, County hidden, Zip Code becomes Postal Code.
-- Idempotent — safe to re-run.

INSERT INTO country (code, name, country_dial_code)
VALUES ('CA', 'Canada', '+1')
ON CONFLICT (code) DO NOTHING;

INSERT INTO state (country_code, code, name, abbreviation)
SELECT 'CA', v.code, v.name, v.code
FROM (VALUES
  ('AB', 'Alberta'),
  ('BC', 'British Columbia'),
  ('MB', 'Manitoba'),
  ('NB', 'New Brunswick'),
  ('NL', 'Newfoundland and Labrador'),
  ('NS', 'Nova Scotia'),
  ('NT', 'Northwest Territories'),
  ('NU', 'Nunavut'),
  ('ON', 'Ontario'),
  ('PE', 'Prince Edward Island'),
  ('QC', 'Quebec'),
  ('SK', 'Saskatchewan'),
  ('YT', 'Yukon')
) AS v(code, name)
WHERE NOT EXISTS (SELECT 1 FROM state s WHERE s.country_code = 'CA' AND s.code = v.code);
