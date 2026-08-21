# `BootstrapHRHexzones` — Action Documentation (Reverse-Engineered)

**Module:** IERatingEngine (Server Actions)
**Sources:** Service Studio screenshots (flow, SQL node, aggregate, ConvertFromExcel, Assign, Create node), `OutDoc - eSpace IERatingEngine.pdf` (decoded), `Input/HRHexzones.xlsx` (verified live)
**Last modified (original):** mukuls@damcogroup.com, 23-12-2025 21:22

---

## 1. Purpose

OutDoc description: *"Populates the database with the hr hexzones from the excel file if the corresponding database table is still empty."*

Seeds the `HBRater_HRHexzone` rate table (high-risk hex-zone catastrophe rates: Hurricane per 1000, Tornado, Hail) from the module resource `HRHexzones.xlsx`.

## 2. Parameters

| Kind | Name | Type | Notes |
|---|---|---|---|
| Input | — | — | None visible in screenshots or OutDoc |
| Output | — | — | None visible in screenshots or OutDoc |

## 3. Local Variables

| Name | Data Type | Notes |
|---|---|---|
| `HRHexzoneRecord` | `HBRater_HRHexzone Record` | Holds one row during the Cycle; single attribute `HBRater_HRHexzone` (entity record, not mandatory, no default) |

## 4. Structures Used

**`Excel_HRHexzones`** (ConvertFromExcel record definition) — per OutDoc §3.3.3:

| Attribute | Type |
|---|---|
| HRHexzones | Text(50) |
| Hurricanerateper1000 | Decimal(37,8) |
| Wildfire | Decimal(37,8) |
| Tornado | Decimal(37,8) |
| Hail | Decimal(37,8) |

## 5. Database Entity

**`HBRater_HRHexzone`** (external entity, InsureEdgeDB extension) — attributes per entity screenshot:

| Attribute | Notes |
|---|---|
| Id | PK |
| HRHexzones | Hex-zone identifier (H3 index string, e.g. `8526428ffffffff`) |
| Hurricanerateper1000 | Hurricane rate per 1000 |
| Tornado | Tornado rate |
| Hail | Hail rate |
| CreatedBy / CreatedOn / UpdatedBy / UpdatedOn | Audit columns |

> ⚠️ The entity has **no `Wildfire` attribute** — see §11 finding 1.

## 6. Aggregates

**`GetHRHexzones`** — Source: `HBRater_HRHexzone`; no filters, no sorting, no Max Records, no cache/timeout. Used solely for the `List.Empty?` check.

## 7. SQL Queries

**`SQL1`** — Statement: `Delete From {HBRater_HRHexzone}` — no parameters, no timeout/cache/max-records. Executed on the **False** branch of `GetHRHexzones.List.Empty?` (i.e., when the table already HAS rows).

## 8. Excel Conversion

**`ConvertFromExcel`** (Excel To Record List):
- Record Definition: `Excel_HRHexzones`
- File Content: `Resources.HRHexzones_xlsx.Content` (module resource)
- Sheet Name: `"Sheet1"`

Verified against `Input/HRHexzones.xlsx`: single sheet `Sheet1`, **30,941 data rows**, header columns `HR Hexzones`, `Hurricane rate per 1000`, `Wildfire`, `Tornado`, `Hail` (values: H3 hex string + four decimal rates; many rates are 0).

## 9. Assignments (`Assign HRHexzoneRecord`, inside the Cycle)

| Target | Value |
|---|---|
| `HRHexzoneRecord.HBRater_HRHexzone.HRHexzones` | `ConvertFromExcel.Current.Excel_HRHexzones.HRHexzones` |
| `HRHexzoneRecord.HBRater_HRHexzone.Hurricanerateper1000` | `ConvertFromExcel.Current.Excel_HRHexzones.Hurricanerateper1000` |
| `HRHexzoneRecord.HBRater_HRHexzone.Tornado` | `ConvertFromExcel.Current.Excel_HRHexzones.Tornado` |
| `HRHexzoneRecord.HBRater_HRHexzone.Hail` | `ConvertFromExcel.Current.Excel_HRHexzones.Hail` |
| `HRHexzoneRecord.HBRater_HRHexzone.CreatedOn` | `CurrDateTime()` |

> Note: `Wildfire` is present in the Excel struct but is **not assigned** to the entity record. `CreatedBy` is **not assigned**.

## 10. Full Step-by-Step Flow

```
Start
└─ GetHRHexzones (Aggregate on HBRater_HRHexzone)
   └─ If: GetHRHexzones.List.Empty?
      ├─ False ─→ SQL1: Delete From {HBRater_HRHexzone} ─→ End
      └─ True  ─→ ConvertFromExcel (HRHexzones.xlsx / "Sheet1" → Excel_HRHexzones list)
                  └─ Cycle over ConvertFromExcel list:
                     ├─ Assign HRHexzoneRecord (5 assignments, §9)
                     └─ CreateHBRater_HRHexzone (Run Server Action,
                        Action = CreateHBRater_HRHexzone, Source = HRHexzoneRecord)
                     └─ (back to Cycle)
                  └─ Cycle exhausted ─→ End
```

**Entity writes:** `CreateHBRater_HRHexzone` (entity Create action) per row — ~30,941 inserts on first run. `SQL1` performs a bulk DELETE of all rows.

**Server/Service actions called:** only the entity CRUD wrapper `CreateHBRater_HRHexzone`. No LogMessage, no external calls.

**Exception handling:** none visible — no `AllExceptions` handler appears on the captured canvas.

## 11. Findings / Anomalies (captured exactly, flagged for confirmation)

1. **Wildfire column dropped.** The Excel and the `Excel_HRHexzones` struct carry a `Wildfire` rate, but the `HBRater_HRHexzone` entity has no such attribute and the Assign doesn't map it. Wildfire appears to be handled by the separate `HBRater_RatingWildfire` entity (`State`, `K8`) instead.
2. **Inverted empty-check semantics vs. the other bootstraps.** In `BootstrapExcessFloodCoverages`, table-not-empty → plain End. Here, table-not-empty → **DELETE all rows → End (no re-seed)**. Net effect across runs: run 1 seeds (empty→insert), run 2 wipes (not-empty→delete), run 3 re-seeds… If the OutSystems bootstrap runs once per publish this behaves as "refresh on alternate publishes" — which looks like a defect or a manual-refresh trick in the original. **Needs your confirmation before implementation:** replicate literally, or use the safe interpretation (delete-then-reseed in one run, or seed-only-when-empty)?
3. `CreatedBy` is never populated (rows will have NULL creator); `CreatedOn` is set explicitly rather than relying on a DB default.
4. No exception handling and no batching — 30,941 row-by-row creates in a single flow.

## 12. Not Visible / Not Verified

- Whether the flow's `SQL1` False-branch behavior is intentional (see finding 2).
- Entity attribute data types beyond names (external entity; assumed Text(50) for HRHexzones and Decimal(37,8) for the three rates, matching the Excel struct).
- Any timer/publish trigger wiring for when this bootstrap executes (OutDoc lists it as a plain Server Action; the caller was not captured).
