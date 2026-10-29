# BulkUpload Backend PRD — Reverse-Engineering Document

**Module:** `IE_Policy_BL` (PolicyBL) — folder `HBIS`
**Environment:** DEV — damco-dev.outsystemsenterprise.com (Service Studio 11.55.78)
**Target action:** `BulkUploadBusinessSubmissions` (Server Action)
**Captured:** 10-Jul-2026, read-only reverse engineering (no code modified, nothing published)

---

## 1. Overview

The Bulk Upload Business functionality converts rows of an uploaded submission spreadsheet (staged as JSON in the `BulkUploadDump` entity) into fully-formed Homeowner/HBIS insurance quotes. For each row it:

1. Validates the whole record (form, names, addresses, contacts, limits).
2. Resolves lookup/enum values (products, insured types, building attributes, coverage options).
3. Geocodes addresses (Google Geocode API) and computes H3 hex zones (H3Ext extension).
4. Creates the Policy (quote), Account, Contacts, Risk Location, Risk Information, Mortgages and Limits & Coverages records.
5. Rates the policy through the IERatingEngine (`RaterForBulkUpload`) and stores premium values.
6. Marks the quote's wizard progress (`LastStep`) and returns Success/ErrorMessage/QuoteNumber.

The action is transactional: any unhandled exception aborts the transaction; any validation failure short-circuits before any database write.

---

## 2. Entry Point / Call Chain (top-down)

```
UI (file upload, other module)  →  BulkUploadAudit ("In-Progress") + BulkUploadDump rows (ColJSON per Excel row)
        │
Execute_BulkUpload (IE_Policy_BL, Public)
        │  LaunchBulkUploadQuotes(AuditId)          [BulkUploadQuotes module/BPT process]
        │  UpdateBulkUploadAuditProcessID(ProcessId, AuditId)   [BulkUploadAudit module]
        ▼
BulkUpload_Quotes_HB (IE_Policy_BL, Public)  ← the batch orchestrator
        │  gate: Site.BulkUploadTimerEnable (site property; False → LogMessage → End)
        │  GetBulkUploadFiles  (Aggregate: BulkUploadAudit, Status="In-Progress" and
        │                       Id=LongIntegerToIdentifier(AuditId), Max 1, sort UploadedOn DESC)
        │  GetRecords          (Aggregate: BulkUploadDump, BulkUploadAuditId=file.Id,
        │                       IsProcessed=False, Max 100)
        │  For each record (cycle):
        │     QuoteRecord = JSON-Deserialize(BulkUploadDump.ColJSON → BusinessSubmissionStructure)
        │     ► BulkUploadBusinessSubmissions(QuoteRecord.Data,
        │            UserId = LongIntegerToIdentifier(file.UploadedBy))
        │     on failure: Dump.IsProcessed=True, Status="Failed", UpdatedOn=CurrDateTime(),
        │                 Errors=BulkUploadBusinessSubmissions.ErrorMessage
        │     CommitTransaction per record; BulkUpload\CreateUpdateBulkAuditDump(record)
        │  After batch: GetRemainingRecordsCount (Sum where IsProcessed=False),
        │               CheckTheStatus (Sum(IsSuccess) where IsProcessed, Max 1),
        │               RemainingRecords > 0 → loop again / else
        │               BulkUpload\CreateUpdateBulkUploadAudit(file) + LogMessage2
        ▼
BulkUploadBusinessSubmissions   ← the action documented in detail below
```

---

## 3. BulkUploadBusinessSubmissions — Interface

Properties: Public=No, Function=No, Description empty. Flow contains **123 elements**.

### 3.1 Input Parameters

| Name | Data Type | Mandatory | Default |
|---|---|---|---|
| BusinessSubmissionStructure | `BusinessSubmissionStructure` (structure — one spreadsheet row: EffectiveDate, TypeofPrimaryInsured, FirstName, MiddleName_Initial, LastName, Areyou65orOlder, OrganizationName, DoingBusinessAs, AddressLine1/2 (mailing), AddressLine3/4 (risk), City/City2, State/State2, ZipCode/ZipCode2, County/County2, Latitude/Longitude(+2), AddresssameasMailingAddress, TelephoneNumber_1, AlternateTelephoneNumber1, EmailID, Extension_XXXXXX, DwellingAssetLimit, PhysicalDamageDeductible, AmountOfLiabilityCoverage, ExcessscheduledBlanketCoveredPersonalLiabilities, Sinkhole, Earthquake, Flood, WindCoverage, WildFire, ResidentialWorkerNofaultMedical, SmallScaleFarmingEndorsement, LandlordEndorsement, HomeOfficeEndorsement, PriorPolicyPremium, BuildingFloodElevation, BuildingType, BuildingDescription, …) | Yes | — |
| UserId | User Identifier | Yes | — |

### 3.2 Output Parameters

| Name | Data Type |
|---|---|
| Success | Boolean |
| ErrorMessage | Text |
| QuoteNumber | Text |

### 3.3 Local Variables

| Name | Data Type |
|---|---|
| PolicyStruct | InitialSubmission |
| ListofProduct | ListOfLOB List |
| Accounts | Accounts_Struct |
| ClientID | Long Integer |
| Address | Address_Struct |
| AccountContacts | Account_Contacts |
| PrimaryInsuredType | Text |
| AdditionalInsured | AdditionalNameInsured List |
| AdditionalOrganization | AdditionalOrganisation List |
| LimitsAndCoverages | LimitCoverage |
| RiskInformation | RiskInformation |
| PolicyMortgageList | MortgageInformation List |
| Location | RiskAddressStructure |
| IsValid | Boolean |

(All created by vidyas@damcogroup.com; no descriptions, no defaults except as assigned in flow.)

---

## 4. Complete Execution Flow (Start → End)

### Phase 1 — Initialization & Lookups

1. **Start**
2. **SetDefaultValues** (Assign): `IsValid = True`, `ErrorMessage = ""`.
3. **GetUserClientID** (Run Server Action `Tenant\GetUserClientID`, UserId=UserId).
4. **ClientID** (Assign): `ClientID = GetUserClientID.ClientIDBasedonTenant`.
5. **GetProducersByOsUserId** (Aggregate) — Sources `Producer` join `Intermediary` ON `Producer.IntermediaryId = Intermediary.Id` (Only With); Filters: `Producer.OsUserId = UserId`, `Producer.Status="ACTIVE"`, `Intermediary.Status = "ACTIVE"`; Sort `Producer.ProducerCode`; no Max.
6. **GetInsuranceType** (Aggregate, label "Get CompanyProductsNew") — Sources `CompanyProduct2`, `Products (Product)`, `SubProducts (Product)`; Joins: `CompanyProduct2` With-or-Without `SubProducts` ON `CompanyProduct2.ProductId = SubProducts.Id`; `SubProducts` With-or-Without `Products` ON `SubProducts.ParentProductId = Products.Id`. Group by `Value` and calculated **Key** = `If(Products.ProductType=1,"Personal Lines",If(Products.ProductType=3,"Commercial Lines","Specialty Lines"))`; group filter `Key = "Specialty Lines"`. (`Value` carries the ProductType id, e.g. 2.)
7. **GetProductsType** (Aggregate) — same sources/joins; Filter `Products.ProductType = GetInsuranceType.List.Current.Value`; output groups: ProductName, Id, ImageSVG + calc `Attribute1` (same If formula).
8. **GetSubProducts** (Aggregate) — same sources/joins; Filter `Products.Id = GetProductsType.List.Current.Id`; output groups Id, ProductName, ProductId + Attribute1.
9. **GetSubProductList** (Aggregate) — identical to GetSubProducts (same filter/outputs).
10. **ListClear** (`ListClear(ListofProduct)`).
11. **ListofProduct** (Assign): `ListofProduct = GetSubProducts.List` mapped to `ListOfLOB`: Id=`NullIdentifier()`, PolicyId=∅, ProductId=`ProductId`, SubProductId=`GetSubProductList.List.Current.Id`, ErrorProductName/ErrorSubProductName/SubproductList/ProductName/SubProductName=∅, StateName=`BusinessSubmissionStructure.State`, ErrorStateName=∅.
12. **ListofProduct.Current.SubproductList** (Assign): `= GetSubProductList.List` mapped to `Sub_Products`: Id=Id, Name=∅, ProductId=ProductId, IsActive=∅, PlanCode=∅.
13. **GetPrimaryInsuredType** (`ENUMS\GetPrimaryInsuredType`).
14. **GetInsuredTypeValueFilter** (`ListFilter`): SourceList=`GetPrimaryInsuredType.PrimaryInsuredTypeList`, Condition `Key = Trim(BusinessSubmissionStructure.TypeofPrimaryInsured)`.

