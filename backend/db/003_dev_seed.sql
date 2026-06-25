-- ─────────────────────────────────────────────────────────────────────────────
-- Dev seed — sample users for UI testing
-- Assumes client id=1 exists (from group-management seed)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO users3 (
  user_code, client_id, status, status_toggle,
  first_name, last_name, email,
  gender, is_remote_working, is_manager,
  office_location, department,
  address_line1, country_code, state_code, city, county, zip_code,
  latitude, longitude,
  telephone_number, telephone_number_cc,
  alt_telephone_number, alt_telephone_number_cc,
  created_on
) VALUES
(
  'IE0004', 1, 'Active', true,
  'ashka', 'kl', 'ashikaash291@gmail.com',
  'Female', false, false,
  'Legal- 579 North Valley Parkway, Lewisville 75056', 'Actuarial',
  '55 Music Concourse Drive', 'US', 'CA', 'San Francisco', 'San Francisco County', '94118',
  37.7698646, -122.4660947,
  '3333333333', '+1',
  null, null,
  now()
),
(
  'IE0001', 1, 'Active', true,
  'Hudson Client', 'Admin', 'hudsoncllientadmin@yopmail.com',
  'Male', false, true,
  '579 North Valley Parkway, San Jose', 'Operations',
  '579 North Valley Parkway', 'US', 'CA', 'San Jose', 'Santa Clara County', '95128',
  37.3382, -121.8863,
  '3123123310', '+1',
  null, null,
  now()
),
(
  'IE0002', 1, 'Active', true,
  'Manideep Da', 'Underwriter', 'manidaunderwriter@yopmail.com',
  'Male', false, true,
  '579 North Valley Parkway, San Jose', 'Underwriting',
  '579 North Valley Parkway', 'US', 'CA', 'San Jose', 'Santa Clara County', '95128',
  37.3382, -121.8863,
  '4235424356', '+1',
  null, null,
  now()
),
(
  'IE0003', 1, 'Active', true,
  'Mani Da', 'ClaimsAdj', 'manidaclaimsadj@yopmail.com',
  'Male', false, false,
  '579 North Valley Parkway, San Jose', 'Claims',
  '579 North Valley Parkway', 'US', 'CA', 'San Jose', 'Santa Clara County', '95128',
  37.3382, -121.8863,
  '2342131312', '+1',
  null, null,
  now()
),
(
  'IE0005', 1, 'Active', true,
  'Lavan', 'ffffty', 'rmmr@gmail.com',
  'Male', false, false,
  '579 North Valley Parkway, San Jose', 'Claims',
  '55 Music Concourse Drive', 'US', 'CA', 'San Francisco', 'San Francisco County', '94118',
  37.77, -122.4668,
  '3333335444', '+1',
  null, null,
  now()
),
(
  'IE0006', 1, 'Active', true,
  'Laviii', 'fff', 'zcwaftk608@uxmil.com',
  'Female', false, false,
  '579 North Valley Parkway, San Jose', 'Finance',
  '579 North Valley Parkway', 'US', 'CA', 'San Jose', 'Santa Clara County', '95128',
  37.3382, -121.8863,
  '4444444444', '+1',
  null, null,
  now()
)
ON CONFLICT (user_code) DO NOTHING;

-- Set reports_to references
UPDATE users3 SET reports_to = (SELECT id FROM users3 WHERE user_code = 'IE0001') WHERE user_code IN ('IE0002','IE0003');
UPDATE users3 SET reports_to = (SELECT id FROM users3 WHERE user_code = 'IE0002') WHERE user_code IN ('IE0005','IE0006');
UPDATE users3 SET reports_to = (SELECT id FROM users3 WHERE user_code = 'IE0002') WHERE user_code = 'IE0004';
