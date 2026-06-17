# DAQ REGISTER - INSUREEDGE-2026

> Owned by the Chief Orchestrator. Written to by all agents. Nothing is ever deleted; closure is by state change only.

**Engagement:** InsureEdge Application Modernization
**Source Platform:** OutSystems
**Started:** 2026-06-16 17:59:37 +05:30
**Phase:** TRANSFER — COMPLETE. Awaiting IP Transfer sign-off (ART-5-010 §6).
**MRS (final):** 85.5 / 100

## OPEN BLOCKING ITEMS

_(none)_

## ASSUMPTIONS (ASM-)

| ID | Phase | RaisedBy | Statement | Materiality | Confidence | State | ProposedDefault | Resolution |
|---|---|---|---|---|---|---|---|---|
| INSUREEDGE-2026-ASM-0-0001 | DISCOVER | Chief Orchestrator | User requested /Input, but configured engagement artifacts are under Project-Template/Inputs. | MINOR | HIGH | OPEN | Use Project-Template/Inputs as inputRoot per project.config.yaml. | Pending human confirmation; non-blocking. |

## QUESTIONS (QST-)

| ID | Phase | RaisedBy | Statement | Materiality | Blocking | Impacts | ProposedDefault | State |
|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | - |

## RISKS (RSK-)

| ID | Phase | RaisedBy | Statement | Likelihood | Impact | Mitigation | State |
|---|---|---|---|---|---|---|---|
| INSUREEDGE-2026-RSK-0-0001 | DISCOVER | Discovery Agent | No dedicated OpenAPI/Postman/WSDL artifacts were found. | Medium | Medium | Integration Agent extracts from OML/OAP/OutDoc and requests specs if needed. | OPEN |
| INSUREEDGE-2026-RSK-0-0002 | DISCOVER | Discovery Agent | No dedicated runtime logs or environment configs were found. | High | Medium | Runtime scope waived by human (DEC-0-0003). Runtime category retained at floor score. | WAIVED |
| INSUREEDGE-2026-RSK-0-0003 | DISCOVER | Chief Orchestrator | Requested path and configured path differ. | Low | Low | Use configured inputRoot and keep the assumption visible. | OPEN |

## DECISIONS (DEC-)

