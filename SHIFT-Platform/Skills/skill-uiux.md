# SKILL: UIUX

**Purpose:** Reconstruct screens, navigation graph, user journeys, and the design system from UI evidence.
**Invoked by:** Browser Agent
**Phase(s):** SCAN, HARVEST
**Inputs:** Every Evidence Pool element tagged `ui` or `design` — `/UI/*` screenshots, recordings, UI exports, screen decompositions from OutDoc/OML

---

## Procedure

1. **Catalogue distinct screens:**
   - Assign `EV-` per screen image or export.
   - Name each screen from its title bar, page heading, or route label.
   - Mark screens with ambiguous purpose as `DBT-` — do not label by guessing.
2. **Enumerate elements, inputs, and actions per screen:**
   - Visible form fields, buttons, links, tables, modals.
   - Visible state variations (empty state, loaded state, error state) if evidenced.
   - Role-conditional elements (visible only to certain roles) — note and refer to Security domain.
3. **Build the navigation graph from evidenced transitions:**
   - HIGH: transition shown in a recording or explicitly linked in an export.
   - MEDIUM: transition strongly implied by button label + target screen name + context.
   - LOW: transition inferred from a single screenshot's implied flow.
   - Each edge: `{source screen, action/trigger, target screen, confidence, EV-ref}`.
4. **Stitch user journeys:** group screens into task-oriented flows. A journey has: start state, steps (screen + action), end state, branching points.
5. **Extract design tokens** (if design artifacts are present): color palette, typography, spacing scale, component library reference. This feeds the Design System Inventory/Spec if a target design system needs to be defined.

---

## Quality Bar

- Every `ui`-tagged pool element is assigned to a catalogued screen.
- Every navigation edge cites a transition source (`EV-` ref).
- Inferred edges are `ASM-` with a stated confidence rationale.
- Role-conditional elements have `REF-` entries filed for unevidenced roles.
- Journeys are assembled only from evidenced or ASM-marked edges — no invented transitions.

---

## Question Hooks

| Situation | Action |
|---|---|
| Navigation between two screens implied but not shown | MAJOR `DBT-` with ProposedDefault; request recording |
| Role-conditional UI without role evidence | File `REF-` to Security domain via Orchestrator |
| Only static screenshots (no recordings) | Cap all journeys at MEDIUM; batch `QST-` offering inferred defaults |
| Screen count seems incomplete (dead links, missing targets) | MAJOR `QST-`: request additional screen exports |
| Screen purpose ambiguous | MINOR `DBT-`; never label with a guessed function as a finding |

---

## Outputs

- `ART-1-001` Screen Inventory
- `ART-1-002` Navigation Map
- `ART-1-003` User Journeys
- `ART-1-004` Screen Specifications
- Design System Inventory/Spec (if design evidence present)

---

## Anti-Patterns

- Asserting a journey across unseen transitions.
- Inventing screens not present in evidence.
- Labeling a screen's function as a confirmed finding when only the title supports it.
- Asserting roles or permissions from UI alone — that belongs to the Security Agent.
- Building journeys that show steps with UNKNOWN confidence as if they are confirmed.
