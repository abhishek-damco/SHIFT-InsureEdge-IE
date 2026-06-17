# SHIFT AI Modernization Platform — Claude Code Configuration

This workspace contains the SHIFT platform and project instances. Claude Code agents are mapped below.

---

## Platform Structure

```
SHIFT-Platform/           ← Shared, reusable. Never edited per-project.
    Governance/           ← Layer 0: rules every agent obeys
    Orchestrator/         ← Layer 1: Chief Orchestrator + Agent Template
    Agents/               ← Layer 2: 14 specialist agent prompts
    Skills/               ← Layer 3: 8 reusable analysis skills

Project-Template/         ← Copy this to Project-<Customer>/ per engagement
    project.config.yaml   ← The ONLY file that changes per project
    Inputs/               ← Source artifacts (OutSystems/, UI/, Logic/, Database/, API/, Runtime/)
    Outputs/              ← Deliverables (00-Discover/ through 05-Transfer/ + _registry/)
```

---

## How to Start an Engagement

1. Copy `Project-Template/` → `Project-<CustomerName>/`
2. Fill in `project.config.yaml` (projectId, projectName, sourcePlatform)
3. Drop source artifacts into `Project-<CustomerName>/Inputs/` subfolders
4. In Claude Code, invoke the Chief Orchestrator (see below)

---

## Agent Definitions (@-mentions)

Claude Code agents are defined here so they can be invoked with `@agent-name`.

### @chief-orchestrator
**File:** `SHIFT-Platform/Orchestrator/chief-orchestrator.md`
**Role:** Conductor of the entire engagement. Single point of contact with the human. Owns the DAQ Register, phase gates, Clarification Rounds, and all human communication. Dispatches all specialist agents.
**Invoke with:** `@chief-orchestrator Start a SHIFT engagement for [application name]. The project config is at Project-<CustomerName>/project.config.yaml.`

### @discovery
**File:** `SHIFT-Platform/Agents/01-discovery-agent.md`
**Role:** Artifact intake, classification, Evidence Pool decomposition, MRS computation.
**Phase:** DISCOVER
**Invoked by:** Chief Orchestrator

### @browser
**File:** `SHIFT-Platform/Agents/02-browser-agent.md`
**Role:** Screens, navigation graph, user journeys.
**Phase:** SCAN, HARVEST
**Invoked by:** Chief Orchestrator

### @data
**File:** `SHIFT-Platform/Agents/03-data-agent.md`
**Role:** Entities, relationships, data dictionary, ERD.
**Phase:** SCAN, HARVEST, IDEATE, FORGE
**Invoked by:** Chief Orchestrator

### @logic
**File:** `SHIFT-Platform/Agents/04-logic-agent.md`
**Role:** Workflows, business rules, validation rules.
**Phase:** SCAN, HARVEST
**Invoked by:** Chief Orchestrator

### @integration
**File:** `SHIFT-Platform/Agents/05-integration-agent.md`
**Role:** APIs, external dependencies, integration contracts.
**Phase:** SCAN, HARVEST, IDEATE
**Invoked by:** Chief Orchestrator

### @business-analyst
**File:** `SHIFT-Platform/Agents/06-business-analyst-agent.md`
**Role:** User stories, acceptance criteria, screen specifications.
**Phase:** HARVEST
**Invoked by:** Chief Orchestrator

### @product-manager
**File:** `SHIFT-Platform/Agents/07-product-manager-agent.md`
**Role:** PRD assembly, prioritization, NFR catalog.
**Phase:** HARVEST
**Invoked by:** Chief Orchestrator

### @security
**File:** `SHIFT-Platform/Agents/08-security-agent.md`
**Role:** Authentication, authorization, roles, security risks.
**Phase:** SCAN, HARVEST, IDEATE
**Invoked by:** Chief Orchestrator

### @architecture
**File:** `SHIFT-Platform/Agents/09-architecture-agent.md`
**Role:** Target architecture design, ADRs, C4 diagrams, Technical Architecture Document.
**Phase:** IDEATE, FORGE
**Invoked by:** Chief Orchestrator