| ID | Phase | DecidedBy | Statement | Rationale | Resolves | Timestamp |
|---|---|---|---|---|---|---|
| INSUREEDGE-2026-DEC-0-0001 | DISCOVER | Chief Orchestrator | Engagement started. Project Context bound. Phase: DISCOVER. | User invoked Chief Orchestrator for InsureEdge. | - | 2026-06-16 17:59:37 +05:30 |
| INSUREEDGE-2026-DEC-0-0002 | DISCOVER | Chief Orchestrator | DISCOVER gate passed; phase advanced to SCAN. | MRS 61.4 meets threshold 60 and no blocking items are open. | DISCOVER exit gate | 2026-06-16 17:59:37 +05:30 |
| INSUREEDGE-2026-DEC-0-0003 | DISCOVER | Human | Runtime logs and environment configs are out of scope for this engagement. | Human decision: "We don't need runtime reports for this project." | QST-0-0002 (runtime) | 2026-06-16 |
| INSUREEDGE-2026-DEC-0-0004 | DISCOVER | Human | Database files confirmed as SQL DDL scripts (SQL Server format, 118 CREATE TABLE statements). | Human confirmed database file format as .txt SQL scripts. | QST-0-0005 (data format) | 2026-06-16 |
| INSUREEDGE-2026-DEC-0-0005 | DISCOVER | Chief Orchestrator | MRS revised to 70.5 after new artifacts: DDL scripts, roles_permissions.md, API integration confirmation. DISCOVER gate remains PASSED. | New evidence materially improves data (+0.71), security (+1.34), API (+0.68) scores. | MRS revision | 2026-06-16 |
| INSUREEDGE-2026-DEC-1-0001 | SCAN | Chief Orchestrator | SCAN gate PASSED. MRS 79.2. Zero open blocking doubts. | 5 SCAN agents completed. All required deliverables produced. | SCAN exit gate | 2026-06-16 |
| INSUREEDGE-2026-DEC-5-0001 | TRANSFER | Chief Orchestrator | TRANSFER complete. 9 ART-5 artifacts produced (deployment runbook, support runbook, knowledge transfer, source code handover, decommission checklist, IP transfer + 3 Documentation Agent deliverables). 8 [HUMAN GATE] steps in deployment runbook. 11 [HUMAN GATE] steps in decommission checklist. 52 AI_GENERATED artifacts inventoried for ENGINEER_IMPLEMENTED sign-off. Engagement ready for final human sign-off. | Transfer Agent + Documentation Agent. | TRANSFER exit | 2026-06-17 |
| INSUREEDGE-2026-DEC-4-0001 | FORGE | Chief Orchestrator | FORGE complete. 10 ART- deliverables produced: repository structure, domain models, API specs, component specs, infrastructure specs, migration scripts, test specs, deployment specs, test strategy, coverage matrix. 19 DBT- items raised (10 blocking, resolved via TRANSFER Clarification Round). 27 HUMAN_VALIDATION_REQUIRED sections. 85% P1 traceability (3 stories provisional on open contracts). | Forge Agent + QA Agent. FORGE → TRANSFER. | FORGE exit | 2026-06-17 |
| INSUREEDGE-2026-DEC-3-0003 | IDEATE | Human | Architecture Gate APPROVED. Phase advanced to FORGE. | Human approved all 10 ADRs, 11-artifact IDEATE package, MRS 85.5. | Arch Gate / FORGE entry | 2026-06-17 |
| INSUREEDGE-2026-DEC-3-0002 | IDEATE | Chief Orchestrator | IDEATE complete. 11 ART- deliverables produced across Architecture Agent (7 files: ADRs, C4, frontend, backend, infra, observability, CI/CD, TAD) and Migration Agent (3 files: data migration arch, migration strategy, cutover strategy). Architecture Gate package assembled and presented for human decision. | 10 ADRs, 3 DBT- items, 5 FORGE-blocking open items identified, 10 migration QSTs. | IDEATE exit / Arch Gate | 2026-06-17 |
| INSUREEDGE-2026-DEC-3-0001 | IDEATE | Human | Target technology stack confirmed: Backend = .NET/C# (ASP.NET Core), Frontend = React (TypeScript), Database = PostgreSQL (Azure Database for PostgreSQL), CI/CD = GitHub Actions, Cloud = Azure (all tiers). | Human selected stack for IDEATE precondition. Architecture Agent may now proceed. | Technology stack DEC | 2026-06-17 |
| INSUREEDGE-2026-DEC-2-0005 | HARVEST | Human | PRD Gate APPROVED. Phase advanced to IDEATE. Six human decisions recorded in this entry: (1) TranzPay production URL — skip/deferred; (2) 3 SharePoint docs now available as .txt — read and indexed; (3) RPS/PostGIS — Azure-hosted; (4) Performance SLA — 100 concurrent users, fast response target; (5) Availability SLA — no specific targets, no need to worry; (6) Deployment environment confirmed as Azure (from Architecture Document). | Human approved PRD gate and answered all pending QSTs in one message. | PRD gate / IDEATE entry | 2026-06-17 |
| INSUREEDGE-2026-DEC-2-0004 | HARVEST | Chief Orchestrator | Extended HARVEST pass complete. ART-2-011 (logic supplement) and ART-2-012 (integration/arch supplement) produced. QST-1-LOGIC-001 CLOSED. QST-1-INT-001 ANSWERED (TranzPay contract resolved — production URL still outstanding as QST-2-INT-001, blocks FORGE not PRD gate). RPS documented as new integration INT-011. MRS revised to 85.5. | 12 new evidence items (EV-0-0254 to EV-0-0263). 22 new business rules. 5 new data risks. 10 new integration risks. 11 new QSTs raised (none blocking PRD gate). | Extended HARVEST pass | 2026-06-17 |
| INSUREEDGE-2026-DEC-2-0003 | HARVEST | Human | Added 22 new architectural artifacts: TranzPay TID (resolves QST-1-INT-001), Domain Architecture, both ERDs, DisburseCloud API docs, endorsement payment docs, rating workbook (resolves QST-1-LOGIC-001), state tax matrix. 3 SharePoint URLs require authenticated access. | Human dropped artifacts mid-HARVEST before gate decision. | EV-0-0232 to EV-0-0253 | 2026-06-17 |
| INSUREEDGE-2026-DEC-2-0002 | HARVEST | Chief Orchestrator | HARVEST complete. 10 ART- deliverables produced. PRD Gate package assembled and presented for human decision. | BA: 65 stories, 115 AC, 5 artifacts. PM: 27 capabilities, PRD + NFR catalog, WHAT/HOW neutrality PASS. | HARVEST exit / PRD Gate | 2026-06-17 |
| INSUREEDGE-2026-DEC-2-0001 | HARVEST | Human | SCAN gate APPROVED. Phase advanced to HARVEST. | Human approved SCAN deliverables and MRS 82.5. | SCAN exit / HARVEST entry | 2026-06-17 |
| INSUREEDGE-2026-DEC-1-0003 | SCAN | Chief Orchestrator | MRS revised to 82.5 after site properties. API quality 72%→92% (8/10 contracts resolved). Logic quality 85%→88% (timer thresholds confirmed HIGH). | EV-0-0231 closes QST-1-LOGIC-002, QST-1-LOGIC-004, QST-1-INT-002, QST-1-INT-003. | MRS revision post-site-properties | 2026-06-16 |
| INSUREEDGE-2026-DEC-1-0002 | SCAN | Human | Site properties supplied. Resolves: LenderDock auth (Basic auth, provider 2), IEDocumentGenerator = Plumsail API, DisburseCloud URL + keys confirmed, SMTP = Office365 (smtp.office365.com:587/TLS), Azure Blob = insureedgeieapplication/insuredgedev, timer thresholds confirmed, Google Maps/Geocode API keys confirmed, Base64Key confirmed, TranzPay marked as placeholder. | Human supplied full OutSystems site property export. | QST-1-INT-001(partial), QST-1-INT-002, QST-1-INT-003, QST-1-INT-004(partial), QST-SMTP | 2026-06-16 |

