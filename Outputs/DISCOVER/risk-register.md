# ART-0-005 Initial Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | State |
|---|---|---|---|---|---|
| INSUREEDGE-2026-RSK-0-0001 | API specs are not available as dedicated artifacts. | Medium | Medium | Extract from OML/OAP/OutDoc during SCAN; request specs if endpoint coverage is incomplete. | OPEN |
| INSUREEDGE-2026-RSK-0-0002 | Runtime logs/configuration are absent. | High | Medium | Ask for logs/configs before runtime-sensitive reconstruction and testing. | OPEN |
| INSUREEDGE-2026-RSK-0-0003 | Requested /Input path differs from configured Project-Template/Inputs path. | Low | Low | Record path binding decision and continue using project.config.yaml. | OPEN |