### Phase 2 — PolicyStruct build

15. **PolicyStruct** (Assign): `PolicyStruct = BusinessSubmissionStructure` mapped to `InitialSubmission`:
    - Id=`NullIdentifier()`, QuoteNumber=∅
    - IntermeditaryType=`GetProducersByOsUserId.List.Current.Intermediary.TypeOfIntermediary`
    - IntermeditaryId=`GetProducersByOsUserId.List.Current.Intermediary.Id`
    - ProducerNameId=`GetProducersByOsUserId.List.Current.Producer.Id`
    - IsSinglePolicy=`True`, IsQuickQuote=`False`, WritingCompany=∅
    - InsuranceType=`GetInsuranceType.List.Current.Value`
    - Country=`"United States"`, StateProvince=`BusinessSubmissionStructure.State`
    - EffectiveDate=`TextToDate(FormatDateTime(BusinessSubmissionStructure.EffectiveDate,"yyyy-MM-dd"))`
    - PolicyType=`"NEWBUSINESSINDIVIDUAL"`, PolicyNumber=∅, PolicyStage=`"NEWBUSINESSINDIVIDUAL"`, PolicyTerm=`"Annual"`
    - CreatedOn=`CurrDateTime()`, CreatedBy=`UserId`, UpdatedOn/UpdatedBy=∅
    - ClientId=`GetUserClientID.ClientIDBasedonTenant`, AccountId=∅
    - ExpiryDate=`TextToDate(FormatDateTime((AddYears(BusinessSubmissionStructure.EffectiveDate, 1)),"yyyy-MM-dd"))`
    - QuoteCreationDate=`CurrDateTime()`, ProductName=∅, Status=`"InTransaction"`, SubProductName=∅, ProductSVG=∅, TransactionEffectiveDate=∅
    - LastStep=`1`, IsLockSubmission=`False`
    - TypePrimaryInsured=`GetInsuredTypeValueFilter.FilteredList.Current.Value`
    - DoNotRenew/PolicyIssuedDate/CancellationEffectiveDate=∅

### Phase 3 — Validation chain (each step calls a validator, then an **AppendErrorAndIsValid** assign)

The AppendErrorAndIsValid pattern (repeated after each validator X):
- `IsValid = If(IsValid = False, False, X.IsValid)`
- `ErrorMessage = If(X.ErrorMessage = "", Trim(ErrorMessage), Trim(ErrorMessage) + " " + X.ErrorMessage)`

16. **IsFormValid** (`HBIS\IsFormValid(BusinessStruct=BusinessSubmissionStructure, UserId)`) → AppendErrorAndIsValid (direct copy: IsValid=IsFormValid.IsValid, ErrorMessage=IsFormValid.ErrorMessage).
17. **AdditionalInsuredListClear** (`ListClear(AdditionalInsured)`) → **AppendAdditonalInsured** (`HBIS\AppendAdditonalInsured(BusinessSubmissionStructure, UserId)`) → AppendErrorAndIsValid → **AdditionalInsured** (Assign) `= AppendAdditonalInsured.AdditionalInsured`.
18. **AdditionalOrgListClear** (`ListClear(AdditionalOrganization)`) → **AppendAdditonalOrg** (`HBIS\AppendAdditonalOrg(BusinessSubmissionStructure, UserId)`) → AppendErrorAndIsValid → **AdditionalOrganization** (Assign) `= AppendAdditonalOrg.AdditionalOrganization`.
19. **Address** (Assign): `Address = BusinessSubmissionStructure` → `Address_Struct`: Id=0; Client/CompanyId/OfficeId/UserId=∅; IsLegalSameAsMailing=`If(ToUpper(BusinessSubmissionStructure.AddresssameasMailingAddress) = "YES",True,False)`; AddressType=`"MAILING"`; AddressLine1/AddressLine2 from struct; Country=`"United States"`; State/City/ZipCode/Latitude/Longitude/County from struct; IsManualEntry=`True`; GoogleAddress=∅.
20. **IsAddressValid** (`HBIS\IsAddressValid(Address=Address, AddressType="", IsCountyMandatory=False)`) → AppendErrorAndIsValid.
21. **SetLatLongViaGeoLocation** (local Public action; Address=Address). **If `SetLatLongViaGeoLocation.ErrorMessage = ""`**:
    - True → Assign: `Address.Latitude/Longitude/County = SetLatLongViaGeoLocation.Out_Address.…`
    - False → Assign: `ErrorMessage = Trim(ErrorMessage) + SetLatLongViaGeoLocation.ErrorMessage` (note: IsValid not changed).
22. **AccountContacts** (Assign): mapping → `Account_Contacts`: ID=∅; TelephoneNumber=`TelephoneNumber_1`; TelephoneNumberCountry=`"us"`; AltTelephoneNumber=`AlternateTelephoneNumber1`; AltTelephoneNumberCountry=`"us"`; Email=`EmailID`; ErrorMessage*/IDs=∅; Extension=`Extension_XXXXXX`.
23. **If `Trim(AccountContacts.TelephoneNumber)=""`** (comment on canvas: *"making fields disabled as the telephone number and email are not mandatory for insured in bulkupload"*):
    - False (phone present) → **IsContactInfoValid** (`HBIS\IsContactInfoValid(AccountContacts, ContactType="Insured ", CheckEmail=If(Trim(AccountContacts.Email)="",False,True))`) → AppendErrorAndIsValid → FormatNumber
    - True (phone empty) → straight to FormatNumber
24. **FormatNumber** (Assign): `AccountContacts.TelephoneNumber = FormatTelePhoneNumber(AccountContacts.TelephoneNumber)`; same for AltTelephoneNumber. (`FormatTelePhoneNumber` = local function: strips "(", ")", "-", " " then returns `If(x="","","+1"+x)`.)

### Phase 4 — Risk Location build

