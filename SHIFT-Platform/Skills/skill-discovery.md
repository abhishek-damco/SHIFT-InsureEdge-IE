# SKILL: Discovery

**Purpose:** Inventory, classify, decompose, and score readiness of incoming artifacts.
**Invoked by:** Discovery Agent
**Phase(s):** DISCOVER (+ re-runs whenever new artifacts arrive)
**Inputs:** All files under `{inputRoot}` (all subfolders)

---

## Procedure

1. **Walk every file** under `{inputRoot}`; assign `EV-` with locus (path + filename).
2. **Classify** each file by:
   - Category: OutSystems / UI / API / Database / Runtime / Logic
   - Evidence type: primary (machine-readable, structured) / secondary (derived, semi-structured, screenshot, freetext)
3. **Decompose multi-domain sources** (OutDoc PDFs, OML exports, solution packs, stored procedures) into the Evidence Pool:
   - Crack open each multi-domain artifact.
   - Emit `EV-` elements tagged by domain: `logic`, `data`, `ui`, `api`, `security`, `role`, `workflow`, `nfr`, `design`.
   - Each `EV-` element: `{sourceArtifact, locus, domainTags, form, content/pointer, confidence}`.
   - One OutDoc yields many tagged elements — this is the intended result.
4. **Fill the Completeness Matrix** on **pool coverage by domain** (not folder presence):
   - For each domain: count pool elements, assess quality band.
   - A domain is covered when ≥1 pool element is tagged for it.
5. **Compute coverage × quality per domain → MRS** (Layer 0 §3 formula):
   - `coverage(c)` = fraction of expected artifact slots filled.
   - `quality(c)` = mean confidence achievable from present artifacts.
   - Apply category weights (from `project.config.yaml` or Layer 0 §3 defaults).
   - Apply penalties for open blocking doubts and open CRITICAL assumptions.
6. **Emit genuine gaps** as `QST-` (required domain, blocking) or `RSK-` (optional, non-blocking). Never skip a gap silently.

---

## Quality Bar

- 100% of files under `{inputRoot}` are classified and assigned an `EV-`.
- Every multi-domain source is decomposed into domain-tagged pool elements.
- MRS is reproducible from the Completeness Matrix inputs.
- No domain is marked "missing" while a tagged pool element for it exists anywhere.
- No file is silently skipped, even if unreadable (log as `RSK-` + `QST-`).

---

## Question Hooks

| Situation | Action |
|---|---|
| Required domain (Data, Logic) has zero pool elements | CRITICAL blocking `QST-`: request the artifact |
| Only screenshots for logic (no export) | MAJOR `DBT-`: offer proceed at LOW confidence as ProposedDefault |
| Multiple versions or environments detected | CRITICAL `QST-`: which is the source of truth? |
| File unreadable, corrupt, or partial | `RSK-` + `QST-`: log what was attempted |
| Folder empty but multi-domain source present | Do NOT raise gap; decompose the source first |

---

## Outputs

- `ART-0-001` Artifact Inventory
- `ART-0-002` Completeness Matrix
- `ART-0-003` Missing Evidence Register
- `ART-0-004` Readiness Assessment
- `ART-0-006` MRS Report
- Populated Evidence Pool (shared with all SCAN agents)

---

## Anti-Patterns

- Silently skipping unreadable files.
- Scoring "ready" when required domains have thin evidence.
- Marking a domain as "missing" based on folder absence without querying the pool.
- Assigning a single `EV-` to a multi-domain source without decomposing it.
- Fabricating coverage scores.
