# SKILL: Modernization

**Purpose:** Plan the legacy→target data and behavior transition and cutover sequence with risk control.
**Invoked by:** Migration Agent (strategy), Transfer Agent (cutover execution)
**Phase(s):** IDEATE (strategy), TRANSFER (cutover)
**Inputs:** Data model (Data Agent), target architecture (Architecture Agent), runtime/volume evidence, NFR Catalog (downtime tolerance)

---

## Procedure

1. **Build field-level legacy→target mapping** for every entity:
   - Direct (name + type match): HIGH confidence; auto-populate.
   - Transformation (rename, type cast, split, merge, default fill): MEDIUM; document the transformation rule explicitly.
   - Derived (computed at migration time from other fields): LOW; flag the derivation logic for Forge to implement and verify.
   - Unmapped (no target field): raise `DBT-` — never silently drop a field.
2. **Choose migration pattern** from the intersection of:
   - **Data volume:** from runtime evidence. Large volumes (>1M rows affected) favor phased or Change Data Capture (CDC). Unknown volume → `QST-`.
   - **Downtime tolerance:** from NFR Catalog. Zero downtime requires parallel-run or CDC. Unknown → CRITICAL `QST-`.
   - **System complexity:** many integration dependencies favor phased (each integration migrated and tested separately).
   - Pattern options: big-bang (one cutover window), phased (module by module), parallel-run (both systems live briefly), CDC (continuous replication).
3. **Define validation gates** — what must pass before proceeding to the next cutover step:
   - Record count check: source count == target count.
   - Checksum/hash on key fields.
   - Smoke test: spot-check sample of records.
   - Integration health: dependent systems confirm they can reach the target.
4. **Define rollback procedure** per cutover step:
   - What is the rollback action? (Revert database, restore backup, redirect traffic back.)
   - What are the rollback criteria? (What condition triggers rollback?)
   - A cutover step without a rollback plan is a `DBT-` blocking item — it cannot proceed.
5. **Define go/no-go criteria** — the measurable conditions that must hold for each cutover step to proceed.
6. **Verify business rule survival:** rules embedded in stored procedures or legacy triggers that must be reproduced in the target — coordinate with Logic Agent findings to confirm rules are migrated, not just data.

---

## Quality Bar

- Every entity has a complete field-by-field mapping.
- Every unmapped field is a `DBT-`/`QST-`.
- Migration pattern is justified by evidence (volume + downtime tolerance).
- Every cutover step has: validation gate + rollback procedure + go/no-go criteria.
- No destructive cutover step is auto-runnable — all require a human confirmation gate.

---

## Question Hooks

| Situation | Action |
|---|---|
| Data volume unevidenced | `QST-`: migration risk cannot be sized |
| Downtime tolerance unknown | CRITICAL `QST-`: drives pattern choice |
| Field mapping ambiguous | MAJOR `DBT-` with ProposedDefault |
| Field must be dropped | MAJOR `QST-`: confirm data can be dropped/archived |
| Business logic in stored procedures | Verify with Logic Agent findings before migration |

---

## Outputs

- `ART-3-013` Data Migration Architecture (field mappings)
- `ART-3-014` Migration Strategy
- `ART-3-015` Cutover Strategy

---

## Anti-Patterns

- Committing to a cutover window without a human `DEC-`.
- Accepting data loss without a `DEC-`.
- Choosing a migration pattern when downtime tolerance or data volume is UNKNOWN.
- Producing a destructive cutover checklist as auto-runnable.
- Silently dropping unmapped fields — every dropped field needs a `DBT-`.
- Ignoring business logic embedded in legacy stored procedures.