25. **AddressIsSame** (If): `ToUpper(BusinessSubmissionStructure.AddresssameasMailingAddress) = "YES"`:
    - True → Assign `Location = Address` (Address_Struct → RiskAddressStructure): Id=0, ClientId=∅, PolicyId=`NullIdentifier()`, AddressType/AddressLine1/2/State/City/ZipCode/Latitude/Longitude/County copied, Country="United States", IsActive=True, IsManual=True, CreatedOn=`CurrDateTime()`, GoogleAddress=GoogleAddress, IsAddedFromAccount=`True`, LocationNumber=1; plus `Location.CreatedBy = UserId`.
    - False → **Location** (Assign) from struct risk columns: AddressType=`"MAILING"`, AddressLine1=`AddressLine3`, AddressLine2=`AddressLine4`, State=`State2`, City=`City2`, ZipCode=`ZipCode2`, Latitude=`Latitude2`, Longitude=`Longitude2` (County2 analogous), Country="United States", IsManual=True, CreatedBy=`UserId`, CreatedOn=`CurrDateTime()`, IsAddedFromAccount=`False`, LocationNumber=1, PolicyId=`NullIdentifier()`, Id=0.
26. **IsRiskLocationAddressValid** (`HBIS\IsAddressValid(Address=Location[1:1 map], AddressType="Risk Location", IsCountyMandatory=False)`) → AppendErrorAndIsValid.
27. **SetLatLongViaGeoLocation2** (same local action, Address=Location). **If ErrorMessage=""**:
    - True → Assign: `Location.Latitude/Longitude = Out_Address.…`, `Location.CreatedBy=UserId`, `Location.CreatedOn=CurrDateTime()`, `Location.LocationNumber=1`, `Location.IsManual=True`, `Location.IsAddedFromAccount=If(ToUpper(…AddresssameasMailingAddress)="YES",True,False)`, `Location.County=SetLatLongViaGeoLocation2.Out_Address.County`
    - False → Assign `ErrorMessage = Trim(ErrorMessage) + SetLatLongViaGeoLocation2.ErrorMessage`.

### Phase 5 — Mortgages

28. **ListClear3** (`ListClear(PolicyMortgageList)`).
29. **AppendPolicyMortgage** (`HBIS\AppendPolicyMortgage(PolicyId=NullIdentifier(), BusinessSubmissionStructure)`) → AppendErrorAndIsValid → **PolicyMortgageList** (Assign) `= AppendPolicyMortgage.PolicyMortgageListOut`.

### Phase 6 — Enum / dropdown resolution (all `DropDownvaluesHB` actions + ListFilter)

30. **GetHBBuildingFloodElevation** (`ENUMS\GetHBBuildingFloodElevation`) → **FloodElevationFIlter** (`ListFilter(BuildingFloodElevationList, Key = BusinessSubmissionStructure.BuildingFloodElevation)`).
31. **GetHBBuildingType** (`ENUMS\GetHBBuildingType`) → **BulidingTypeFilter** (`ListFilter(BuildingTypeList, Key = BusinessSubmissionStructure.BuildingType)`).
32. **GetHBBuildingDescription** (`ENUMS\GetHBBuildingDescription`) → **BuildingDescriptionFilter** (`ListFilter(BuildingDescriptionList, Key = BusinessSubmissionStructure.BuildingDescription)`).
33. **Deductibleselection** (`DropDownvaluesHB\Deductibleselection2`) → **PhysicalDamageFilter** (`ListFilter(DeductibleselectionOptions, Value = Replace(BusinessSubmissionStructure.PhysicalDamageDeductible, ",", ""))`).
34. **AmountOfLiabilityCoverage** (`DropDownvaluesHB\AmountOfLiabilityCoverage`) → **AmountLiabilityCoverageFilter** (`ListFilter(LiabilitiesLimitSelectionOptions, Value = Replace(BusinessSubmissionStructure.AmountOfLiabilityCoverage, ",", ""))`).
35. **ExcessLiabilitiesLimitSelection** (`DropDownvaluesHB\ExcessLiabilitiesLimitSelection`) → **ExcessLiabilities1** (`ListFilter(ExcessLiabilitiesLimitSelectionOptions, If(BusinessSubmissionStructure.ExcessscheduledBlanketCoveredPersonalLiabilities="No Coverage", Value="Not Applicable", Value = Replace(BusinessSubmissionStructure.ExcessscheduledBlanketCoveredPersonalLiabilities, ",", "")))`).
36. **SinkholeIncludedOrNot** (`DropDownvaluesHB\SinkholeIncludedOrNot`) → **Sinkhole1** (`ListFilter(SinkholeIncludedOrNotOptions, Key = BusinessSubmissionStructure.Sinkhole)`).
37. **EarthquakeLimitSelection** (`DropDownvaluesHB\EarthquakeLimitSelection`) → **Earthquake1** (`ListFilter(EarthquakeLimitSelectionOptions, Value = Replace(BusinessSubmissionStructure.Earthquake, ",", ""))`).
38. **Flood_ExcessFloodLimitSelection** (`DropDownvaluesHB\Flood_ExcessFloodLimitSelection`) → **Flood1** (`ListFilter(Flood_ExcessFloodLimitSelectionOptions, Value = Replace(BusinessSubmissionStructure.Flood, ",", ""))`).
39. **GetWindHailValue** (`DropDownvaluesHB\GetWildFireandWindHailValue`) → **WindCoverage1** (`ListFilter(Windenums, Value = Trim(Replace(BusinessSubmissionStructure.WindCoverage,"\n","")))`).
40. **GetWildFireValue** (`DropDownvaluesHB\GetWildFireandWindHailValue`) → **WildFire1** (`ListFilter(Windenums, Value = Trim(Replace(BusinessSubmissionStructure.WildFire,"\n","")))`).
41. **EndorsementOptions** (`DropDownvaluesHB\EndorsementOptions`) → three filters on `EndorsementOptions.Options`:
    - **ResidentialMedical1**: `Key = BusinessSubmissionStructure.ResidentialWorkerNofaultMedical`
    - **SmallScaleFarming1**: `Key = BusinessSubmissionStructure.SmallScaleFarmingEndorsement`
    - **LandlordEndorsement1**: `Key = BusinessSubmissionStructure.LandlordEndorsement`
    - **HomeOffice1**: `Key = BusinessSubmissionStructure.HomeOfficeEndorsement`

### Phase 7 — Risk Information & HexCat zones

42. **If `Location.Latitude = "" or Location.Longitude = ""`**:
    - False → **GetHexcodeFromLatLng** (H3Ext extension: Latitude=Location.Latitude, Longitude=Location.Longitude, lrResolution=**4**, hrResolution=**5**) → **RiskInformation** (Assign) mapping incl. `HexZoneIdLower=GetHexcodeFromLatLng.lrHex`, `HexZoneIdHiger=GetHexcodeFromLatLng.hrHex`.
    - True → **AppendErrorAndIsValid** (Assign): `ErrorMessage = Trim(ErrorMessage) + " " + "Risk Location Lattitude & Longitude is needed for HexCat."` → **RiskInformation** (Assign) with Hex fields left empty.
43. **RiskInformation** mapping (both variants): Id=∅; BuildingFloodElevation=`FloodElevationFIlter.FilteredList.Current.Value`; BuildingType=`BulidingTypeFilter.FilteredList.Current.Value`; BuildingDescription=`BuildingDescriptionFilter.FilteredList.Current.Value`; CreatedOn=`CurrDateTime()`; CreatedBy=`UserId`; PolicyId=`NullIdentifier()`; FloodZone/ConstructionType/NumberofStories/SquareFootage/Roofyear/RoofShape/RoofCovering/presenceOfBasement/status/statusTimeStamp/ApprovalCounter/ApprovalExpiration/YearBuilt/NonApprovalCounter/FoundationType/ResidentType/RoofArchitectureType/IsDisableFloodElevation/RoofAge=∅.

