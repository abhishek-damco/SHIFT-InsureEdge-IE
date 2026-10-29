-- Adds blob storage path to claim_document, mirroring policy_document.blob_path,
-- so claim attachments can be persisted to Azure Blob Storage instead of document_file bytea.
ALTER TABLE claim_document ADD COLUMN IF NOT EXISTS blob_path varchar(500);