## PHASE GATE LOG

| Phase | Gate | MRS | Open Blocking | Status | DEC-Ref | Timestamp |
|---|---|---:|---:|---|---|---|
| DISCOVER | Exit | 70.5 (revised) | 0 | PASSED | INSUREEDGE-2026-DEC-0-0002, DEC-0-0005 | 2026-06-16 |
| SCAN | Exit | 79.2 | 0 | PASSED | INSUREEDGE-2026-DEC-1-0001 | 2026-06-16 |
| SCAN (post-site-properties) | Revised | 82.5 | 0 | PASSED | INSUREEDGE-2026-DEC-1-0003 | 2026-06-16 |
| HARVEST | Entry | 82.5 | 0 | IN PROGRESS | INSUREEDGE-2026-DEC-2-0001 | 2026-06-17 |
| HARVEST | Exit / PRD Gate | 85.5 | 0 | PASSED | INSUREEDGE-2026-DEC-2-0005 | 2026-06-17 |
| IDEATE | Entry | 85.5 | 0 | IN PROGRESS | INSUREEDGE-2026-DEC-2-0005 | 2026-06-17 |
| IDEATE | Exit / Arch Gate | 85.5 | 0 | PASSED | INSUREEDGE-2026-DEC-3-0003 | 2026-06-17 |
| FORGE | Entry | 85.5 | 0 | IN PROGRESS | INSUREEDGE-2026-DEC-3-0003 | 2026-06-17 |
| FORGE | Exit | 85.5 | 0 | COMPLETE | INSUREEDGE-2026-DEC-4-0001 | 2026-06-17 |
| TRANSFER | Entry | 85.5 | 0 | IN PROGRESS | INSUREEDGE-2026-DEC-4-0001 | 2026-06-17 |
| TRANSFER | Exit | 85.5 | 0 | COMPLETE — AWAITING FINAL SIGN-OFF | INSUREEDGE-2026-DEC-5-0001 | 2026-06-17 |

## MRS HISTORY

