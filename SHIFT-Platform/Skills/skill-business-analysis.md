# SKILL: BusinessAnalysis

**Purpose:** Convert technical findings from SCAN into technology-neutral requirements, user stories, and testable acceptance criteria.
**Invoked by:** Business Analyst Agent, Product Manager Agent
**Phase(s):** HARVEST
**Inputs:** All SCAN deliverables; the Chief Orchestrator's XR- cross-reference map

---

## Procedure

1. **Compose requirements via XR- cross-reference links:**
   - For each capability evidenced in SCAN, pull the relevant findings from every domain via the `XR-` links the Chief Orchestrator maintains.
   - A composed requirement weaves: entity (Data) + rule (Logic) + screen (Browser) + role (Security) + integration (Integration).
   - A requirement that touches only one domain is a domain finding, not a complete requirement — flag it as incomplete.
2. **Write user stories:**
   - Format: "As a [role], I want [capability], so that [business outcome]."
   - Role: from Security Agent's User Roles (evidenced) or `ASM-` if inferred.
   - Capability: from the composed cross-domain finding.
   - Business outcome ("so that"): from evidence if available; `ASM-` + `QST-` if only mechanics are evidenced.
3. **Derive acceptance criteria (Given/When/Then):**
   - Each criterion maps to a specific validation rule or business rule from the Logic Agent's catalogs.
   - Cite the contributing `FND-`/`EV-` from every domain the criterion touches.
   - Mark criteria resting on LOW-confidence rules as `PROVISIONAL`.
4. **Run the WHAT/HOW neutrality check (Layer 0 §11):**
   - Scan every story and criterion for technology names, platform references, or implementation details.
   - Rewrite: "The system uses OutSystems Role-Based Access Control" → "The system enforces role-based access: [role] can [action], [role] cannot [action]."
   - Flag any neutrality failure that cannot be simply rewritten.
5. **Produce Screen Specifications** from Browser Agent findings — per-screen requirements derived from the screen inventory and navigation map.

---

## Quality Bar

- Every user story is traceable to a composed requirement (≥2 domains via `XR-` links).
- Every acceptance criterion cites ≥1 `FND-`/`EV-` from the domain it tests.
- No HOW/technology language appears in any story or criterion.
- Every story's "so that" is either evidenced or explicitly marked `ASM-`.
- Criteria resting on LOW-confidence rules are marked `PROVISIONAL`.

---

## Question Hooks

| Situation | Action |
|---|---|
| Story's "so that" not evidenced — only mechanics known | `QST-`: confirm business intent |
| Criterion depends on LOW-confidence rule | Mark `PROVISIONAL`; surface `QST-` |
| Screen implies a capability with no rule/data support | MAJOR `DBT-`: feature gap or missing evidence? |
| Capability cannot be cross-referenced to ≥2 domains | Flag as incomplete; do not ship to PRD |
| Technology name found in requirement after neutrality check | Rewrite; flag if not rewritable |

---

## Outputs

- `ART-2-001` User Personas (with Product Manager)
- `ART-2-002` User Stories
- `ART-2-003` Acceptance Criteria
- `ART-2-004` Screen Specifications
- `ART-2-005` Business Rules Catalog (phrased neutral)

---

## Anti-Patterns

- Inventing user motivation ("so that") without evidence.
- Embedding technology, platform, or implementation detail in requirements.
- Writing criteria for rules that are UNKNOWN confidence — mark them provisional, don't fabricate certainty.
- Writing a story from a single domain's findings without cross-domain composition.
- Accepting a capability as complete when it cannot be traced to its supporting domains.
