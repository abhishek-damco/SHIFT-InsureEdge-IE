-- AI_GENERATED | HUMAN_VALIDATION_REQUIRED
-- Document Generation PRD §9.2: product_document is the per-tenant Plumsail template
-- mapping table — (client_id, name) → PlumSailProcessId/PlumsailUserId.
CREATE TABLE IF NOT EXISTS product_document (
    id                  BIGSERIAL PRIMARY KEY,
    client_id           BIGINT NOT NULL REFERENCES client(id),
    name                VARCHAR(200) NOT NULL,
    plumsail_process_id VARCHAR(200),
    plumsail_user_id    VARCHAR(200),
    client_mapping_id   VARCHAR(50),
    created_by          BIGINT REFERENCES "user"(id),
    created_on          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          BIGINT REFERENCES "user"(id),
    updated_on          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_productdocument_client_name ON product_document(client_id, name);

-- Dev seed: the two documents of the Quote Proposal Package (PRD §5.4).
-- PlumSail process/user IDs are environment-specific — replace with the real
-- Plumsail account values before use.
INSERT INTO product_document (client_id, name, plumsail_process_id, plumsail_user_id, created_by)
SELECT 1, d.name, 'REPLACE_WITH_PLUMSAIL_PROCESS_ID', 'REPLACE_WITH_PLUMSAIL_USER_ID', 1
FROM (VALUES ('QuoteProposalDeclarationPage'), ('UnderwriterSpecificChangeEndorsement')) AS d(name)
WHERE NOT EXISTS (SELECT 1 FROM product_document p WHERE p.client_id = 1 AND p.name = d.name);
