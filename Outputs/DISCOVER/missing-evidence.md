# ART-0-003 Missing Evidence Register

## Open Questions

No CRITICAL blocking discovery questions are open. Data and Logic both have primary or strong evidence coverage.

## Non-Blocking Risks

| ID | Statement | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| INSUREEDGE-2026-RSK-0-0001 | No dedicated OpenAPI/Postman/WSDL artifacts were found. | Medium | API and integration findings may be MEDIUM confidence until OML/OutDoc extraction confirms endpoints. | During SCAN, Integration Agent must extract integrations from OML/OAP/OutDoc and request API specs if gaps remain. |
| INSUREEDGE-2026-RSK-0-0002 | No dedicated runtime logs or environment configs were found. | High | Runtime behavior, volumes, errors, and scheduling may be under-evidenced. | Request logs/configs before FORGE or mark runtime behavior as assumptions. |
| INSUREEDGE-2026-RSK-0-0003 | Input root requested as /Input, but artifacts were found under Project-Template/Inputs. | Low | Future runs may miss artifacts if paths diverge. | Bound this engagement to Project-Template/Inputs per project.config.yaml. |
