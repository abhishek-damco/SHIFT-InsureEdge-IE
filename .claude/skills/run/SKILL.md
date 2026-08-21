---
description: Launch InsureEdge locally — .NET 8 API (Backend) + Vite/React frontend (Frontend), backed by a local PostgreSQL database. Use whenever asked to run, start, or smoke-test the InsureEdge app.
---

# Running InsureEdge locally

Two long-running processes, plus a PostgreSQL database that must already
be up and provisioned.

## 0. Prerequisites (one-time / environment check)

- PostgreSQL running locally on port 5432, with databases `insuredge`
  (and `insuredge_dev`) already created, owned by user `postgres`.
  Credentials and connection string live in `Backend/.env`
  (`DATABASE_URL=Host=localhost;Database=insuredge;Username=postgres;Password=userpass`)
  and are loaded via `DotNetEnv.Env.TraversePath().Load()` in
  `Backend/src/InsureEdge.API/Program.cs` before config binds.
- Schema is NOT managed by EF Core migrations — it's a numbered set of
  raw SQL scripts in `Backend/db/*.sql` (001_initial_schema.sql onward).
  Only run these if the `insuredge` database is missing tables (check
  with `psql -h localhost -U postgres -d insuredge -c "\dt"` — on this
  machine `psql` lives at `/c/Program Files/PostgreSQL/18/bin/psql.exe`,
  not on PATH). If tables already exist, skip straight to running the app.
- `dotnet` (net8.0 SDK), `node`, `npm` must be on PATH.

## 1. Build the backend

```bash
cd Backend
dotnet build InsureEdge.sln
```

Expect "Build succeeded" with only NuGet vulnerability warnings
(MailKit/MimeKit advisories) — those are pre-existing, not blockers.

## 2. Start the API (background, port 5000)

Background bash tasks reset cwd to filesystem root, so use an absolute
path and an absolute log path:

```bash
cd "/d/SHIFT-InsureEdge-feature-insure-edge/SHIFT-InsureEdge-feature-insure-edge/Backend/src/InsureEdge.API" \
  && dotnet run --no-build --urls http://localhost:5000 \
  > /d/SHIFT-InsureEdge-feature-insure-edge/SHIFT-InsureEdge-feature-insure-edge/api.log 2>&1
```

Run this via a backgrounded Bash call (`run_in_background: true`).
Success looks like this in the log:

```
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

Runs in "Production" hosting environment by default (no
`ASPNETCORE_ENVIRONMENT` set) — cookie `SecurePolicy` still resolves to
`None` for HTTP dev because the code checks `builder.Environment.IsDevelopment()`,
which is false here, so in practice you'll want `ASPNETCORE_ENVIRONMENT=Development`
set if you hit secure-cookie issues during login testing. Not needed
just to boot the API.

## 3. Start the frontend (background, port 3000)

```bash
cd "/d/SHIFT-InsureEdge-feature-insure-edge/SHIFT-InsureEdge-feature-insure-edge/Frontend" \
  && npm run dev \
  > /d/SHIFT-InsureEdge-feature-insure-edge/SHIFT-InsureEdge-feature-insure-edge/frontend.log 2>&1
```

Vite dev server listens on `:3000` and proxies `/api/*` to
`http://localhost:5000` (see `Frontend/vite.config.ts`). The frontend's
axios client (`Frontend/src/api/client.ts`) calls relative `/api` paths
with `withCredentials: true` for the HttpOnly auth cookie — always go
through the frontend origin (`:3000`), not the API origin, when testing
authenticated flows in a browser.

Success looks like:

```
VITE v5.x  ready in ...ms
➜  Local:   http://localhost:3000/
```

## 4. Smoke test

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/                              # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/me/permissions        # 401 (expected, unauthenticated)
```

A 401 on the permissions endpoint confirms the proxy → API → auth
pipeline is wired correctly (not an error state). For a real UI check,
open `http://localhost:3000/` in a browser and log in.

## Notes

- CORS on the API is locked to `localhost:3000`/`:3001` (see
  `Program.cs`) — don't move the frontend to another port without
  updating `AddDefaultPolicy`.
- Email sending uses MailKit SMTP configured via `Backend/.env`
  (`SMTP_*` vars) — defaults point at a fake `smtp.example.com` and will
  fail if any flow actually tries to send mail.
