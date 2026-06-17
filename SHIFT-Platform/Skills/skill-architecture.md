# SKILL: Architecture

**Purpose:** Design the target HOW against the approved WHAT (PRD) and the customer's chosen technology stack.
**Invoked by:** Architecture Agent, Security Agent (security layer), Migration Agent (data migration layer)
**Phase(s):** IDEATE, FORGE (validation)
**Inputs:** Approved PRD; customer stack DEC- entries; Security/Integration/Data findings; NFR Catalog

---

## Procedure

1. **Confirm stack choices are recorded as DEC- (customer-owned):**
   - Frontend framework, backend language/runtime, database engine, cloud provider, identity provider, CI/CD tool.
   - If any required choice is missing → RED stop immediately; Chief Orchestrator must run a Clarification Round. This skill does not continue without the stack.
2. **Produce Architecture Decision Records (ADRs)** for each significant design decision:
   - ADR format: Title · Status (Proposed/Accepted/Superseded) · Context · Decision · Rationale · Alternatives Considered · Consequences.
   - Every ADR must trace to ≥1 PRD requirement ID.
   - Every ADR must cite the stack `DEC-` it depends on.
3. **Build C4 Architecture Diagrams:**
   - Level 1 (Context): the system in relation to users and external systems.
   - Level 2 (Container): deployable units (web app, API, database, queue, etc.).
   - Level 3 (Component): major internals of each container.
   - Level 4 (Code): only for architecturally significant complex components.
4. **Design per-layer architecture:**
   - Frontend: component structure, routing, state management, build/bundle.
   - Backend: service/layer decomposition (presentation / application / domain / infrastructure), domain model.
   - Security: authentication flow, authorization enforcement, security zones (work from Security Agent's architecture).
   - Integration: API gateway pattern, event/message bus (if async), external service contracts.
   - Data migration: work from Migration Agent's field mappings to define the migration component.
   - Cloud/infrastructure: hosting topology, scaling model, environment matrix (dev/staging/prod).
   - Observability: logging strategy, metrics, alerting thresholds, distributed tracing.
   - CI/CD: pipeline stages, environment gates, deployment strategy (blue-green, canary, rolling).
5. **Verify requirement coverage:**
   - Every PRD requirement maps to ≥1 architecture component.
   - If a requirement maps to nothing → `CHL-` back to PRD; do not improvise.
6. **Assemble the Technical Architecture Document (TAD)** from all per-layer outputs + ADRs + C4.

---

## Quality Bar

- Every significant decision has an ADR tracing to a PRD requirement.
- Every PRD requirement has an architectural home.
- Every security requirement from the Security Agent has an architectural implementation.
- C4 diagrams are consistent with the TAD prose.
- No technology choice is made without a customer `DEC-`.
- Architecture Gate Package is ready for human review.

---

## Question Hooks

| Situation | Action |
|---|---|
| Required stack choice missing | RED stop; Chief Orchestrator runs Clarification Round |
| PRD requirement infeasible on chosen stack | CRITICAL `DBT-`: surface conflict to customer |
| NFR (scale, latency, availability) is UNKNOWN | `QST-`: cannot size architecture without it |
| Security requirement has no architectural implementation | CRITICAL `DBT-`: blocking |
| Two valid patterns both satisfy a requirement | Recommend one with rationale; log alternatives as YELLOW |

---

## Outputs

- `ART-3-002` ADRs
- `ART-3-003` C4 Architecture Diagrams
- `ART-3-004` through `ART-3-011` per-layer architecture documents
- `ART-3-012` Technical Architecture Document

---

## Anti-Patterns

- Choosing the technology stack for the customer — that is always their decision.
- Designing past the PRD (adding capabilities not in requirements).
- Generating implementation code — that is Forge's domain, after the Architecture gate.
- Producing the TAD before the PRD gate is PASSED.
- Skipping ADRs for significant decisions ("obvious" choices still need a record).
- Leaving any PRD requirement without an architectural home.