### Phase 8 — Limits & Coverages + Rating

44. **LimitsAndCoverages** (Assign): `= BusinessSubmissionStructure` → `LimitCoverage`: PolicyId=`NullIdentifier()`; DwellingLimit=`DwellingAssetLimit`; PriorPolicyPeriodPremium=`PriorPolicyPremium`; BuildingFloodElevation/BuildingType/BuildingDescription from struct; HexZoneIdLower/Higer=`GetHexcodeFromLatLng.lrHex/hrHex` (hex branch only); PhysicalDamageDeductible_EX=`PhysicalDamageFilter.FilteredList.Current.Value`; CoverageLevel_EX=`"Basic"`; LiabilityCoverage_EX=`AmountLiabilityCoverageFilter.FilteredList.Current.Value`; SinkholeCatastrophic..._EX=`Sinkhole1.FilteredList.Current.Value`; Earhquake_EX=`Earthquake1.…Value`; Flood_EX=`Flood1.…Value`; WindHail_EX=`WindCoverage1.…Value`; WildFire_EX=`WildFire1.…Value`; ResidentWorkerNFM_EX=`ResidentialMedical1.…Value`; SmallScalefarming..._EX=`SmallScaleFarming1.…Value`; LandlordEndorsement_EX=`LandlordEndorsement1.…Value`; HomeOfficeEndorsement_EX=`HomeOffice1.…Value`; Latitude/Longitude from struct; all premium/value fields ∅.
45. **Calculation** (Assign):
    - `AppurtenantStructureAssetsLimit = DwellingLimit * 0.10`
    - `PersonalAssetsLimit = DwellingLimit * 0.65`
    - `DwellingOccupancyDisruptionLimit = DwellingLimit * 0.25`
    - `TotalInsuredValue = DwellingLimit + AppurtenantStructureAssetsLimit`
    - `PolicyId = NullIdentifier()`
46. **Rater** (Run Server Action **`RaterForBulkUpload`** — reference from **IERatingEngine** module). Input `Inputs = LimitsAndCoverages` mapped `LimitCoverage → RatingInputs`: DwellingAssetLimit=DwellingLimit; PhysicalDamageDeductible=`TextToInteger(PhysicalDamageDeductible_EX)`; CoverageLevel=CoverageLevel_EX; LiabilityCoverage=`TextToInteger(LiabilityCoverage_EX)`; ExcessBlanketPL=`TextToLongInteger(ExcessBlanketPL_EX)`; Sinkhole/Earthquake/Flood/WindHail/WildFire/ResidentWorkerNFM/SmallScalefarming/Landlord/HomeOffice = *_EX; PriorPolicyPeriodPremium=`TextToDecimal(PriorPolicyPerodPremiumi_EX)`; RateModification=RateModification_EX; HRHexZones=HexZoneIdHiger; LRHexzones=HexZoneIdLower; BuildingFloodElevation/BuildingType/BuildingDescription/FloodZone from struct; Lat=Location.Latitude; Lon=Location.Longitude; RecalculateRateModification=∅; **PolicyFeesNew=195 (hard-coded)**. Scalar args: `ClaculateRateModification=True`, `ClaculateRecurringRPS=True`.
47. **Assign** (rating output back into LimitsAndCoverages):
    - BasicCoveragelevelCalculationPremium=`TextToDecimal(FormatDecimal(Rater.RatingOutput.BasicCoveragePremium, 2, ".", ""))`
    - RateModification_EX=`TextToDecimal(FormatDecimal(Rater.RatingOutput.RateModification, 2, ".", ""))`
    - TotalPremiumWithoutRateModification=`TextToDecimal(FormatDecimal(Rater.RatingOutput.BasicCoveragePremiumWithoutRateModification, 2, ".", ""))`
    - ExcessBlanketPLValue_EX=`Rater.RatingOutput.ExcessScheduleBlanketCoveredPL`
    - SinkholeCatastrophicGroundCollapseValue_EX=`…SinkholePremium`; EarhquakeValue_EX=`…EarthquakePremium`; FloodValue_EX=`…FloodPremium`; WindHailValue_EX=`…WindPremium`; WildFireValue_EX=`…WildfirePremium`; ResidentWorkerNFMValue_EX=`…ResidentWorkerNFPremium`; SmallScalefarmingEndorsementValue_EX=`…SmallScalefarmingEndorsementPremium`; LandlordEndorsementValue_EX=`…LandEndorsementPremium`; HomeOfficeEndorsementValue_EX=`…HomeOfficeEndorsementPremium`.
48. **IsLimitsAndCoverageValid** (`HBIS\IsLimitsAndCoverageValid(LimitsAndCoverages)`) → AppendErrorAndIsValid.

### Phase 9 — Gate & Persistence

49. **IsCurrentRecordValid** (If): `Trim(ErrorMessage) = ""`
    - **False** → Assign: `ErrorMessage = Replace(ErrorMessage, ".", "." + NewLine())`, `Success = False` → **End** (no DB writes).
    - **True** → continue:
50. **CreatePolicies** (`HBIS\CreatePolicies2(PolicyStruct, ListofProduct, UserId)`) — creates the quote (see §6.4).
51. **If `CreatePolicies.IsSuccess`**:
    - False → Assign `ErrorMessage=Replace(CreatePolicies.ErrorMessage,".","."+NewLine())`, `Success=False` → End.
    - True →
52. **GetPolicyDatabyPolicyID** (`HBIS\GetPolicyProductInformation(PolicyId=CreatePolicies.PolicyId, UserId)`).
53. **Assign**: `PolicyStruct = GetPolicyDatabyPolicyID.PolicyStruct`; `PolicyStruct.LastStep = 4`; `PolicyStruct.TypePrimaryInsured = GetInsuredTypeValueFilter.FilteredList.Current.Value`; `PrimaryInsuredType = GetInsuredTypeValueFilter.FilteredList.Current.Value`.
54. **Accounts** (Assign): `= BusinessSubmissionStructure` → `Accounts_Struct`: FirstName/MiddleName/LastName = `If(GetInsuredTypeValueFilter.FilteredList.Current.Value = "INDIVIDUAL" or … = "SOLEPROPRIETORSHIP", BusinessSubmissionStructure.<Name>, "")`; BusinessName/DoingAsBusiness = `If(… INDIVIDUAL/SOLEPROPRIETORSHIP, "", OrganizationName/DoingBusinessAs)`; CreatedOn=`CurrDateTime()`; CreatedBy=`UserId`; **IsDraft=`True`; Status=`"DRAFT"`**; IsOlder=`ToUpper(BusinessSubmissionStructure.Areyou65orOlder)`; other fields ∅.
55. **CreatePolicyDetails_HB** (Run Server Action **`HudsonBailey\CreatePolicyDetails_HB`**: PolicyInformation=PolicyStruct, Accounts, ClientID, Address, AccountContacts, AdditionalInsured, AdditionalOrganization) — persists account/contacts/insureds.
56. **If `CreatePolicyDetails_HB.IsError`**: True → Assign (`ErrorMessage=Replace(CreatePolicies.ErrorMessage,".","."+NewLine())`, `Success=False`) → End. False →
57. **Location.PolicyId** (Assign) `= CreatePolicies.PolicyId`.
58. **CreateRiskLocations** (`HBIS\CreateRiskLocations3(Location, UserId)`) — see §6.6.
59. **RiskInformation.PolicyId** (Assign) `= CreatePolicies.PolicyId`.
60. **AppendPolicyNumberToMortgage** (**For Each** over `PolicyMortgageList`, no start index / max iterations) — body: `PolicyMortgageList.Current.PolicyId = GetPolicyDatabyPolicyID.PolicyStruct.Id` (cycle back).
61. **CreateorUpdateHBISRiskInformationsNew3** (`HBIS\CreateorUpdateHBISRiskInformationsNew3(RiskInformation, PolicyMortgageList, LastStep=2.3, UserId)`) — see §6.5.
62. **If `.IsError`**: True → Assign (`ErrorMessage=Replace(CreateorUpdateHBISRiskInformationsNew3.ErrorMessage,".","."+NewLine())`, `Success=False`) → End. False →
63. **LimitsAndCoverages.PolicyId** (Assign) `= CreatePolicies.PolicyId`; **LimitsAndCoverages.ClientId** (Assign) `= GetUserClientID.ClientIDBasedonTenant`.
64. **CreateorUpdateHBISLimitsandcoverages** (reference — producer module, HBIS folder; input `Limitsandcoverages = LimitsAndCoverages`).
65. **UpdatePolicyWithLaststep** (`BulkUpload\HB_UpdateQuote_CS(PolicyId=LimitsAndCoverages.PolicyId, LastStep=1)`).
66. **Final Assign**: `Success = True`, `QuoteNumber = PolicyStruct.QuoteNumber` → **End**.

