# ART-0-002 Artifact Completeness Matrix (Revised — 2026-06-16)

> Revised after human-supplied artifacts: SQL DDL scripts confirmed, roles_permissions.md added, runtime scope waived by human decision.

| Category | Coverage | Quality | Weight | Weighted Contribution | Basis |
|---|---:|---:|---:|---:|---|
| data | 100% | 95% | 5 | 4.75 | Full SQL DDL scripts (118 CREATE TABLE statements across 2 databases) confirmed as structured HIGH-confidence primary evidence. |
| logic | 100% | 85% | 5 | 4.25 | Logic markdown (2,049 functions), OML/OAP files, OutDocs, and business logic screenshots. MEDIUM quality because OML not fully extracted yet. |
| ui | 85% | 75% | 4 | 2.55 | 50 UI screenshots for Quotes&Policies, UI scraping PDF for Distribution, web-scrape PRDs for Q&P and User Management. Claims/Billing/Clients modules have no dedicated UI screenshots — covered partially via OutDoc HTML. |
| api | 80% | 70% | 4 | 2.24 | Named integrations confirmed in Logic files: TranzPay (payment), LenderDock (mortgage notifications), Google Geocoding, RssExtensionCryptoAPI (AES-256). Integration actions visible in OML/OutDoc. No OpenAPI/Postman file — evidence is inferred from action names and OutDoc. |
| security | 95% | 90% | 4 | 3.42 | roles_permissions.md provides full role matrix (5 roles), 10 permission flags, scope filters, group-based inheritance, and permission evaluation flow. Combined with User Management and Group Management OutDoc PDFs. HIGH quality. |
| runtime | 20% | 40% | 2 | 0.16 | Human decision: runtime logs/configs out of scope for this engagement. Score retained at floor to reflect absence; no QST raised. |
| design | 50% | 50% | 1 | 0.25 | UI screenshots provide visual evidence. No formal design system artifact (Figma, style guide). |

## MRS Computation

| Input | Value |
|---|---|
| Weighted sum | 17.62 |
| Weight total | 25.00 |
| Raw score | 70.5 |
| Open blocking doubts | 0 |
| Critical open assumptions | 0 |
| **MRS** | **70.5 / 100** |

**Note:** This is the revised DISCOVER MRS. The DISCOVER→SCAN threshold is 60 — gate remains PASSED with increased confidence. SCAN phase extraction (OML deep-read, OutDoc parsing, database schema analysis) is expected to push the post-SCAN MRS to 80+.
