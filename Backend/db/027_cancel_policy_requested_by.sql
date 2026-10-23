-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Static "Requested By" lookup for Cancel Policy, ported verbatim from the OutSystems
-- PolicyConfigurationsRequestedBy static entity.
CREATE TABLE IF NOT EXISTS policy_configurations_requested_by (
    code             varchar(20)  PRIMARY KEY,
    label            varchar(50)  NOT NULL,
    sort_order       integer      NOT NULL,
    is_active        boolean      NOT NULL DEFAULT true,
    type_of_company  varchar(30)  NOT NULL
);

INSERT INTO policy_configurations_requested_by (code, label, sort_order, is_active, type_of_company) VALUES
    ('AGENT',    'Agent',    1, true, 'INSURANCECARRIER'),
    ('BROKER',   'Broker',   2, true, 'MGA'),
    ('INSURER',  'Insurer',  3, true, 'INSURANCECARRIER'),
    ('MGA',      'MGA',      4, true, 'MGA'),
    ('INSURED',  'Insured',  5, true, 'BOTH')
ON CONFLICT (code) DO NOTHING;