### Exception path

- **AllExceptions** handler (Abort Transaction = **Yes**, Log Error = **Yes**) → Assign: `ErrorMessage = Replace(ErrorMessage, ".", "." + NewLine())`, `Success = False` → **AbortTransaction** (system) → End.

---

## 5. Aggregates in the main action (summary)

| Aggregate | Sources | Joins | Filters | Sort / Max | Output use |
|---|---|---|---|---|---|
| GetProducersByOsUserId | Producer, Intermediary | Producer Only-With Intermediary ON Producer.IntermediaryId=Intermediary.Id | Producer.OsUserId=UserId; Producer.Status="ACTIVE"; Intermediary.Status="ACTIVE" | Producer.ProducerCode ASC | Intermediary type/id + Producer id into PolicyStruct |
| GetInsuranceType | CompanyProduct2, Products(Product), SubProducts(Product) | CP2 W/WO SubProducts ON CP2.ProductId=SubProducts.Id; SubProducts W/WO Products ON SubProducts.ParentProductId=Products.Id | group filter Key="Specialty Lines" | — | `.List.Current.Value` → InsuranceType (ProductType id) |
| GetProductsType | same | same | Products.ProductType=GetInsuranceType.List.Current.Value | — | product id/name |
| GetSubProducts | same | same | Products.Id=GetProductsType.List.Current.Id | — | ListofProduct source |
| GetSubProductList | same | same | Products.Id=GetProductsType.List.Current.Id | — | SubproductList source |

Calculated attribute (all product aggregates): `If(Products.ProductType=1,"Personal Lines",If(Products.ProductType=3,"Commercial Lines","Specialty Lines"))`.

No Advanced SQL is used anywhere in this action or its same-module callees.

---

## 6. Called Actions (recursively documented)

### 6.1 IsFormValid (IE_Policy_BL / HBIS) — auto-generated via "Extract To Action"
In: BusinessStruct, UserId. Out: IsValid, ErrorMessage.
- **GetProducerByUserId** (Aggregate: Producer join Intermediary ON IntermediaryId=Id; filter Producer.OsUserId=UserId) — List.Empty → `IsValid=False; Err+="Brokerage firm not found for the Producer. "`.
- EffectiveDate = "" or NullDate() → `"Effective Date is empty. "`; `not TextToDateValidate(EffectiveDate)` → `"Effective Date is not valid. "`.
- TypeofPrimaryInsured="" → `"Type of Primary Insured is empty. "`; ListFilter(GetPrimaryInsuredType.PrimaryInsuredTypeList, Key=Trim(TypeofPrimaryInsured)) empty → `"Type of Primary Insured is not valid. "`.
- **If "Is Type Individual or Sole Proprietership"** (`Trim(...)="Individual" or "Sole Proprietorship"`):
  - Individual branch: `FirstName="" or Length(Trim(FirstName))<2 or Length(...)…` → `"First Name is either empty or invalid. "`; `ErrorMessage=If(ValidateName(FirstName),ErrorMessage,ErrorMessage+"First Name is invalid…")`; MiddleName optional, `Length(Trim(MiddleName_Initial))<=50` + `ValidateName`; LastName mirror of FirstName (`If(...INDIVIDUAL or SOLEPROPRIETORSHIP, LastName,"")` style checks); Areyou65orOlder="" → `"Are you 65 or older is empty. "`.
  - Organization branch: OrganizationName="" → `"Organization Name is empty. "`; `Length(Trim(OrganizationName))>=5 and <=75` else `"Organization Name is not between 5 to 75 characters. "`; `ValidateNameWithCharactersAndNumbers(OrganizationName)`; DoingBusinessAs optional; if present `Length >= 5 and <= 75` else `"Doing Business as should be in between 5 to 75 characters. "` + `ValidateNameWithCharactersAndNumbers`.
- **Output Variables** (Assign): `IsValid = If(Trim(ErrorMessage)="",True,False)`.

### 6.2 IsAddressValid (IE_Policy_BL / HBIS)
In: Address (Address_Struct), AddressType (Text), IsCountyMandatory (Boolean). Out: IsValid, ErrorMessage. All messages prefixed with the AddressType argument.
- AddressLine1="" → `"Address Line 1 is empty. "`; `Length(AddressLine1)<=500` else `"Address Line 1 must be less than 500 characters. "`; Length(AddressLine2)<=500 else similar.
- State="" → `"State is empty. "`; **GetStatesByCountry** (Aggregate: State join Country ON State.CountryCode=Country.Code; filter `Country.Name = Trim(Address.Country) and State.Name = Address.State`); List.Empty → `"State is not valid. "`.
- City="" / Length(City)<=50; County checks (County="" gated by IsCountyMandatory; Length(County)<=50).
- ZipCode="" → error; **CheckUSZipCode** = `Regex_Search(Text=Address.ZipCode, Pattern="^\d{5}(-\d{4})?$")`; not Found → `"US ZipCode is invalid. "`.
- Longitude/Latitude: `Trim(x)=""` → skip; `Length(x)<=50`; `HBIS\ValidateLatLong(Text=…)` per coordinate.
- Final: IsValid=If(Trim(ErrorMessage)="",True,False).

### 6.3 IsContactInfoValid (IE_Policy_BL / HBIS)
In: AccountContacts, ContactType, CheckEmail. Comment: "Updated to allow empty telephone number enhancement by roger".
- `Trim(TelephoneNumber)=""` → `IsValid=False; Err=ContactType+"Telephone Number is empty. "`; length check; format check; **ValidatePhoneNumber** (`HBIS\ValidatePhoneNumber(Trim(TelephoneNumber))`) → `ErrorMessage=If(ValidatePhoneNumber.IsValid,"",ErrorMessage+ContactType+"Telephone Number is not valid…")`.
- Alternate telephone (optional, same pattern), then Email (checked only when CheckEmail=True).

