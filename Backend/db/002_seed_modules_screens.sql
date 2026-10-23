-- Seed: modules and app_screen
-- Source: ModuleScreens.txt (SQL Server) — adapted to PostgreSQL schema
-- Schema: module(id, module_name, sort_order) | app_screen(id, screen_code, screen_name, module_id)
-- Run AFTER 001_initial_schema.sql, BEFORE 003_dev_seed.sql

TRUNCATE TABLE screen_permissions RESTART IDENTITY CASCADE;
TRUNCATE TABLE app_screen         RESTART IDENTITY CASCADE;
TRUNCATE TABLE module             RESTART IDENTITY CASCADE;

-- ─── Modules ──────────────────────────────────────────────────────────────────
INSERT INTO module (id, module_name, sort_order) OVERRIDING SYSTEM VALUE VALUES
  (1,  'Dashboard',                     1),
  (2,  'Client Management',             2),
  (3,  'Accounts Maintenance',          3),
  (4,  'Quotes & Policies',             4),
  (5,  'Claims',                        5),
  (6,  'User Groups Management',        6),
  (7,  'User Management',               7),
  (8,  'Insurance Product Maintenance', 8),
  (9,  'Distribution Management',       9),
  (10, 'Document Management',           10),
  (11, 'Billing Management',            11),
  (12, 'Report Management',             12);

SELECT setval('module_id_seq', 12);

-- ─── App Screens ──────────────────────────────────────────────────────────────
INSERT INTO app_screen (id, screen_code, screen_name, module_id) OVERRIDING SYSTEM VALUE VALUES
  -- Dashboard
  (1,  'DASHBOARD',              'Dashboard',                           1),
  -- Client Management
  (2,  'CLIENTMGMT_LANDING',    'Client Management',                   2),
  -- User Groups Management
  (3,  'USERGROUPPAGE',         'User Groups Management',              6),
  (4,  'USERGROUP_ADD',         'Add User Group',                      6),
  (5,  'USERGROUP_VIEW',        'View User Group',                     6),
  -- User Management
  (6,  'USERMNGTPAGE',          'User Management',                     7),
  (7,  'USERMGMT_ADDUSER',      'Add User',                            7),
  (8,  'USERMGMT_VIEWUSER',     'View User',                           7),
  -- Insurance Product Maintenance
  (9,  'INSURANCEPRODUCT',      'Insurance Product',                   8),
  -- Accounts Maintenance
  (10, 'INDIVIDUALACCOUNTS',    'Individual Accounts',                 3),
  (11, 'ACCSUMMARY',            'Account Summary',                     3),
  (12, 'BULKUPLOADPAGE',        'Bulk Upload',                         3),
  (13, 'BUSINESSACCOUNTS',      'Business Accounts',                   3),
  -- Quotes & Policies — Individual
  (14, 'NEWBUSINESSINDIVIDUAL', 'New Business Quote',                  4),
  (15, 'ENDORSEMENTINDIVIDUAL', 'Endorsement Quote',                   4),
  (16, 'RENEWALINDIVIDUAL',     'Renewal Quote',                       4),
  (17, 'POLICIESINDIVIDUAL',    'Policies',                            4),
  -- Quotes & Policies — Business
  (18, 'NEWBUSINESS',           'New Business Quote (Business)',       4),
  (19, 'ENDORSEMENTBUSINESS',   'Endorsement Quote (Business)',        4),
  (20, 'RENEWALBUSINESS',       'Renewal Quote (Business)',            4),
  (21, 'POLICIESBUSINESS',      'Policies (Business)',                 4),
  -- Distribution Management
  (22, 'DISTRIBUTIONLANDINGPAGE','Distribution Management',            9),
  (23, 'DIST_ADDINTERMEDIARY',  'Add Intermediary',                    9),
  (24, 'DIST_VIEWINTERMEDIARY', 'View Intermediary',                   9),
  -- Document Management
  (25, 'POLICYCOMMON',          'Policy Common',                       10),
  (26, 'CLAIMSCOMMON',          'Claims Common',                       10),
  (27, 'BILLINGCOMMON',         'Billing Common',                      10),
  -- Claims — Inquiry & Registration
  (28, 'CLAIMENQUIRYSCREEN',    'Claims Inquiry',                      5),
  (29, 'FNOLREGSCREEN',         'FNOL Registration',                   5),
  (30, 'BULKCLAIMUPLOADSCREEN', 'Bulk Claim Upload',                   5),
  -- Claims — Workflow
  (31, 'CLAIMDASH',             'Claims Dashboard',                    5),
  (32, 'CLAIMSUMMARY',          'Claims Summary',                      5),
  (33, 'LOSSINFO',              'Loss Information',                    5),
  (34, 'CLAIMREVIEW',           'Claims Review',                       5),
  (35, 'CLAIMDOCUMENT',         'Documents',                           5),
  (36, 'FINANCIALWORKSHEET',    'Financials - Worksheet',              5),
  (37, 'FINANCIALPAYEE',        'Financials - Claims Payee',           5),
  (38, 'INSUREDPOLICY',         'Insured & Policy',                    5),
  (39, 'CLAIMESCALATION',       'Claims Escalation',                   5),
  (40, 'RECOVERY',              'Recovery',                            5),
  (41, 'CLAIMREFERRED',         'Claim Referred',                      5),
  (42, 'UNDERLITIGATION',       'Under Litigation',                    5),
  (43, 'TASK',                  'Task',                                5),
  (44, 'TIMELINE',              'Timeline',                            5),
  (45, 'CLAIMLETTER',           'Claim Letters',                       5),
  -- Claims — Configuration
  (46, 'CLAIMAUTHORITYSCREEN',  'Claims Authority',                    5),
  (47, 'ADJUSTERMNGT',          'Adjuster Management',                 5),
  (48, 'CATASTROPHICSCREEN',    'Catastrophic Events',                 5),
  (49, 'CLAIMMASTERCONFIG',     'Claims Master Configuration',         5),
  (50, 'PAYEELIST',             'Payee List',                          5),
  (51, 'LETTERSCREEN',          'Claim Letter Template',               5),
  -- Billing Management
  (52, 'POLICYPAYMENTS',        'Policy Payments',                     11),
  -- Report Management
  (53, 'MGATOISSUERREPORT',     'MGA to Issuer',                       12),
  (54, 'CLAIMMANAGEMENTREPORT', 'Claims Management Reports',           12),
  (55, 'CLAIMFINANCIALREPORT',  'Claim Financial Reports',             12),
  (56, 'LOSSEXPOSUREREPORT',    'Loss & Exposure Reports',             12),
  (57, 'COMPLIANCEREPORT',      'Compliance / Regulatory Reports',     12),
  (58, 'CATASTROPHEREPORT',     'Reinsurance / Catastrophe Reports',   12),
  (59, 'POLICYISSUANCE',        'New Business Issuance',               12),
  (60, 'NEWBUSINESSPREMIUM',    'New Business Premium',                12),
  (61, 'TRANSACTIONTYPEREPORT', 'No. of Policies by Transaction Type', 12),
  (62, 'COMMISIONS',            'Commissions Reports',                 12);

SELECT setval('app_screen_id_seq', 62);
