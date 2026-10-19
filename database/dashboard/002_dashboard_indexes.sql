-- Dashboard read-path indexes. PostgreSQL 12+; non-destructive and idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS ix_dashboard_preference_client_id_user_id
    ON dashboard_preference (client_id, user_id);

CREATE INDEX IF NOT EXISTS ix_dashboard_preference_user_id
    ON dashboard_preference (user_id);

CREATE INDEX IF NOT EXISTS ix_policy_dashboard_client_producer
    ON policy (client_id, producer_id, policy_type, policy_status, expiry_date);

CREATE INDEX IF NOT EXISTS ix_policy_dashboard_client_intermediary
    ON policy (client_id, intermediary_id, policy_type, policy_status, expiry_date);

CREATE INDEX IF NOT EXISTS ix_policy_payment_dashboard_due
    ON policy_payment_transaction (client_id, is_paid, due_date, transaction_status);

CREATE INDEX IF NOT EXISTS ix_audits_dashboard_activity
    ON audits (client_id, created_by, module, activity_type, created_date_time);