### 6.4 CreatePolicies2 (IE_Policy_BL / HBIS, Public)
In: PolicyStruct (InitialSubmission), ListofProduct, UserId. Out: IsSuccess, ErrorMessage, PolicyId, QuoteNumber.
- GetUserClientID (Tenant).
- **If `PolicyStruct.Id=0`** (new):
  - **GetLatestPolicyforQuote** (`Submissions\GetLatestPolicyforQuote(ClientId=GetUserClientID.ClientIDBasedonTenant)`).
  - If `Policylist.Id<>0`: `QuoteNumber = FormatText(IntegerToText(TextToInteger(Substr(GetLatestPolicyforQuote.Policylist.QuoteNumber,0,11))+1),11,11,True,"0")` (11-digit, zero-padded increment); else `QuoteNumber = "00000000001"`.
  - Assign: ClientId=tenant client, CreatedOn/UpdatedOn=`CurrDateTime()`, CreatedBy=UserId, UpdatedBy=`GetUserId()`.
  - **HB_CreatePolicyBulkUpload_CS** (`Submissions\HB_CreatePolicyBulkUpload_CS(PolicyStruct)`) → creates the Policy row.
  - **CreateUpdateProducts2** (local `CreateUpdateProducts(ListofProduct, PolicyId=HB_CreatePolicyBulkUpload_CS.PolicyId)`) → policy product rows.
  - **LaunchLogActivity2** (`LogActivity\LaunchLogActivity`: Module="Submissions", ActionType="Create", Description=`"Submission created for Quote ID "+PolicyStruct.QuoteNumber`, LoggedId=new PolicyId, UserId=`GetUserId()`, Timestamp=`CurrDateTime()`).
  - Outputs: QuoteNumber=HB_CreatePolicyBulkUpload_CS.QuoteNumber, IsSuccess=True, PolicyId=….PolicyId.
- **Else** (update): Assign UpdatedBy=`GetUserId()`/UpdatedOn=`CurrDateTime()` → **UpdatePolicy** (`Submissions\CreatePolicy_CS2(PolicyStruct)`) → CreateUpdateProducts(ListofProduct, UpdatePolicy.PolicyId) → LaunchLogActivity3 (ActionType="Update", Description=`"Submission updated for Quote ID "+QuoteNumber`) → outputs (QuoteNumber=PolicyStruct.QuoteNumber, IsSuccess=True, PolicyId=UpdatePolicy.PolicyId).
- **AllExceptions**: LogMessage(`AllExceptions.ExceptionMessage`, ModuleName="IE_POLICY_BL") → Assign IsSuccess=False, ErrorMessage=ExceptionMessage → End.

### 6.5 CreateorUpdateHBISRiskInformationsNew3 (IE_Policy_BL / HBIS, Public)
In: RiskInformation, PolicyMortgageList, LastStep (=2.3 from caller), UserId. Out: ID, IsError, ErrorMessage.
- GetUserClientID → Assign RiskInformation.ClientId=tenant client, CreatedOn=`CurrDateTime()`, CreatedBy=`GetUserId()`.
- **CreateorUpdateHBISRiskInformation** (`HBIS\CreateorUpdateHBISRiskInformation(RiskInformation)`) — cross-module reference; writes risk info row. IsError → outputs mapped, End.
- **CreateorUpdateHBISPolicyMortgageViaBulkUpload** (`HBIS\CreateorUpdateHBISPolicyMortgageViaBulkUpload(PolicyMortgageList, UserId)`) — writes mortgage rows. IsError → outputs, End.
- Two **disabled** nodes remain in the flow (excluded from execution): `CreateorUpdateHBISPolicyMortgage` and `UpdatePolicyWithLaststep2` (HB_UpdateQuote with LastStep input).
- Final Assign: IsError/ErrorMessage/ID from CreateorUpdateHBISRiskInformation.

### 6.6 CreateRiskLocations3 (IE_Policy_BL / HBIS)
- GetUserClientID → Assign: Location.ClientId=tenant client; CreatedBy=UserId; `CreatedOn=If(Location.Id=0,CurrDateTime(),Location.CreatedOn)`; `UpdatedBy=If(Location.Id=0,Location.UpdatedBy,GetUserId())` (+UpdatedOn analog).
- **CreateRiskLocations** (`RiskLocations\CreateRiskLocations(RiskLocation=Location)`) — cross-module DB write.
- `CreatedId = CreateRiskLocations.LocationId`.

### 6.7 GetPolicyProductInformation (IE_Policy_BL / HBIS, Public)
- **GetProductSubProducts** (Aggregate: Product, sort ProductName ASC).
- GetUserClientID → **GetPolicyDetailsbyPolicyId_CS** (`Submissions\GetPolicyDetailsbyPolicyId_CS(PolicyId, ClientId=tenant client)`).
- ListFilters `Sub` / `Product` on GetProductSubProducts.List: `Product.Id = LongIntegerToIdentifier(GetPolicyDetailsbyPolicyId_CS.List…SubProductId/ProductId)`.
- Loop: **GetCompanyProductByCompanyCode** (`InsuranceTypes\GetCompanyProductByCompanyCode(CompanyCode=PolicyStruct.WritingCompany, InsuranceType=PolicyStruct.InsuranceType)`) → **GetCompanySubProductByCompanyCode** (`InsuranceTypes\GetCompanySubProductByCompanyCode(CompanyCode=…, ProductId=GetCompanyProductByCompanyCode.ProductList.Current.ProductID)`) → ListAppendAll (cycle).
- Returns PolicyStruct (used by caller for QuoteNumber/Id/LastStep updates).

### 6.8 FormatTelePhoneNumber (IE_Policy_BL / HBIS, Function)
`TelephoneNumber = Replace(x,"(","")` → `Replace(x,")","")` → `Replace(x,"-","")` → `Replace(x," ","")` → `OutTelephoneNumber = If(TelephoneNumber = "","","+1" + TelephoneNumber)`.

### 6.9 SetLatLongViaGeoLocation (IE_Policy_BL root, Public) — auto-generated via Extract To Action
In: Address (Address_Struct). Out: Out_Address, ErrorMessage.
- **Check GeoLocation** (If): `Address.AddressLine1 <> "" and …` (address fields present):
  - True → **GetGeoCodeFromAddress** (`GoogleGeocodeAPI\GetGeoCodeFromAddress(AddressLine1, AddressLine2, Country="United States", State, City, ZipCode, County)`) → If `GeoDetails.Status = "OK"`:
    - True → ListFilter(`GeoDetails.Results.Current.Address_components`, `Types.Current = "administrative_area_level_2"`) → Assign: `Address.Latitude = If(Address.Latitude="", GeoDetails.Results.Current.Geometry.Location.Lat, Address.Latitude)` (same for Longitude); `Address.County = If(Address.County="", ListFilter.FilteredList.Current.Long_name, Address.County)` → Output Variables → End.
    - False → ErrorMessage = `"Lattitude and Longitude not found for provided address, Please provide correct address. "` → End.
  - False → same error message → End.

### 6.10 GetHexcodeFromLatLng — **H3Ext extension** (.NET, Uber H3 geo-index)
In: Latitude, Longitude, lrResolution (4), hrResolution (5). Out: lrHex, hrHex. Used for HexCat rating zones.

