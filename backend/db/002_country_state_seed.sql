-- ─────────────────────────────────────────────────────────────────────────────
-- Country & State seed data
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO country (code, name, country_dial_code) VALUES
  ('US', 'United States',    '+1'),
  ('CA', 'Canada',           '+1'),
  ('IN', 'India',            '+91'),
  ('GB', 'United Kingdom',   '+44'),
  ('AU', 'Australia',        '+61')
ON CONFLICT (code) DO NOTHING;

-- United States
INSERT INTO state (country_code, code, name, abbreviation) VALUES
  ('US','AL','Alabama','AL'),('US','AK','Alaska','AK'),('US','AZ','Arizona','AZ'),
  ('US','AR','Arkansas','AR'),('US','CA','California','CA'),('US','CO','Colorado','CO'),
  ('US','CT','Connecticut','CT'),('US','DE','Delaware','DE'),('US','FL','Florida','FL'),
  ('US','GA','Georgia','GA'),('US','HI','Hawaii','HI'),('US','ID','Idaho','ID'),
  ('US','IL','Illinois','IL'),('US','IN','Indiana','IN'),('US','IA','Iowa','IA'),
  ('US','KS','Kansas','KS'),('US','KY','Kentucky','KY'),('US','LA','Louisiana','LA'),
  ('US','ME','Maine','ME'),('US','MD','Maryland','MD'),('US','MA','Massachusetts','MA'),
  ('US','MI','Michigan','MI'),('US','MN','Minnesota','MN'),('US','MS','Mississippi','MS'),
  ('US','MO','Missouri','MO'),('US','MT','Montana','MT'),('US','NE','Nebraska','NE'),
  ('US','NV','Nevada','NV'),('US','NH','New Hampshire','NH'),('US','NJ','New Jersey','NJ'),
  ('US','NM','New Mexico','NM'),('US','NY','New York','NY'),('US','NC','North Carolina','NC'),
  ('US','ND','North Dakota','ND'),('US','OH','Ohio','OH'),('US','OK','Oklahoma','OK'),
  ('US','OR','Oregon','OR'),('US','PA','Pennsylvania','PA'),('US','RI','Rhode Island','RI'),
  ('US','SC','South Carolina','SC'),('US','SD','South Dakota','SD'),('US','TN','Tennessee','TN'),
  ('US','TX','Texas','TX'),('US','UT','Utah','UT'),('US','VT','Vermont','VT'),
  ('US','VA','Virginia','VA'),('US','WA','Washington','WA'),('US','WV','West Virginia','WV'),
  ('US','WI','Wisconsin','WI'),('US','WY','Wyoming','WY'),('US','DC','District of Columbia','DC')
ON CONFLICT (country_code, code) DO NOTHING;

-- Canada
INSERT INTO state (country_code, code, name, abbreviation) VALUES
  ('CA','AB','Alberta','AB'),('CA','BC','British Columbia','BC'),('CA','MB','Manitoba','MB'),
  ('CA','NB','New Brunswick','NB'),('CA','NL','Newfoundland and Labrador','NL'),
  ('CA','NS','Nova Scotia','NS'),('CA','NT','Northwest Territories','NT'),
  ('CA','NU','Nunavut','NU'),('CA','ON','Ontario','ON'),
  ('CA','PE','Prince Edward Island','PE'),('CA','QC','Quebec','QC'),
  ('CA','SK','Saskatchewan','SK'),('CA','YT','Yukon','YT')
ON CONFLICT (country_code, code) DO NOTHING;

-- India
INSERT INTO state (country_code, code, name, abbreviation) VALUES
  ('IN','AP','Andhra Pradesh','AP'),('IN','AR','Arunachal Pradesh','AR'),
  ('IN','AS','Assam','AS'),('IN','BR','Bihar','BR'),('IN','CG','Chhattisgarh','CG'),
  ('IN','GA','Goa','GA'),('IN','GJ','Gujarat','GJ'),('IN','HR','Haryana','HR'),
  ('IN','HP','Himachal Pradesh','HP'),('IN','JH','Jharkhand','JH'),
  ('IN','KA','Karnataka','KA'),('IN','KL','Kerala','KL'),
  ('IN','MP','Madhya Pradesh','MP'),('IN','MH','Maharashtra','MH'),
  ('IN','MN','Manipur','MN'),('IN','ML','Meghalaya','ML'),('IN','MZ','Mizoram','MZ'),
  ('IN','NL','Nagaland','NL'),('IN','OD','Odisha','OD'),('IN','PB','Punjab','PB'),
  ('IN','RJ','Rajasthan','RJ'),('IN','SK','Sikkim','SK'),('IN','TN','Tamil Nadu','TN'),
  ('IN','TG','Telangana','TG'),('IN','TR','Tripura','TR'),('IN','UP','Uttar Pradesh','UP'),
  ('IN','UK','Uttarakhand','UK'),('IN','WB','West Bengal','WB'),('IN','DL','Delhi','DL')
ON CONFLICT (country_code, code) DO NOTHING;

-- United Kingdom
INSERT INTO state (country_code, code, name, abbreviation) VALUES
  ('GB','ENG','England','ENG'),('GB','SCT','Scotland','SCT'),
  ('GB','WLS','Wales','WLS'),('GB','NIR','Northern Ireland','NIR')
ON CONFLICT (country_code, code) DO NOTHING;

-- Australia
INSERT INTO state (country_code, code, name, abbreviation) VALUES
  ('AU','NSW','New South Wales','NSW'),('AU','VIC','Victoria','VIC'),
  ('AU','QLD','Queensland','QLD'),('AU','SA','South Australia','SA'),
  ('AU','WA','Western Australia','WA'),('AU','TAS','Tasmania','TAS'),
  ('AU','ACT','Australian Capital Territory','ACT'),('AU','NT','Northern Territory','NT')
ON CONFLICT (country_code, code) DO NOTHING;
