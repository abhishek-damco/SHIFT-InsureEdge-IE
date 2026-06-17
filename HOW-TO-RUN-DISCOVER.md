# How to Run the DISCOVER Phase

> This guide walks through starting your first SHIFT engagement from scratch.
> Prerequisites: artifacts placed in `/Input`, Claude Code open in this project directory.

---

## Step 1 — Drop your artifacts into /Input

Place legacy application artifacts in the right subfolder:

| Subfolder | Put here |
|---|---|
| `/Input/OutSystems/` | OML export files (.oml), OutDoc PDF exports |
| `/Input/UI/` | Screenshots of every screen, screen recordings, UI exports |
| `/Input/Logic/` | Server action exports, client action flows, BPT/workflow exports, logic screenshots |
| `/Input/Database/` | DDL scripts (.sql), ERD diagrams, schema exports, stored procedure exports |
| `/Input/API/` | Swagger/OpenAPI specs (.yaml/.json), Postman collections, WSDL files, API logs |
| `/Input/Runtime/` | Application logs, config files, environment configs, profiling data |

**More is better.** The Modernization Readiness Score (MRS) scales with evidence quality. The minimum viable set is:
- At least one primary Database artifact (DDL or schema export)
- At least one primary Logic artifact (OML export or action exports)
- At least screenshots of the key screens

---

## Step 2 — Start the Chief Orchestrator

In Claude Code, type:

```
@chief-orchestrator Start a SHIFT engagement for [application name]. The artifacts are in /Input.
```

The Chief Orchestrator will:
1. Create the live DAQ Register (`register/DAQ-REGISTER.md`) and fill in the engagement metadata.
2. Invoke the Discovery Agent (`@discovery`) to inventory all artifacts.
3. Compute the MRS.
4. Either proceed to SCAN (if MRS ≥ 60) or present a Clarification Round (if below).

---

## Step 3 — Respond to the Clarification Round (if triggered)

The Chief Orchestrator will present a structured list of questions. Each question has:
- **Why it matters** — what is blocked without the answer
- **Proposed default** — what SHIFT will assume if you don't answer

**To unblock everything:** reply `approve all defaults` and SHIFT proceeds with logged assumptions.

**To answer specific items:** respond to the numbered questions. You can mix: approve some defaults, answer others.

**Example response:**
```
1. Approve default — use the most recent file date as the source of truth version.
2. The correct schema is in Input/Database/schema_v3.sql — ignore the ERD.
3. Approve default.
```

---

## Step 4 — DISCOVER phase completes

When the Discovery Agent has finished, the Chief Orchestrator will present:

### DISCOVER Gate Report

```
## DISCOVER Gate Report

Artifacts inventoried: [N]
MRS: [score] / 100
Open blocking items: [count]

### Coverage by category:
  Database:   [coverage]% — [quality]
  Logic:      [coverage]% — [quality]
  UI/Screens: [coverage]% — [quality]
  API:        [coverage]% — [quality]
  Security:   [coverage]% — [quality]
  Runtime:    [coverage]% — [quality]

### Gaps (open questions):
  [list of QST- items with proposed defaults]

### Gate status: PASSED / BLOCKED
```

**If PASSED (MRS ≥ 60, zero blocking items):** SHIFT automatically proceeds to SCAN.

**If BLOCKED:** Resolve the listed blocking items. You can provide missing artifacts, answer questions, or approve the proposed defaults to accept the risk and proceed.

---

## Understanding the MRS

| Score | Meaning |
|---|---|
| 80–100 | Excellent coverage — all phases will produce HIGH-confidence deliverables |
| 60–79 | Good coverage — DISCOVER gate passes; some areas will have MEDIUM confidence |
| 40–59 | Partial coverage — DISCOVER gate blocked; key evidence is missing |
| 0–39 | Insufficient coverage — significant evidence gaps; most findings will be LOW confidence |

The MRS is computed as:
```
MRS = 100 × (weighted sum of coverage × quality per category)
      − 5 × (open blocking doubts)
      − 2 × (open CRITICAL assumptions)
```

---

## What gets produced in DISCOVER

All outputs land in `/Output/DISCOVER/`:

| File | What it contains |
|---|---|
| `artifact-inventory.md` | Every EV- item: file, category, type, confidence |
| `completeness-matrix.md` | Coverage and quality per category; MRS formula inputs |
| `missing-evidence.md` | All QST- and RSK- items for missing artifacts |
| `readiness-assessment.md` | Narrative interpretation of the MRS |
| `risk-register.md` | Initial risks from evidence gaps |
| `mrs-report.md` | MRS score with full formula inputs |

---

## Proceeding to SCAN

SCAN activates five agents in parallel:
- **Browser Agent** — screens and navigation
- **Data Agent** — entities, relationships, data dictionary
- **Logic Agent** — workflows, business rules, validations
- **Integration Agent** — APIs and external dependencies
- **Security Agent** — roles, auth, security risks

Each agent reads from the EV- inventory and produces its own structured findings. The Chief Orchestrator merges everything into the DAQ Register and runs a Clarification Round at SCAN exit before producing the HARVEST inputs.

---

## Tips for the best results

1. **OML exports > screenshots for logic.** If you can export the OML from OutSystems Service Studio, always prefer it over logic screenshots. It's the difference between HIGH and LOW confidence on every business rule.
2. **DDL > ERD diagrams for data.** A DDL script is always more authoritative than an ERD diagram. Provide both if you have them.
3. **Name your files clearly.** The Discovery Agent uses file names and paths as locus identifiers. `schema_production_v3.sql` is more useful than `export (1).sql`.
4. **Include the Postman collection even if you have OpenAPI.** Postman collections often reveal undocumented endpoints that the OpenAPI spec misses.
5. **Runtime logs reveal a lot.** Even a sample of application logs can reveal actual API calls, user volumes, and error patterns that no static artifact shows.