### 6.11 Execute_BulkUpload (IE_Policy_BL / HBIS, Public)
`BulkUploadQuotes\LaunchBulkUploadQuotes(AuditId)` (starts BPT process) → `BulkUploadAudit\UpdateBulkUploadAuditProcessID(LaunchBulkUploadQuotes.ProcessId, AuditId)`.

### 6.12 BulkUpload_Quotes_HB (IE_Policy_BL / HBIS, Public) — batch orchestrator
Documented in §2. Key elements: Site.BulkUploadTimerEnable gate (checked before file fetch **and** re-checked inside the record loop — turning the site property off stops processing mid-batch); GetBulkUploadFiles (BulkUploadAudit, "In-Progress", max 1, latest UploadedOn); GetRecords (BulkUploadDump, unprocessed, max 100 per batch); JSON Deserialize ColJSON → BusinessSubmissionStructure; per-record call + `CommitTransaction`; per-record dump update (`IsProcessed=True`, `Status="Failed"/success`, `UpdatedOn=CurrDateTime()`, `Errors=ErrorMessage`) persisted via `BulkUpload\CreateUpdateBulkAuditDump`; after each batch `GetRemainingRecordsCount` (Sum unprocessed) loops until 0; `CheckTheStatus` (Sum(IsSuccess) of processed, max 1) determines final audit status written via `BulkUpload\CreateUpdateBulkUploadAudit`; LogMessage on completion/disabled timer.

### 6.13 Append actions (HBIS; signatures)
- `AppendAdditonalInsured(BusinessSubmissionStructure, UserId)` → AdditionalInsured list, IsValid, ErrorMessage — parses the row's additional-insured columns and validates them.
- `AppendAdditonalOrg(BusinessSubmissionStructure, UserId)` → AdditionalOrganization list, IsValid, ErrorMessage.
- `AppendPolicyMortgage(PolicyId=NullIdentifier(), BusinessSubmissionStructure)` → PolicyMortgageListOut, IsValid, ErrorMessage.
- `IsLimitsAndCoverageValid(Limitsandcoverages)` → IsValid, ErrorMessage — validates limits/deductibles/endorsement selections.
- `IsAdditionalInsuredValid`, `IsAdditionalOrgValid` — used inside the Append actions.

---

## 7. Cross-Module Dependencies

| Module | Elements used |
|---|---|
| **Tenant** | `GetUserClientID(UserId)` → ClientIDBasedonTenant (multi-tenant client resolution) |
| **ENUMS** | `GetPrimaryInsuredType`, `GetHBBuildingFloodElevation`, `GetHBBuildingType`, `GetHBBuildingDescription` (Key/Value enum lists) |
| **DropDownvaluesHB** | `Deductibleselection2`, `AmountOfLiabilityCoverage`, `ExcessLiabilitiesLimitSelection`, `SinkholeIncludedOrNot`, `EarthquakeLimitSelection`, `Flood_ExcessFloodLimitSelection`, `GetWildFireandWindHailValue`, `EndorsementOptions` |
| **Submissions** | `CreatePolicy_CS2`, `HB_CreatePolicyBulkUpload_CS`, `GetLatestPolicyforQuote`, `GetPolicyDetailsbyPolicyId_CS` (policy/quote persistence + retrieval) |
| **HudsonBailey** | `CreatePolicyDetails_HB` (account, contacts, additional insured/org persistence) |
| **RiskLocations** | `CreateRiskLocations` (risk location persistence) |
| **IE_Policy_CS** (producer of HBIS references) | `CreateorUpdateHBISRiskInformation`, `CreateorUpdateHBISPolicyMortgageViaBulkUpload`, `CreateorUpdateHBISLimitsandcoverages`, `CreateHBPolicyCommission_CS` |
| **IERatingEngine** | `RaterForBulkUpload` (premium calculation engine) |
| **BulkUpload** | `HB_UpdateQuote_CS`, `CreateUpdateBulkAuditDump`, `CreateUpdateBulkUploadAudit` (+ `BulkUploadAudit`/`BulkUploadDump` entities) |
| **BulkUploadQuotes / BulkUploadAudit** | `LaunchBulkUploadQuotes` (BPT), `UpdateBulkUploadAuditProcessID` |
| **GoogleGeocodeAPI** | `GetGeoCodeFromAddress` (REST wrapper for Google Geocoding) |
| **H3Ext (extension)** | `GetHexcodeFromLatLng` (Uber H3 hex index, resolutions 4 & 5) |
| **LogActivity** | `LaunchLogActivity` (activity audit trail) |
| **InsuranceTypes** | `GetCompanyProductByCompanyCode`, `GetCompanySubProductByCompanyCode` |
| **System** | `ListClear`, `ListFilter`, `ListAppendAll`, `AbortTransaction`, `CommitTransaction`, `LogMessage`, `Regex_Search`, JSON Deserialize |

**Site properties:** `Site.BulkUploadTimerEnable` (Boolean) — master on/off switch for batch processing.
**Entities read:** Producer, Intermediary, CompanyProduct2, Product (×2 alias), State, Country, BulkUploadAudit, BulkUploadDump, Policy-related entities via Submissions module.
**Timers/BPT:** `LaunchBulkUploadQuotes` BPT process; a `timer` element exists in IE_Policy_BL for scheduled processing.

---

## 8. Database Operations (what gets written and why)

| # | Operation | Via | Purpose |
|---|---|---|---|
| 1 | Create Policy (quote) | Submissions\HB_CreatePolicyBulkUpload_CS | New submission row, Status="InTransaction", generated 11-digit QuoteNumber |
| 2 | Create policy products | CreateUpdateProducts | LOB/product/subproduct links for the policy |
| 3 | Create Account + Contacts + Additional insured/org | HudsonBailey\CreatePolicyDetails_HB | Insured party ("DRAFT" account), phone/email contacts |
| 4 | Create Risk Location | RiskLocations\CreateRiskLocations | Physical risk address with geo data |
| 5 | Create/Update Risk Information | IE_Policy_CS\CreateorUpdateHBISRiskInformation | Building attributes + Hex zones |
| 6 | Create/Update Policy Mortgages | IE_Policy_CS\CreateorUpdateHBISPolicyMortgageViaBulkUpload | Mortgagee records linked to policy |
| 7 | Create/Update Limits & Coverages | IE_Policy_CS\CreateorUpdateHBISLimitsandcoverages | Limits, deductibles, endorsement selections + rated premiums |
| 8 | Update policy LastStep | BulkUpload\HB_UpdateQuote_CS (LastStep=1) | Wizard progress flag |
| 9 | Activity log | LogActivity\LaunchLogActivity | "Submission created/updated for Quote ID …" |
| 10 | Staging updates | BulkUpload\CreateUpdateBulkAuditDump / CreateUpdateBulkUploadAudit | Row + file status bookkeeping (orchestrator) |

**Transaction flow:** the whole per-row action runs in one transaction. Validation failure → return before any write. Called-action error → Success=False (partial data possible per the IsError branches — each Create step checks IsError and stops). Unhandled exception → AllExceptions handler → explicit `AbortTransaction` → full rollback. The orchestrator commits after each row (`CommitTransaction`) so one bad row doesn't roll back previously processed rows.

---

## 9. Business Rules (consolidated)

**Producer / tenant**
- Upload user must map to an ACTIVE Producer linked to an ACTIVE Intermediary ("Brokerage firm not found for the Producer.").
- All data is tenant-scoped via GetUserClientID.