### @migration
**File:** `SHIFT-Platform/Agents/10-migration-agent.md`
**Role:** Data migration strategy, field mappings, cutover planning.
**Phase:** IDEATE, TRANSFER
**Invoked by:** Chief Orchestrator

### @forge
**File:** `SHIFT-Platform/Agents/11-forge-agent.md`
**Role:** Implementation asset generation (repository, models, APIs, specs, migration scripts).
**Phase:** FORGE
**Invoked by:** Chief Orchestrator

### @qa
**File:** `SHIFT-Platform/Agents/12-qa-agent.md`
**Role:** Test strategy, test coverage matrix, UAT.
**Phase:** FORGE, TRANSFER
**Invoked by:** Chief Orchestrator

### @documentation
**File:** `SHIFT-Platform/Agents/13-documentation-agent.md`
**Role:** Assembling all deliverables to the Layer 0 §10 Output Standard.
**Phase:** HARVEST, FORGE, TRANSFER
**Invoked by:** Chief Orchestrator

### @transfer
**File:** `SHIFT-Platform/Agents/14-transfer-agent.md`
**Role:** Ownership handover — deployment runbook, support runbook, knowledge transfer, decommission checklist.
**Phase:** TRANSFER
**Invoked by:** Chief Orchestrator

---

## Layer 0 Governance (inherited by all agents)

All agents read and operate under:
`SHIFT-Platform/Governance/layer-0-governance.md`

Key rules:
- **Ask-vs-Assume matrix (§1):** CRITICAL + LOW/UNKNOWN = always BLOCK + ASK.
- **DAQ Register (§2):** single ledger for all Doubts, Assumptions, Questions. Nothing deleted.
- **Confidence bands (§3):** HIGH 0.85+, MEDIUM 0.60–0.84, LOW 0.30–0.59, UNKNOWN < 0.30.
- **Phase gates (§4):** zero open blocking doubts required to exit any phase.
- **Evidence first (§5):** no FND- without an EV-. No claim without a citation.
- **Batched questions (§6):** questions accumulate; only surfaced at Clarification Rounds.
- **Evidence Pool (§12):** agents pull by domain tag across ALL sources. An empty folder is NOT absence.

---

## Skills (invoked by agents, not directly by users)

| Skill | File | Invoked By |
|---|---|---|
| Discovery | `Skills/skill-discovery.md` | Discovery Agent |
| Data | `Skills/skill-data.md` | Data Agent, Migration Agent |
| UIUX | `Skills/skill-uiux.md` | Browser Agent |
| Integration | `Skills/skill-integration.md` | Integration Agent |
| BusinessAnalysis | `Skills/skill-business-analysis.md` | Business Analyst, Product Manager |
| Architecture | `Skills/skill-architecture.md` | Architecture, Security, Migration |
| Modernization | `Skills/skill-modernization.md` | Migration Agent, Transfer Agent |
| Documentation | `Skills/skill-documentation.md` | Documentation Agent, Transfer Agent |

---

## Phase Sequence

```
DISCOVER → SCAN → HARVEST → [PRD Gate: human APPROVE] → IDEATE → [Arch Gate: human APPROVE] → FORGE → TRANSFER
```

- **DISCOVER:** artifact intake, Evidence Pool build, MRS.
- **SCAN:** domain extraction (Browser, Data, Logic, Integration, Security) in parallel.
- **HARVEST:** requirement composition (Business Analyst, Product Manager) → PRD Gate.
- **IDEATE:** target architecture design (Architecture, Security, Migration) → Architecture Gate.
- **FORGE:** implementation asset generation (Forge, QA).
- **TRANSFER:** ownership handover (Transfer, Documentation, QA).

No phase starts before the prior phase's gate is PASSED.
Human gates (PRD, Architecture) require explicit APPROVE/REJECT/CONDITIONS — SHIFT never self-approves.

---

## Reference

Full specification: `SHIFT-COMPLETE-Specification.md`
How to run DISCOVER: `HOW-TO-RUN-DISCOVER.md`