| Phase | MRS | Open Blocking | Open CRITICAL ASM | Timestamp |
|---|---:|---:|---:|---|
| DISCOVER | 61.4 | 0 | 0 | 2026-06-16 17:59:37 +05:30 |
| DISCOVER (revised) | 70.5 | 0 | 0 | 2026-06-16 |
| SCAN | 79.2 | 0 | 0 | 2026-06-16 |
| SCAN (post-site-properties) | 82.5 | 0 | 0 | 2026-06-16 |
| HARVEST (extended pass) | 85.5 | 0 | 0 | 2026-06-17 |

## EVIDENCE POOL INDEX

| EV-ID | sourceArtifact | locus | domainTags | form | confidence |
|---|---|---|---|---|---|
| INSUREEDGE-2026-EV-0-0001 | Database\SHIFT_Insureedge_DEV | file | data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0002 | Database\SHIFT_Insureedge_SYSTEM_DEV | file | data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0003 | Logic\00_INDEX.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0004 | Logic\01_Clients.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0005 | Logic\02_Accounts.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0006 | Logic\03_Policy.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0007 | Logic\04_Claims.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0008 | Logic\05_Billing.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0009 | Logic\06_Distribution.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0010 | Logic\07_Groups.md | file | logic, workflow, security, role | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0011 | Logic\08_UserManagement.md | file | logic, workflow, security, role | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0012 | Logic\09_Common.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0013 | Logic\10_Reports.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0014 | Logic\11_HexCat.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0015 | Logic\12_RatingEngine.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0016 | Logic\13_ProductManagement.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0017 | Logic\14_Portal.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0018 | Logic\15_Emails.md | file | logic, workflow, api | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0019 | Logic\16_DocumentGenerator.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0020 | Logic\17_LogEngine.md | file | logic, workflow | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0021 | OutSystems\SHIFT - InsureEdge\Claims\Outdoc\OutDoc - eSpace Claims.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0022 | OutSystems\SHIFT - InsureEdge\Claims\Outdoc\OutDoc - eSpace IE_Claims_BL.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0023 | OutSystems\SHIFT - InsureEdge\Claims\Outdoc\OutDoc - eSpace IE_Claims_CS.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0024 | OutSystems\SHIFT - InsureEdge\Claims\Outdoc\OutDoc - eSpace IE_Common_CW.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0025 | OutSystems\SHIFT - InsureEdge\Claims\Outdoc\OutDoc - eSpace IE_DisburseCloud.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0026 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\DistributionManagement.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0027 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_Common_BL.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0028 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_Common_CS.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0029 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_Common_CW.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0030 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_DisburseCloud.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0031 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_DistributionManagement_BL.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0032 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_DistributionManagement_CS.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0033 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\IE_DistributionManagement_Lib.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0034 | OutSystems\SHIFT - InsureEdge\Distribution Management\OML\InsureEdgeEmail.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0035 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace DistributionManagement.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0036 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_Common_BL.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0037 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_Common_CS.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0038 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_Common_CW.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0039 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_DisburseCloud.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0040 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_DistributionManagement_BL.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0041 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_DistributionManagement_CS.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0042 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace IE_DistributionManagement_Lib.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0043 | OutSystems\SHIFT - InsureEdge\Distribution Management\OutDoc\OutDoc - eSpace InsureEdgeEmail.html | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0044 | OutSystems\SHIFT - InsureEdge\Distribution Management\UI Scrapping\Distribution Management_UI_Scrapping.pdf | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0045 | OutSystems\SHIFT - InsureEdge\Group Management\Outdocs\OutDoc - eSpace GroupManagement.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0046 | OutSystems\SHIFT - InsureEdge\Group Management\Outdocs\OutDoc - eSpace IE_Groups_BL.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0047 | OutSystems\SHIFT - InsureEdge\Group Management\Outdocs\OutDoc - eSpace IE_Groups_CS.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0048 | OutSystems\SHIFT - InsureEdge\Group Management\Web Scrape PRD\UserGroupManagement.md | file | ui, logic, nfr, security, role | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0049 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\AppendAdditonalInsured.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0050 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\AppendAdditonalOrg.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0051 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\AppendPolicyMortgage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0052 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\AutomaticRenewalNotificationEmail.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0053 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\BulkUpload_Quotes_HB.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0054 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\BulkUploadBusinessSubmissions.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0055 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CancellationDueToNoPayment_BL.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0056 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\ChargeInsured.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0057 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CheckandUpdateBoundPaymentTransaction.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0058 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CheckIfAnyBoundPolicyExists.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0059 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CommissionsDetails_ENdorsements.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0060 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateCancelRewritePolicy.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0061 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateEndorsementPaymentTransactionAnualPayNow.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0062 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateEndorsementPolicyQuote.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0063 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateorUpdateHBIScommissiondetails_BL.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0064 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateorUpdateHBIScommissiondetailsEndorsements_BL.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0065 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateorUpdateHBISRiskInformationsNew3.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0066 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreatePolicies2.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0067 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreatePolicyNumber_HB.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0068 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\CreateRiskLocations3.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0069 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Execute_BulkUpload.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0070 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\FailedNotificationLenderdock2.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0071 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateNewBusinessHBISPolicyNumber.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0072 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateNoticeOfNonRenewalDocument.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0073 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateRenewalPolicyQuotes_ByPolicyID.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0074 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateRenewalPolicyQuotes_New.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0075 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateRenewalPolicyQuotesForManually.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0076 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateRenewalPolicyQuotesSingle.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0077 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GenerateUWSpecificDocument.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0078 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetAlreadyPaidTransactionValues.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0079 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetCommissiondetailsForHb.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0080 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetCustomerDetailsByPolicyIdForRenewal.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0081 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_DeclarationPage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0082 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_NoticeOfCancellation.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0083 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_NoticeOfCancellationNew.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0084 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_NoticeOfPolicyChange.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0085 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_UWSpecificChangeEndorsement.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0086 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetJSON_UWSpecificChangeForBusinessPackage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0087 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetLatestPolicyNoforPolicy.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0088 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetLimitsandCoverages.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0089 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetNoticeOfNonRenewalInfo.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0090 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetPolicyProductInformation.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0091 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetPriorPolicyTransactionAnnual.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0092 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetStaticDocument_PrivateForBusinessPackage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0093 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetStaticDocument_ScheduledOfInsurers.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0094 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\GetUWSpecificChangeDetails.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0095 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\InitiateProcess_NewBusinessPolicyPackage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0096 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\InitiateProcess_QuoteProposalPackage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0097 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\InitiateProcess_RenewalPolicyPackage.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0098 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsAdditionalInsuredValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0099 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsAdditionalOrgValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0100 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsAddressValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0101 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsContactInfoValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0102 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsLimitsAndCoverageValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0103 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IsMortgageValid.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0104 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IssueEndorsementAnual.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0105 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IssueEndorsementMonthlyRefunds.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0106 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\IssueEndorsementNoChangePremium.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0107 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\NoticeOfNonRenewalEmail.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0108 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Notify_Mortgage_LenderDock.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0109 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Notify_MortgageBillLenderDock.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0110 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\RenewalDraftProducerNotificationEmail.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0111 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\RetrunFundsInsured.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0112 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155645.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0113 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155821.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0114 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155850.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0115 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155911.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0116 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155933.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0117 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 155952.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0118 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 160011.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0119 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 160033.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0120 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 160048.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0121 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 160110.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0122 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162206.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0123 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162229.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0124 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162245.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0125 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162324.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0126 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162343.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0127 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 162400.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0128 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 174806.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0129 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 174908.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0130 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 174949.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0131 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175018.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0132 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175042.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0133 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175106.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0134 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175137.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0135 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175246.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0136 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175319.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0137 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175337.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0138 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175417.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0139 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175614.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0140 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175637.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0141 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 175850.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0142 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 180019.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0143 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\Screenshot 2026-06-12 180047.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0144 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\SendNoticeOfNonRenewalEmail.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0145 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\SendRenewalDraftProducerEmailViaTimer.png | file | logic, workflow, ui, api | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0146 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\SetLatLongViaGeoLocation.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0147 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\timer.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0148 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\UpdateEndorsementQuoteStatusToExpired.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0149 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\UpdatePolicyStatusToActive.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0150 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\UpdatePolicyStatusToExpired.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0151 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\UpdatePolicyStatusToLapsed.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0152 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\UpdatePolicyType.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0153 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\ValidateLatLong.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0154 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\BusinessLogicScreenshots\ValidatePreviousPolicy.png | file | logic, workflow, ui | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0155 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OAP\InsureEdge2.0 Policy Core.oap | file | logic, data, api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0156 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OAP\InsureEdge2.0 Policy.oap | file | logic, data, api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0157 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OML files\IE_Policy_BL.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0158 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OML files\IE_Policy_CS.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0159 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OML files\IE_Policy_Lib.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0160 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OML files\Policy.oml | file | logic, data, api, security | structured | HIGH |
| INSUREEDGE-2026-EV-0-0161 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace GoogleAddressAutocompleteReact.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0162 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace IE_Policy_BL.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0163 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace IE_Policy_CS.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0164 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace IE_Policy_Lib.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0165 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace Lenderdock.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0166 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace Policy.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0167 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\OUTDOC\OutDoc - eSpace Tranzpay.pdf | file | logic, data, ui, api, security | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0168 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2025-08-04 170355.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0169 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 114952.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0170 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115055.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0171 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115126.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0172 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115207.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0173 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115242.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0174 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115332.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0175 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115420.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0176 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 115448.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0177 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121108.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0178 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121238.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0179 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121311.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0180 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121434.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0181 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121511.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0182 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121556.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0183 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121637.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0184 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121719.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0185 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 121937.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0186 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 122016.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0187 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 122047.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0188 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 122128.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0189 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 122156.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0190 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141120.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0191 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141202.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0192 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141235.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0193 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141451.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0194 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141518.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0195 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141550.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0196 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141616.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0197 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141648.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0198 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141717.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0199 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 141801.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0200 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 142051.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0201 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 142255.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0202 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143230.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0203 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143333.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0204 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143444.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0205 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143650.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0206 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143733.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0207 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143846.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0208 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143909.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0209 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 143958.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0210 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 144034.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0211 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 144108.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0212 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 144137.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0213 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 144205.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0214 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-12 144323.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0215 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-15 102124.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0216 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-15 102205.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0217 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\UIScreenshots\Screenshot 2026-06-15 102241.png | file | ui, design | screenshot | LOW |
| INSUREEDGE-2026-EV-0-0218 | OutSystems\SHIFT - InsureEdge\Quotes&Policies\WebScrapPRD\Q&P_Client_PRD.md | file | ui, logic, nfr | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0219 | OutSystems\SHIFT - InsureEdge\User Management\Outdocs\OutDoc - eSpace IE_UserManagement_BL.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0220 | OutSystems\SHIFT - InsureEdge\User Management\Outdocs\OutDoc - eSpace IE_UserManagement_CS.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0221 | OutSystems\SHIFT - InsureEdge\User Management\Outdocs\OutDoc - eSpace UserManagement.pdf | file | logic, data, ui, api, security, role | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0222 | OutSystems\SHIFT - InsureEdge\User Management\Web Scrape PRD\usermanagement.md | file | ui, logic, nfr, security, role | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0223 | README.md | file | logic | semi-structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0224 | Database\SHIFT_Insureedge_DEV.txt | Full SQL DDL script — SQL Server 2019, 92 CREATE TABLE statements, full column definitions, PKs, FKs, indexes | data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0225 | Database\SHIFT_Insureedge_SYSTEM_DEV.txt | Full SQL DDL script — SQL Server 2019, 26 CREATE TABLE statements, system/platform tables | data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0226 | Logic\roles_permissions.md | Full role matrix: 5 roles, 10 permission flags, 4 scope filters, group-based inheritance, permission evaluation flow, sensitive data rules | security, role | freetext | HIGH |
| INSUREEDGE-2026-EV-0-0227 | Logic\03_Policy.md — TranzPay actions (AutoDebitPaymentTranzpay, MakeTranzpayPayment) | Payment gateway integration — TranzPay | api | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0228 | Logic\03_Policy.md — LenderDock actions (Notify_Mortgage_LenderDock, NotifyLenderDockForCancelledPolicy, etc.) | Mortgage notification integration — LenderDock (5+ actions) | api | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0229 | Logic\09_Common.md — GetGeoCodeFromAddress, GetGoogleMapAPIKey | Geocoding integration — Google Maps API | api | freetext | MEDIUM |
| INSUREEDGE-2026-EV-0-0230 | Logic\09_Common.md — AES_Encrypt/Decrypt via RssExtensionCryptoAPI | Encryption extension — AES-256 CBC + HMAC-256 | security | freetext | HIGH |
| INSUREEDGE-2026-EV-0-0231 | OutSystems Site Properties (human-supplied 2026-06-16) | Full environment configuration: all site property names and values for InsureEdge DEV | api, logic, security, data, runtime | structured | HIGH |
| INSUREEDGE-2026-EV-0-0232 | IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT__Tranzpay_Payment_Integration.pdf | TranzPay payment gateway technical implementation document — resolves QST-1-INT-001 | api, logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0233 | IE-LC Dev Docs\Technical Documents\InsureEdge - Domain Architecture.pdf | InsureEdge domain architecture document — domains, boundaries, component relationships | design, logic, api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0234 | IE-LC Dev Docs\Technical Documents\InsureEdge-ERD .pdf | Full entity-relationship diagram for InsureEdge_DEV database | data, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0235 | IE-LC Dev Docs\Technical Documents\InsureEdgeSystem - ERD.pdf | Full entity-relationship diagram for InsureEdge_System_DEV database | data, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0236 | IE-LC Dev Docs\Technical Documents\DisburseCloud API Documentation.pdf | DisburseCloud commission disbursement API full documentation | api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0237 | IE-LC Dev Docs\Technical Documents\InsureEdge - Document Generation.pdf | Document generation architectural artifact — Plumsail integration, document types | api, logic, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0238 | IE-LC Dev Docs\Technical Documents\InsureEdge - Document Storage.pdf | Document storage architectural artifact — Azure Blob storage pattern | api, data, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0239 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Login Machanism & Personas.pdf | Login mechanism and personas architectural artifact | security, role, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0240 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Audit Logs.pdf | Audit log architectural artifact — structure, retention, triggers | logic, security, data, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0241 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Bulk Quote Upload.pdf | Bulk quote upload architectural artifact — flow, validation, error handling | logic, ui, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0242 | IE-LC Dev Docs\Technical Documents\Product_Overview.pdf | InsureEdge product overview document | logic, ui, design | structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0243 | IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT__RPS_(Risk_to_Potential_Structures)_Integration_using_PostgreSQLPostGIS__OutSystems.pdf | RPS (Risk to Potential Structures) integration — PostGIS/geospatial data integration | api, data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0244 | IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT_Document_Storage_azure_blob.pdf | Azure Blob document storage technical implementation | api, data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0245 | IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT_Quotes_Bulk_Upload_for_HB.pdf | Bulk quotes upload for Hudson Bailey — technical implementation | logic, ui | structured | HIGH |
| INSUREEDGE-2026-EV-0-0246 | IE-LC Dev Docs\Technical Documents\IE-LC Software Architecture Document.docx.url | Software Architecture Document (SharePoint link — requires authenticated access) | design | url | UNKNOWN |
| INSUREEDGE-2026-EV-0-0247 | IE-LC Dev Docs\Technical Documents\IE-LC System Design Document.docx.url | System Design Document (SharePoint link — requires authenticated access) | design | url | UNKNOWN |
| INSUREEDGE-2026-EV-0-0248 | IE-LC Dev Docs\Technical Documents\IE-LC Technical Specification & developer guide.docx.url | Technical Specification & Developer Guide (SharePoint link — requires authenticated access) | logic, design | url | UNKNOWN |
| INSUREEDGE-2026-EV-0-0249 | IE-LC Dev Docs\Endorsement Payments\Premium Bearing Endorsement Requirements_Final.pdf | Premium bearing endorsement requirements — payment calculations, scenarios | logic, api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0250 | IE-LC Dev Docs\Endorsement Payments\Effect of non-premium bearing endorsement on the UW Specific Change Document_Scenarios.pdf | Non-premium bearing endorsement scenarios — document generation impact | logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0251 | IE-LC Dev Docs\Endorsement Payments\Flow Diagram Endorsement Add payments.png | Endorsement payment flow diagram | logic, workflow | screenshot | HIGH |
| INSUREEDGE-2026-EV-0-0252 | Logic\Rater Functionality\09-11-2025 Hudson Bailey Homeowers SuperPerils rater (2).xlsx | Hudson Bailey Homeowners SuperPerils rating workbook — premium calculation formula, factors, tables | logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0253 | Logic\Rater Functionality\State tax matrix_v2.xlsx | State tax matrix — tax rates by state for premium calculation | logic, data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0254 | IE-LC Dev Docs\Endorsement Payments\Premium Bearing Endorsement Requirements_Final.pdf | Premium bearing endorsement requirements — HB UW authority tiers, payment calc, return premium flows | logic, api | structured | HIGH |
| INSUREEDGE-2026-EV-0-0255 | IE-LC Dev Docs\Endorsement Payments\Effect of non-premium bearing endorsement on the UW Specific Change Document_Scenarios.pdf | Non-premium bearing endorsement scenarios — 11 change types, cumulative UW Specific Change Document | logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0256 | IE-LC Dev Docs\Endorsement Payments\Flow Diagram Endorsement Add payments.png | Endorsement payment decision flow diagram | logic, workflow | screenshot | HIGH |
| INSUREEDGE-2026-EV-0-0257 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Audit Logs.pdf | Audit log architecture — 10-field schema, universal module scope | logic, security, data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0258 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Bulk Quote Upload.pdf | Bulk quote upload architecture — async timer flow, Geocode + Rating + HexCat pipeline | logic, workflow | structured | HIGH |
| INSUREEDGE-2026-EV-0-0259 | IE-LC Dev Docs\Technical Documents\InsureEdge - Architectural Artifacts Login Machanism & Personas.pdf | Login mechanism and 5-tier persona architecture — Platform Admin through Adjuster | security, role | structured | HIGH |
| INSUREEDGE-2026-EV-0-0260 | IE-LC Dev Docs\Technical Documents\InsureEdge - Document Generation.pdf | Document generation architecture — Plumsail template → meta model → 8 document types | api, logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0261 | IE-LC Dev Docs\Technical Documents\InsureEdge - Document Storage.pdf | Document storage — Azure Blob path format: ClientCode/Module/BinRecordId/Filename | api, data | structured | HIGH |
| INSUREEDGE-2026-EV-0-0262 | IE-LC Dev Docs\Technical Documents\TECHNICAL_IMPLEMENTATION_DOCUMENT_Quotes_Bulk_Upload_for_HB.pdf | Bulk upload TID — async timer flow, validation pipeline, error handling | logic, ui | structured | HIGH |
| INSUREEDGE-2026-EV-0-0264 | IE-LC Dev Docs\Technical Documents\IE-LC Software Architecture Document.docx.txt | Software Architecture Document — multi-tenant SaaS, O11 platform, 4-env pipeline (Dev→QA→UAT→Prod via LifeTime), cloud-hosted OutSystems PaaS, module list, security model | design, logic | structured | HIGH |
| INSUREEDGE-2026-EV-0-0265 | IE-LC Dev Docs\Technical Documents\IE-LC System Design Document.docx.txt | System Design Document — Organizations table schema, module descriptions, operation flows, business rules, dependencies | data, logic, design | structured | HIGH |
| INSUREEDGE-2026-EV-0-0266 | IE-LC Dev Docs\Technical Documents\IE-LC Technical Specification & developer guide.txt | Technical Spec & Developer Guide — BL/CS naming conventions, coding standards, deployment via LifeTime, debugging, known issues | logic, design | structured | MEDIUM |
| INSUREEDGE-2026-EV-0-0263 | IE-LC Dev Docs\Technical Documents\Product_Overview.pdf | InsureEdge product overview — domain map, module descriptions | logic, ui | structured | MEDIUM |
