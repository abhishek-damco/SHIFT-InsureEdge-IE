# SKILL: Data

**Purpose:** Reconstruct the neutral, technology-agnostic data model from all available evidence.
**Invoked by:** Data Agent (and Migration Agent for field-level mapping)
**Phase(s):** SCAN, HARVEST, IDEATE
**Inputs:** Every Evidence Pool element tagged `data` — `/Database/*`, OML entity definitions, OutDoc decomposed entities

---

## Procedure

1. **Parse DDL/schema** → extract entities, attributes, data types, primary keys, unique constraints (HIGH confidence — DDL is a direct, authoritative source).
2. **Extract foreign keys and cardinality:**
   - From DDL FK constraints: HIGH.
   - From ERD annotations: MEDIUM (annotation may not match implementation).
   - From naming convention + usage pattern: LOW.
3. **Reconcile technical names with business names** for the data dictionary:
   - Exact match in documentation: HIGH.
   - Inferred from field name semantics: MEDIUM (log as `ASM-`).
   - Unknown: leave blank and raise `QST-`.
4. **Flag computed/derived columns and their logic** — do not author the logic rule. Route via `REF-` to the Logic domain. I own: what the column stores. Logic Agent owns: how it is computed.
5. **Flag stored procedure data structures** — extract entity references and data shapes; route business logic embedded in stored procedures via `REF-` to Logic domain.
6. **Generate the ERD** from the verified entity and relationship inventory. ERD is a visual output of confirmed findings; it adds no new claims.

---

## Quality Bar

- Every evidenced entity and attribute is traceable to a specific `EV-` schema object.
- Every relationship states its cardinality and the evidence type supporting it.
- Dictionary entries are either evidenced (with source) or marked `ASM-` with a proposed definition.
- ERD is consistent with the inventory — no entities in the ERD not in the inventory.
- No business rules appear in the data model deliverables — only structure and meaning.

---

## Question Hooks

| Situation | Action |
|---|---|
| Relationship cardinality implied but not schema-enforced | MAJOR `DBT-` with ProposedDefault |
| Attribute business meaning unclear from name | MINOR/MAJOR `QST-` (never fabricate a definition) |
| Two sources disagree on schema (e.g., DDL vs ERD) | CRITICAL `DBT-` — freeze dependent findings |
| Entity referenced by FK but not defined | MAJOR `QST-`: missing entity definition |
| Only ERD image available (no DDL) | All structure findings capped at MEDIUM; `QST-` for DDL |

---

## Outputs

- `ART-1-005` Entity Inventory
- `ART-1-006` Relationship Inventory
- `ART-1-007` Data Dictionary
- `ART-1-008` ERD

---

## Anti-Patterns

- Inventing entities to "complete" a model — only evidenced entities may be findings.
- Writing guessed business definitions as fact in the dictionary.
- Silently resolving schema conflicts between sources.
- Authoring business rules for computed columns instead of routing them to Logic.
- Using ERD as a source of truth when DDL is also present and conflicts.
