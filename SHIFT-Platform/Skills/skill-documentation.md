# SKILL: Documentation

**Purpose:** Assemble agent findings and register state into human-facing deliverables that conform to the Layer 0 §10 Output Standard, with full traceability and all caveats preserved.
**Invoked by:** Documentation Agent, Transfer Agent
**Phase(s):** HARVEST, FORGE, TRANSFER
**Inputs:** Findings, assumptions, doubts, questions, risks, decisions, and artifacts from all agents (via Orchestrator); the DAQ Register; the Evidence Pool

---

## Procedure

1. **Assemble each deliverable in the Layer 0 §10 section order:**
   1. Executive Summary — plain language, ≤1 page, no jargon. State confidence level honestly.
   2. Evidence Sources — the `EV-` inventory used in this document.
   3. Findings — each finding: statement + confidence band + evidence refs (`EV-`/`FND-`).
   4. Assumptions — every `ASM-` entry: the assumption, its materiality, and its proposed default.
   5. Risks — every `RSK-` entry: statement + likelihood + impact + mitigation.
   6. Open Questions — the current Clarification Round items, if any. Never hide open items.
   7. Recommendations — next actions, ranked.
   8. Confidence Scores — per section + overall MRS.
   9. Traceability Appendix — map every claim to its `EV-`/`FND-`/`DEC-`.

2. **Preserve all caveats:** Every finding marked `ASM-`, `DBT-`, or `PROVISIONAL` retains its marker in the document. Never strip uncertainty to make a document "cleaner."

3. **Handle missing evidence correctly:** Where a section would be empty because evidence is missing, insert the relevant `QST-`/`ASM-` entry. The gap is the content. Never fabricate content to fill a section.

4. **Verify citation before including any finding:**
   - Confirm the finding has ≥1 `EV-` reference.
   - If it lacks an `EV-` ref → file a `CHL-` back to the authoring agent; hold the finding out of the document.
   - An uncited finding in a deliverable makes the deliverable invalid.

5. **Build the Traceability Appendix:** for every significant claim in the document, provide the chain: claim → `FND-` → `EV-` (physical source + locus) → `DEC-` (if a human decision was involved). This appendix is the audit trail.

6. **Format Gate Packages** per the Chief Orchestrator's gate package format:
   - Lead with the decision the human must make.
   - State the default if they approve all.
   - List open items by materiality (CRITICAL first).
   - Include the "what we assumed and why" one-pager.

---

## Quality Bar

- 100% of claims in every deliverable are traceable to a `FND-`/`EV-`.
- All caveats, `ASM-` markers, and `PROVISIONAL` flags are preserved verbatim.
- No fabricated content fills any gap — gaps are visible as `QST-`/`ASM-` entries.
- Every deliverable's structure matches the Layer 0 §10 section order.
- Gate packages lead with the human decision and the default.

---

## Question Hooks

| Situation | Action |
|---|---|
| Section would be empty (evidence missing) | Insert the gap as QST-/ASM-; do not fill |
| Finding lacks an EV- reference | CHL- to authoring agent; hold finding from document |
| Executive Summary misrepresents confidence | Rewrite summary to reflect actual confidence; raise QST- if significant |

---

## Outputs

- `ART-2-012` PRD Package
- `ART-4-012` Architecture Package
- `ART-4-013` Test Strategy Package
- `ART-5-001` Knowledge Transfer Package
- `ART-5-002` Gate Packages (all phases)
- `ART-5-003` Complete Traceability Report

---

## Anti-Patterns

- Authoring new findings — the Documentation Agent assembles; it does not create.
- Stripping caveats, uncertainty markers, or provisional flags from any content.
- Presenting LOW/UNKNOWN-confidence content as settled fact.
- Including a finding without a cited `EV-` reference.
- Filling empty sections with fabricated content instead of visible gap markers.
- Allowing a gate package to present a deliverable as "complete" when critical items are open.
