# Local database setup

Apply migrations in filename order (`001_...` through the highest numbered file):

```
psql -h localhost -U postgres -d insuredge -f 001_initial_schema.sql
psql -h localhost -U postgres -d insuredge -f 002_seed_modules_screens.sql
... (all files, in order) ...
```

All migrations are safe to re-run (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`), so if
you're unsure what's applied, just run all of them again.

## Plumsail document generation

`013_product_document.sql` seeds two rows in `product_document` (the per-tenant Plumsail
template mapping table) with placeholder values (`REPLACE_WITH_PLUMSAIL_PROCESS_ID` /
`REPLACE_WITH_PLUMSAIL_USER_ID`). The app deliberately rejects anything starting with
`REPLACE_WITH` (see `DocumentGenerationService.IsConfigured`), so "Download Document" on
a Quote fails with a clear config-missing error until real values are set.

**Set them via `.env`, not SQL** — copy `PLUMSAIL_PROCESS_ID` / `PLUMSAIL_USER_ID` from
`.env.example` into your `Backend/.env` and fill in the real values (get them from
[wherever the team keeps them, e.g. 1Password / Slack — update this line with the
actual location]). The API applies them to `product_document` automatically on startup
(see `Program.cs`) — no manual SQL needed. It only overwrites the row while it's still
the seeded placeholder, so it's safe to leave in `.env` permanently.

The second row (`UnderwriterSpecificChangeEndorsement`) is optional — the app skips
that half of the document package automatically while it's still a placeholder.

If this table grows to more than one tenant, this auto-sync only targets `client_id=1`;
extend it (or fall back to a manual `UPDATE`) for additional clients.

## Permissions

`021_backfill_screen_permissions.sql` grants full permissions to every existing group
on every screen that doesn't already have a `screen_permissions` row. Run it any time
after adding a new screen in a later migration — screens with no permission row are
silently treated as "deny everything" (including View), not just missing individual
permission flags like Download.
