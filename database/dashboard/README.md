# Dashboard database changes

The Dashboard reuses `policy`, `account`, `policy_product`, `policy_limit_coverage`,
`policy_premium`, `policy_payment_transaction`, and `audits`. One small table is added for
per-user widget visibility/order; no business records are rewritten or deleted.

## Apply

Choose exactly one deployment path:

1. Preferred EF Core path: from `Backend`, first generate/review the SQL for the target
   environment, then run
   `dotnet ef database update 20261019090000_AddDashboardPreferencesAndIndexes`.
2. DBA/manual path: run `001_dashboard_schema_changes.sql`, then
   `002_dashboard_indexes.sql`, then `003_dashboard_reference_data.sql`. Do not subsequently mark/run the EF migration unless the
   migration history is reconciled, because the two paths represent the same changes.

Prerequisites: existing `client`, `user`, `policy`, `policy_payment_transaction`, and
`audits` tables; a PostgreSQL role allowed to create tables and indexes. Take a normal
schema backup before production changes. Index creation may briefly lock the target table;
for very large production tables, a DBA may translate these statements to `CREATE INDEX
CONCURRENTLY` outside a transaction.

The checked-in EF model snapshot predates Dashboard and other unrelated model changes.
The migration above is intentionally hand-reviewed and targeted, but do not generate a
subsequent migration until the snapshot has been separately reconciled and reviewed. The
snapshot mismatch does not authorize adding unrelated operations to this deployment.

## Verify

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dashboard_preference'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname LIKE 'ix_%dashboard%'
ORDER BY indexname;

SELECT client_id, producer_id, policy_type, policy_status, count(*)
FROM policy
GROUP BY client_id, producer_id, policy_type, policy_status
ORDER BY client_id, producer_id NULLS FIRST, policy_type, policy_status;
```

## Rollback considerations

The indexes can be removed without losing business data. Dropping
`dashboard_preference` deletes users' saved layout choices, so export or back up that table
before an explicit rollback. No destructive rollback statement is included as an automatic
deployment step.
