# SCAN Dispatch Packet

Engagement: InsureEdge Application Modernization
Project ID: INSUREEDGE-2026
Phase: SCAN
Source platform: OutSystems

DISCOVER gate status: PASSED
MRS: 61.4 / 100
Evidence pool: `Project-Template/Outputs/_registry/DAQ-REGISTER.md`
Artifact inventory: `Project-Template/Outputs/DISCOVER/artifact-inventory.md`

## Dispatch Rule

All SCAN agents must query the Evidence Pool Index by domain tag. Agents must not treat folder absence as domain absence.

## Agent Objectives

### Browser Agent

Objective: Extract screens, navigation, user journeys, visible roles, forms, validations implied by UI, and UI evidence gaps from `ui` and `design` tagged evidence.

Primary inputs:
- UI screenshots
- UI scraping PDFs
- Web scrape PRDs
- OutDoc UI-bearing sources

### Data Agent

Objective: Extract entities, relationships, data dictionary candidates, database ownership, persistence risks, and data evidence gaps from `data` tagged evidence.

Primary inputs:
- Database artifacts
- OML/OAP files
- OutDoc exports

### Logic Agent

Objective: Extract actions, workflows, business rules, validations, timers, exception handling, state changes, and logic evidence gaps from `logic` and `workflow` tagged evidence.

Primary inputs:
- Logic markdown files
- OML/OAP files
- OutDoc exports
- Business logic screenshots

### Integration Agent

Objective: Extract APIs, external dependencies, events, service calls, payment/document/email integrations, and integration evidence gaps from `api` tagged evidence.

Primary inputs:
- OML/OAP files
- OutDoc exports
- Integration-related logic docs and screenshots

### Security Agent

Objective: Extract roles, permissions, authentication/authorization behaviors, security-sensitive workflows, and security evidence gaps from `security` and `role` tagged evidence.

Primary inputs:
- User Management artifacts
- Group Management artifacts
- OML/OAP files
- OutDoc exports

## Known DISCOVER Risks To Carry Forward

- `INSUREEDGE-2026-RSK-0-0001`: No dedicated OpenAPI/Postman/WSDL artifacts found.
- `INSUREEDGE-2026-RSK-0-0002`: No dedicated runtime logs or environment configs found.
- `INSUREEDGE-2026-RSK-0-0003`: User requested `/Input`; configured input root is `Project-Template/Inputs`.

