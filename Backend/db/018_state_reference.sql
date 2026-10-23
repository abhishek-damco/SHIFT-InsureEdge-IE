-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- US state reference table (OutSystems "State" entity: Name/Abbreviation/CountryCode).
-- Consumed by BootstrapStateTaxSheet (GetCountryStates: CountryCode = 'US') and the
-- GetStatesByRiskAddressStateName lookups. Recreated as a migration after the 09-07-2026
-- cluster re-initialisation (previously existed only ad-hoc).
CREATE TABLE IF NOT EXISTS state (
    id           BIGSERIAL PRIMARY KEY,
    country_code VARCHAR(10),
    code         VARCHAR(10),
    name         VARCHAR(50),
    abbreviation VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_state_country ON state(country_code);

INSERT INTO state (country_code, code, name, abbreviation)
SELECT 'US', v.abbr, v.name, v.abbr
FROM (VALUES
    ('Alabama','AL'),('Alaska','AK'),('Arizona','AZ'),('Arkansas','AR'),('California','CA'),
    ('Colorado','CO'),('Connecticut','CT'),('Delaware','DE'),('District of Columbia','DC'),
    ('Florida','FL'),('Georgia','GA'),('Hawaii','HI'),('Idaho','ID'),('Illinois','IL'),
    ('Indiana','IN'),('Iowa','IA'),('Kansas','KS'),('Kentucky','KY'),('Louisiana','LA'),
    ('Maine','ME'),('Maryland','MD'),('Massachusetts','MA'),('Michigan','MI'),('Minnesota','MN'),
    ('Mississippi','MS'),('Missouri','MO'),('Montana','MT'),('Nebraska','NE'),('Nevada','NV'),
    ('New Hampshire','NH'),('New Jersey','NJ'),('New Mexico','NM'),('New York','NY'),
    ('North Carolina','NC'),('North Dakota','ND'),('Ohio','OH'),('Oklahoma','OK'),('Oregon','OR'),
    ('Pennsylvania','PA'),('Rhode Island','RI'),('South Carolina','SC'),('South Dakota','SD'),
    ('Tennessee','TN'),('Texas','TX'),('Utah','UT'),('Vermont','VT'),('Virginia','VA'),
    ('Washington','WA'),('West Virginia','WV'),('Wisconsin','WI'),('Wyoming','WY')
) AS v(name, abbr)
WHERE NOT EXISTS (SELECT 1 FROM state s WHERE s.country_code = 'US' AND s.name = v.name);
