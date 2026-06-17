# SKILL: Integration

**Purpose:** Reconstruct API contracts, integration boundaries, and external dependency maps.
**Invoked by:** Integration Agent (and Architecture Agent for integration layer design)
**Phase(s):** SCAN, HARVEST, IDEATE
**Inputs:** Every Evidence Pool element tagged `api` — `/API/*`, OML integration references, OutDoc decomposed integration nodes

---

## Procedure

1. **Parse each formal API specification** (`EV-` per endpoint):
   - OpenAPI/Swagger YAML/JSON: HIGH confidence — contract is machine-readable.
   - WSDL: HIGH confidence.
   - Postman collection: MEDIUM — may be informal or incomplete.
   - API log samples: MEDIUM — behavior observed; contract not formally stated.
2. **Classify each integration:**
   - Direction: inbound / outbound / bidirectional
   - Synchronicity: sync (REST, SOAP, GraphQL) / async (event, queue, webhook)
   - Scope: internal / external / third-party
3. **Capture contract per endpoint:**
   - HTTP method, path, query params, path params
   - Request schema and response schema (cite `EV-`)
   - Authentication/authorization mechanism — if not evidenced, file `REF-` to Security domain
   - Error codes and their meanings
4. **Reconcile specs vs logs vs Postman:**
   - If they agree: note corroboration; confidence rises.
   - If they conflict: `DBT-` CRITICAL — never silently prefer one source.
5. **Build dependency map:**
   - Directed graph: system → external dependency with criticality (critical / supporting / optional).
   - Criticality assessed from: call frequency in logs, system behavior without it, explicit documentation.

---

## Quality Bar

- Every evidenced endpoint has a contract entry with confidence and `EV-` ref.
- Every integration is classified (direction, sync/async, scope).
- All spec conflicts are `DBT-` items; none are silently resolved.
- Auth schemes for all integrations are either evidenced or filed as `REF-` to Security.
- Dependency map includes criticality with rationale.

---

## Question Hooks

| Situation | Action |
|---|---|
| Endpoint in logs but not in any spec | MAJOR `DBT-`: undocumented contract; request spec |
| Auth scheme not evidenced | File `REF-` to Security domain via Orchestrator |
| External dependency SLA/criticality unknown | `RSK-` + `QST-` |
| Postman and OpenAPI conflict | CRITICAL `DBT-`: which is authoritative? |
| Integration referenced in source but no spec found | MAJOR `DBT-`: request contract |

---

## Outputs

- `ART-1-013` Integration Inventory
- `ART-1-014` API Catalog
- `ART-1-015` Dependency Map

---

## Anti-Patterns

- Asserting contract details (auth, schemas, error codes) absent from any formal spec or confirmed sample.
- Silently choosing between conflicting specs without a `DBT-`.
- Marking an integration as low-criticality without evidence.
- Authoring security controls for integrations — refer auth to Security Agent.
- Treating a Postman collection as authoritative when an OpenAPI spec is also available (always flag the two sources and ask if they conflict).
