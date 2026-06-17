# ART-0-006 MRS Report (Revised — 2026-06-16)

## Formula

MRS = 100 × Σ(coverage × quality × weight) / Σ(weight)
      − 5 × (open blocking doubts)
      − 2 × (critical open assumptions)

## Inputs

| Category | Coverage | Quality | Weight | Contribution |
|---|---:|---:|---:|---:|
| data | 1.00 | 0.95 | 5 | 4.75 |
| logic | 1.00 | 0.85 | 5 | 4.25 |
| ui | 0.85 | 0.75 | 4 | 2.55 |
| api | 0.80 | 0.70 | 4 | 2.24 |
| security | 0.95 | 0.90 | 4 | 3.42 |
| runtime | 0.20 | 0.40 | 2 | 0.16 |
| design | 0.50 | 0.50 | 1 | 0.25 |

Weighted sum: 17.62
Weight total: 25.00
Raw score: 70.5
Open blocking doubts: 0
Critical open assumptions: 0

**MRS: 70.5 / 100**

DISCOVER threshold: 60
Gate status: PASSED (margin: +10.5)

## What changed from initial run

| Category | Before | After | Delta | Reason |
|---|---:|---:|---:|---|
| data | 4.04 | 4.75 | +0.71 | Database files confirmed as full SQL DDL (118 tables, HIGH confidence) |
| security | 2.08 | 3.42 | +1.34 | roles_permissions.md added: full role matrix, permission flags, scope filters, evaluation flow |
| api | 1.56 | 2.24 | +0.68 | Named integrations (TranzPay, LenderDock, Google Geocoding, CryptoAPI) confirmed in Logic files |

**Total MRS gain: +9.1 points (61.4 → 70.5)**

## Expected post-SCAN MRS

SCAN-phase extraction will:
- Deep-read OML files → logic quality HIGH → +0.5 to +1.0
- Extract DB schema entities from DDL → data 95%+ → +0.2
- Parse OutDoc HTML for UI screens across Claims/Billing/Clients → ui 90%+ → +0.3 to +0.5
- Confirm API contracts from OML REST consumers → api 85%+ → +0.3 to +0.5

**Projected post-SCAN MRS: 72–74 (computed) → validated deliverables expected to cross 80 during HARVEST.**