**Form validation (IsFormValid)**
- EffectiveDate mandatory + must parse as date.
- TypeofPrimaryInsured mandatory + must match the PrimaryInsuredType enum.
- Individual/Sole Proprietorship: FirstName mandatory (≥2 chars, ValidateName), MiddleName optional (≤50, ValidateName), LastName mandatory, Areyou65orOlder mandatory.
- Organization: OrganizationName mandatory 5-75 chars (letters/numbers), DoingBusinessAs optional 5-75 chars.

**Address rules (both mailing and risk address)**
- AddressLine1 mandatory, lines ≤500 chars; State mandatory and must exist for the country (State×Country lookup); City mandatory ≤50; ZipCode mandatory matching `^\d{5}(-\d{4})?$`; County optional (IsCountyMandatory=False for both calls here); Lat/Long optional but validated when present.
- Risk address = mailing address when "Address same as Mailing Address" = YES (case-insensitive), else taken from AddressLine3/4, City2, State2, ZipCode2, Lat2/Long2/County2.
- Missing lat/long is auto-filled from Google Geocode; geocode failure appends a message but does not invalidate the record; missing coordinates at rating time appends "Risk Location Lattitude & Longitude is needed for HexCat." and skips hex-zone computation.

**Contacts**
- Telephone and email are NOT mandatory for bulk upload (explicit design comment). When present, phone is validated (`ValidatePhoneNumber`) and normalized to `+1` E.164-ish format; email validated only if provided.

**Products / policy**
- Product scope fixed to "Specialty Lines" product type; the product/subproduct list is built from CompanyProduct2 catalog.
- New quotes: QuoteNumber = zero-padded 11-digit increment of the client's latest quote, starting at "00000000001".
- Policy defaults: PolicyType/PolicyStage="NEWBUSINESSINDIVIDUAL", PolicyTerm="Annual", Status="InTransaction", IsSinglePolicy=True, IsQuickQuote=False, ExpiryDate=EffectiveDate+1 year, LastStep progression 1→4 (final quote updated with LastStep=1 via HB_UpdateQuote_CS; risk info step = 2.3).

**Limits & coverages derivations**
- AppurtenantStructureAssetsLimit = 10% of DwellingLimit; PersonalAssetsLimit = 65%; DwellingOccupancyDisruptionLimit = 25%; TotalInsuredValue = DwellingLimit + AppurtenantStructureAssetsLimit.
- Coverage level fixed to "Basic"; policy fee fixed at 195; RateModification and RecurringRPS both recalculated (True).
- Coverage selections (deductible, liability, excess, sinkhole, earthquake, flood, wind, wildfire, endorsements) must match the DropDownvaluesHB catalogs (comma/newline-stripped comparisons); "No Coverage" excess maps to "Not Applicable".

**Error accumulation**
- Every validator appends to one ErrorMessage; IsValid is monotonic (once False, stays False).
- Persistence begins only when `Trim(ErrorMessage)=""`.
- On any failure the ErrorMessage is reformatted with `Replace(ErrorMessage,".","."+NewLine())` for display, Success=False.

**Batch rules (orchestrator)**
- Processing gated by Site.BulkUploadTimerEnable, re-checked per record (safe stop).
- Rows processed in batches of 100, single audit file at a time (latest "In-Progress").
- Each row commits independently; row status "Failed"/success + errors stored on BulkUploadDump; file-level status derived from Sum(IsSuccess)/remaining counts.

---

## 10. Exception Handling

| Scope | Handler | Behavior |
|---|---|---|
| BulkUploadBusinessSubmissions | AllExceptions (Abort Transaction=Yes, Log Error=Yes) | ErrorMessage=Replace(ErrorMessage,".","."+NewLine()); Success=False; explicit AbortTransaction; End |
| CreatePolicies2 | AllExceptions | LogMessage(ExceptionMessage, "IE_POLICY_BL"); IsSuccess=False; ErrorMessage=ExceptionMessage |
| CreateorUpdateHBISRiskInformationsNew3 | AllExceptions | outputs IsError/ErrorMessage; End |
| Per-step guards | If IsError / If IsSuccess after every Create call | stop + Success=False + reformatted message |

---

## 11. Rebuild Guide (essentials)

1. Create structures: BusinessSubmissionStructure (one column per spreadsheet field incl. dual address sets), InitialSubmission, Address_Struct, RiskAddressStructure, Accounts_Struct, Account_Contacts, LimitCoverage (with *_EX selection fields and *Value_EX premium fields), RiskInformation, MortgageInformation, AdditionalNameInsured, AdditionalOrganisation, ListOfLOB/Sub_Products, RatingInputs/RatingOutput.
2. Create staging entities BulkUploadAudit (Status, UploadedOn, UploadedBy, ProcessId) and BulkUploadDump (BulkUploadAuditId, ColJSON, IsProcessed, Status, Errors, UpdatedOn) in the BulkUpload module; site property BulkUploadTimerEnable.
3. Implement the helper/validator actions exactly as §6 (IsFormValid, IsAddressValid, IsContactInfoValid, Append*, FormatTelePhoneNumber, SetLatLongViaGeoLocation with GoogleGeocodeAPI, ValidateLatLong, ValidatePhoneNumber, ValidateName*).
4. Implement CreatePolicies2 (quote numbering + Submissions writes + activity log), CreateRiskLocations3, CreateorUpdateHBISRiskInformationsNew3, GetPolicyProductInformation.
5. Build the main action with the exact phase order of §4 — validation must fully precede persistence; wire the AllExceptions handler with AbortTransaction.
6. Build BulkUpload_Quotes_HB orchestrator + Execute_BulkUpload BPT launcher (batch 100, per-row commit, audit updates, timer gate).
7. Reference H3Ext (resolutions 4/5) and IERatingEngine RaterForBulkUpload (PolicyFeesNew=195, CoverageLevel "Basic").

---

## 12. Known quirks captured verbatim (do not "fix" when rebuilding)

- `ListofProduct.Current.SubproductList` is assigned without an enclosing For-Each (acts on first/current element).
- The failure assign after `CreatePolicyDetails_HB.IsError` reuses `CreatePolicies.ErrorMessage` (not CreatePolicyDetails_HB's).
- Geo-location failure appends ErrorMessage but leaves IsValid untouched (still blocks persistence because IsCurrentRecordValid checks ErrorMessage, not IsValid).
- Typos preserved in identifiers: `IntermeditaryType/Id`, `BulidingTypeFilter`, `Earhquake_EX`, `PriorPolicyPerodPremiumi_EX`, `ClaculateRateModification`, `AppendAdditonalInsured/Org`, message text `"Lattitude"`.
- PolicyType and PolicyStage both hold `"NEWBUSINESSINDIVIDUAL"`.
- Two disabled nodes remain inside CreateorUpdateHBISRiskInformationsNew3 (old mortgage + LastStep update calls).
- The final quote update sets LastStep=1 via HB_UpdateQuote_CS even though PolicyStruct.LastStep was set to 4 earlier (and risk info uses 2.3).

---

*Method note: captured element-by-element from Service Studio 11 (properties pane, aggregate editor, expression editor) in read-only fashion. Cross-module internals for Submissions, HudsonBailey, IE_Policy_CS, IERatingEngine, RiskLocations, BulkUpload were documented at their call signatures; their producer modules can be opened the same way for the next level of depth if required.*
