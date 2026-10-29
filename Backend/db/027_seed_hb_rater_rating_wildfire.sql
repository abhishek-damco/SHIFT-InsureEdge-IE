-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- HBRater_RatingWildfire seed: per-state wildfire modification factor (K8), sourced
-- from "Hudson Bailey Homeowers SuperPerils rater (1).xlsx" → "Input lists" tab
-- (State/K8 block, columns BQ/BR). Consumed by WildfireModificationValue(StateAbb).
INSERT INTO hb_rater_rating_wildfire (state, k8, created_on)
SELECT v.state, v.k8, now()
FROM (VALUES
    ('CA',1.5),('OR',1.35),('WA',1.3),('CO',1.25),('AZ',1.15),('NM',1.15),('UT',1.1),
    ('NV',1.05),('ID',0.9),('MT',0.95),('WY',0.9),('TX',0.95),('OK',0.85),('KS',0.8),
    ('NE',0.8),('ND',0.75),('SD',0.8),('MN',0.8),('IA',0.8),('MO',0.85),('AR',0.9),
    ('LA',0.9),('MS',0.9),('AL',0.9),('GA',1),('FL',1.05),('SC',0.95),('NC',0.95),
    ('TN',0.95),('KY',0.85),('VA',0.9),('WV',0.85),('MD',0.8),('DE',0.75),('PA',0.8),
    ('NJ',0.8),('NY',0.75),('CT',0.75),('RI',0.75),('MA',0.75),('VT',0.8),('NH',0.8),
    ('ME',0.85),('AK',1.1),('HI',1)
) AS v(state, k8)
WHERE NOT EXISTS (SELECT 1 FROM hb_rater_rating_wildfire w WHERE w.state = v.state);
