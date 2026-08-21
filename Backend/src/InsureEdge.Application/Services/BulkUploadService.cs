// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload (Quotes & Policies) service — creates a submission per parsed Excel
// row (reusing ISubmissionRepository.CreateAsync, the same code path as
// POST /api/submissions), tracks progress in bulk_upload_audit, and builds an
// error CSV for rows that failed.
//
// Column layout matches the real "E&S Homeowners Insurance Products Upload
// Template" (156 data columns, provided under /Input) — see BulkUploadColumns
// for the authoritative index map. Rows are read positionally (not by header
// name) because several headers repeat verbatim across sections (e.g. "First
// Name" appears once for the primary insured and once per additional named
// insured block), so a name-keyed dictionary would silently collide.
//
// Scope (first pass): columns 0-45 (primary insured, mailing + risk address,
// coverage limits, insured contact, building info) are validated and mapped
// into the submission's "form" JSON — the same blob SubmissionRepository
// already syncs onto Policy/Account/PolicyLimitCoverage. Columns 46-84
// (mortgagees x2) are mapped into a "locations"/"mortgages" array alongside
// "form" — NewSubmission.tsx's Risk > Location and Risk Information screens
// read those top-level keys, not anything inside "form". Columns 85+
// (additional named insureds x4, additional organizations x4) are mapped into
// "additionalInsureds"/"additionalOrgs" arrays (wizard Policy Information step
// reads those top-level keys) and synced into additional_insured /
// additional_organisation by SubmissionRepository.
using System.Text;
using System.Text.Json;
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class BulkUploadService
{
    public const string QuotesPoliciesModule = "QUOTES_POLICIES";

    private readonly IBulkUploadRepository _auditRepo;
    private readonly ISubmissionRepository _submissionRepo;
    private readonly ICurrentTenantService _tenant;
    private readonly RatingService _ratingService;

    public BulkUploadService(IBulkUploadRepository auditRepo, ISubmissionRepository submissionRepo, ICurrentTenantService tenant, RatingService ratingService)
    {
        _auditRepo = auditRepo;
        _submissionRepo = submissionRepo;
        _tenant = tenant;
        _ratingService = ratingService;
    }

    public Task<List<BulkUploadAuditDto>> GetHistoryAsync(string module = QuotesPoliciesModule)
        => _auditRepo.GetHistoryAsync(_tenant.ClientId, module);

    public async Task<byte[]?> GetErrorReportAsync(long auditId)
    {
        var audit = await _auditRepo.GetByIdAsync(_tenant.ClientId, auditId);
        return audit?.ErrorFile;
    }

    /// <summary>
    /// Processes parsed Excel rows: creates one Draft submission per row via
    /// ISubmissionRepository.CreateAsync, tracks per-row failures, and persists
    /// the final audit row (status + processed count + optional error CSV).
    /// </summary>
    public async Task<BulkUploadResultDto> ProcessAsync(string fileName, List<string?[]> rows, string module = QuotesPoliciesModule)
    {
        long clientId;
        long userId;
        try
        {
            clientId = _tenant.ClientId;
            userId = _tenant.UserId;
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new InvalidOperationException($"Cannot process bulk upload: {ex.Message}", ex);
        }

        var audit = await _auditRepo.CreateAuditAsync(clientId, userId, module, fileName, rows.Count);

        var successCount = 0;
        var errors = new List<(int RowNumber, string Reason)>();

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + BulkUploadColumns.DataStartRow; // 3 header rows precede the data
            var row = rows[i];
            try
            {
                var form = BuildSubmissionForm(row, _ratingService);
                var locations = BuildLocations(form);
                var mortgages = BuildMortgages(row);
                var additionalInsureds = BuildAdditionalInsureds(row);
                var additionalOrgs = BuildAdditionalOrgs(row);
                var dataJson = JsonSerializer.Serialize(new { form, locations, mortgages, additionalInsureds, additionalOrgs });
                await _submissionRepo.CreateAsync(clientId, userId, new CreateSubmissionRequest(dataJson));
                successCount++;
            }
            catch (Exception ex)
            {
                errors.Add((rowNumber, ex.Message));
            }

            await _auditRepo.UpdateAuditAsync(clientId, audit.Id, i + 1, "Processing", null);
        }

        var failureCount = errors.Count;
        string status = failureCount == 0
            ? "Completed"
            : successCount == 0
                ? "Failed"
                : "CompletedWithErrors";

        byte[]? errorFile = failureCount > 0 ? BuildErrorCsv(errors) : null;
        await _auditRepo.UpdateAuditAsync(clientId, audit.Id, rows.Count, status, errorFile);

        return new BulkUploadResultDto(audit.Id, rows.Count, successCount, failureCount, status);
    }

    private static Dictionary<string, object?> BuildSubmissionForm(string?[] row, RatingService ratingService)
    {
        string? Get(int col) => col < row.Length ? Norm(row[col]) : null;

        var typeOfPrimaryInsured = Get(BulkUploadColumns.TypeOfPrimaryInsured);
        var isIndividual = string.Equals(typeOfPrimaryInsured, "Individual", StringComparison.OrdinalIgnoreCase)
            || string.Equals(typeOfPrimaryInsured, "Sole Proprietorship", StringComparison.OrdinalIgnoreCase);

        var firstName = Get(BulkUploadColumns.FirstName);
        var lastName = Get(BulkUploadColumns.LastName);
        var organizationName = Get(BulkUploadColumns.OrganizationName);
        var addressSameAsMailing = Get(BulkUploadColumns.AddressSameAsMailing);

        // Mandatory (every row)
        if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.EffectiveDate)))
            throw new InvalidOperationException("Effective Date is required.");
        if (string.IsNullOrWhiteSpace(typeOfPrimaryInsured))
            throw new InvalidOperationException("Type of Primary Insured is required.");
        if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.MailAddressLine1)))
            throw new InvalidOperationException("Address Line 1 is required.");
        if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.MailCity)))
            throw new InvalidOperationException("City is required.");
        if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.MailState)))
            throw new InvalidOperationException("State is required.");
        if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.MailZip)))
            throw new InvalidOperationException("Zip Code is required.");
        if (string.IsNullOrWhiteSpace(addressSameAsMailing))
            throw new InvalidOperationException("Address same as Mailing Address is required.");

        // Conditional — only mandatory given the value of another column (per template's
        // Instructions sheet: purple/"Conditional" columns depend on a sibling column).
        if (isIndividual)
        {
            if (string.IsNullOrWhiteSpace(firstName))
                throw new InvalidOperationException("First Name is required when Type of Primary Insured is Individual or Sole Proprietorship.");
            if (string.IsNullOrWhiteSpace(lastName))
                throw new InvalidOperationException("Last Name is required when Type of Primary Insured is Individual or Sole Proprietorship.");
        }
        else if (string.IsNullOrWhiteSpace(organizationName))
        {
            throw new InvalidOperationException("Organization Name is required when Type of Primary Insured is not Individual or Sole Proprietorship.");
        }

        var riskIsSame = string.Equals(addressSameAsMailing, "Yes", StringComparison.OrdinalIgnoreCase);
        if (!riskIsSame)
        {
            if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.RiskAddressLine1)))
                throw new InvalidOperationException("Risk Address Line 1 is required when Address same as Mailing Address is No.");
            if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.RiskCity)))
                throw new InvalidOperationException("Risk City is required when Address same as Mailing Address is No.");
            if (string.IsNullOrWhiteSpace(Get(BulkUploadColumns.RiskState)))
                throw new InvalidOperationException("Risk State is required when Address same as Mailing Address is No.");
        }

        // Coverage limits — Mandatory per template (columns Z..AM)
        foreach (var (col, label) in BulkUploadColumns.MandatoryCoverageColumns)
        {
            if (string.IsNullOrWhiteSpace(Get(col)))
                throw new InvalidOperationException($"{label} is required.");
        }

        // Keys below match NewSubmission.tsx's FormState field names exactly (not
        // invented names) — the manual quote wizard and bulk upload write into the
        // same submission "form" JSON blob, so a bulk-uploaded row has to speak the
        // same field vocabulary the wizard reads, or values silently fall back to
        // that screen's hardcoded demo defaults (dwellingLimit '4000000', deductible
        // '5,000', basePremium '9625', etc. — see NewSubmission.tsx's `defaultForm`).
        //
        // This app tracks a single address (the risk/property address, used for
        // rating and policy_product.state) rather than separate mailing + risk
        // addresses, so when "Address same as Mailing Address" = No, the risk
        // address columns win; otherwise the mailing address is used for both.
        var addrLine1 = riskIsSame ? Get(BulkUploadColumns.MailAddressLine1) : Get(BulkUploadColumns.RiskAddressLine1);
        var addrLine2 = riskIsSame ? Get(BulkUploadColumns.MailAddressLine2) : Get(BulkUploadColumns.RiskAddressLine2);
        var addrCity = riskIsSame ? Get(BulkUploadColumns.MailCity) : Get(BulkUploadColumns.RiskCity);
        var addrCounty = riskIsSame ? Get(BulkUploadColumns.MailCounty) : Get(BulkUploadColumns.RiskCounty);
        var addrState = riskIsSame ? Get(BulkUploadColumns.MailState) : Get(BulkUploadColumns.RiskState);
        var addrZip = riskIsSame ? Get(BulkUploadColumns.MailZip) : Get(BulkUploadColumns.RiskZip);
        var addrLongitude = riskIsSame ? Get(BulkUploadColumns.MailLongitude) : Get(BulkUploadColumns.RiskLongitude);
        var addrLatitude = riskIsSame ? Get(BulkUploadColumns.MailLatitude) : Get(BulkUploadColumns.RiskLatitude);

        // Calculate coverage limits based on Dwelling Limit (per PRD line 203-206)
        var dwellingLimitStr = FormatThousands(Get(BulkUploadColumns.DwellingAssetLimit));
        var dwellingLimit = decimal.TryParse(dwellingLimitStr?.Replace(",", ""), out var dl) ? dl : 0m;
        var appurtenantLimit = FormatThousands(((dwellingLimit * 0.10m).ToString("F0")));
        var personalAssetsLimit = FormatThousands(((dwellingLimit * 0.65m).ToString("F0")));
        var occupancyDisruptionLimit = FormatThousands(((dwellingLimit * 0.25m).ToString("F0")));
        var totalInsuredValues = FormatThousands(((dwellingLimit + (dwellingLimit * 0.10m)).ToString("F0")));

        var form = new Dictionary<string, object?>
        {
            // Primary insured (synced onto Account/Policy by SubmissionRepository)
            ["insuredType"] = isIndividual ? "Individual" : "Business",
            ["firstName"] = firstName,
            ["middleName"] = Get(BulkUploadColumns.MiddleName),
            ["lastName"] = lastName,
            ["age65OrOlder"] = Get(BulkUploadColumns.Is65OrOlder),
            ["organizationName"] = organizationName,
            ["doingBusinessAs"] = Get(BulkUploadColumns.DoingBusinessAs),
            ["effectiveDate"] = Get(BulkUploadColumns.EffectiveDate),

            // This template is product-specific (E&S Homeowners) — there's no LOB/SubProduct
            // column because the whole file only ever creates that one product's submissions.
            ["lob"] = "E&S Homeowners",

            // Risk/property address (also used for policy_product.state)
            ["locationSameAsMailing"] = riskIsSame,
            ["country"] = "United States", // template has no Country column — US-only product
            ["addressLine1"] = addrLine1,
            ["addressLine2"] = addrLine2,
            ["city"] = addrCity,
            ["county"] = addrCounty,
            ["state"] = addrState,
            ["zip"] = addrZip,
            ["longitude"] = addrLongitude,
            ["latitude"] = addrLatitude,

            // Coverage limits (synced onto policy_limit_coverage). Deductible/Liability/
            // ExcessBlanket/Earthquake/Flood are looked up by RatingRepository as exact
            // comma-grouped strings (e.g. "10,000", "300,000") — see its DeductibleAdjustment
            // and CoveragePremiums tables — so raw Excel numbers ("10000") have to be
            // reformatted here or the rater silently treats them as unmatched/zero.
            ["dwellingLimit"] = dwellingLimitStr,
            ["appurtenantLimit"] = appurtenantLimit,
            ["personalAssetsLimit"] = personalAssetsLimit,
            ["occupancyDisruptionLimit"] = occupancyDisruptionLimit,
            ["totalInsuredValues"] = totalInsuredValues,
            ["deductible"] = FormatThousands(Get(BulkUploadColumns.PhysicalDamageDeductible)),
            ["liabilityAmount"] = FormatThousands(Get(BulkUploadColumns.LiabilityCoverage)),
            ["excessBlanketLiabilities"] = FormatThousands(Get(BulkUploadColumns.ExcessBlanketPl)),
            ["sinkhole"] = Get(BulkUploadColumns.Sinkhole),
            ["earthquake"] = FormatThousands(Get(BulkUploadColumns.Earthquake)),
            ["flood"] = FormatThousands(Get(BulkUploadColumns.Flood)),
            ["windHail"] = Get(BulkUploadColumns.WindHail),
            ["wildfire"] = Get(BulkUploadColumns.WildFire),
            ["resWorkerMedical"] = Get(BulkUploadColumns.ResidentWorkerNfm),
            ["farmingEndorsement"] = Get(BulkUploadColumns.SmallScaleFarmingEndorsement),
            ["landlordEndorsement"] = Get(BulkUploadColumns.LandlordEndorsement),
            ["homeOfficeEndorsement"] = Get(BulkUploadColumns.HomeOfficeEndorsement),
            ["priorPolicyPremium"] = Get(BulkUploadColumns.PriorPolicyPremium),

            // Insured contact + building info
            ["phone"] = Get(BulkUploadColumns.TelephoneNumber),
            ["extension"] = Get(BulkUploadColumns.Extension),
            ["altPhone"] = Get(BulkUploadColumns.AltTelephoneNumber),
            ["email"] = Get(BulkUploadColumns.Email),
            ["buildingFloodElevation"] = Get(BulkUploadColumns.BuildingFloodElevation),
            ["buildingType"] = Get(BulkUploadColumns.BuildingType),
            ["buildingDescription"] = Get(BulkUploadColumns.BuildingDescription),
            ["isBulkUploaded"] = true,
        };

        // Call Rater to calculate premiums (default to Basic plan for bulk upload) and populate premium fields
        try
        {
            var ratingForm = new HbisPlanComparisonForm(
                ScreenCode: "NEWBUSINESSINDIVIDUAL",
                PolicyType: "NEWBUSINESS",
                Deductible: form["deductible"] as string,
                CoverageLevel: "Basic",
                SelectedPlan: "Basic",
                LiabilityAmount: form["liabilityAmount"] as string,
                ExcessBlanketLiabilities: form["excessBlanketLiabilities"] as string,
                Sinkhole: form["sinkhole"] as string,
                Earthquake: form["earthquake"] as string,
                Flood: form["flood"] as string,
                WindHail: form["windHail"] as string,
                Wildfire: form["wildfire"] as string,
                ResWorkerMedical: form["resWorkerMedical"] as string,
                FarmingEndorsement: form["farmingEndorsement"] as string,
                LandlordEndorsement: form["landlordEndorsement"] as string,
                HomeOfficeEndorsement: form["homeOfficeEndorsement"] as string,
                PolicyFee: "195",
                PriorPolicyPremium: form["priorPolicyPremium"] as string,
                RateModification: "0",
                DwellingLimit: form["dwellingLimit"]?.ToString(),
                AppurtenantLimit: form["appurtenantLimit"]?.ToString(),
                PersonalAssetsLimit: form["personalAssetsLimit"]?.ToString(),
                OccupancyDisruptionLimit: form["occupancyDisruptionLimit"]?.ToString(),
                TotalInsuredValues: form["totalInsuredValues"]?.ToString(),
                IsHBProducer: false,
                LockSubmission: false,
                IsQuickQuote: true,
                BuildingFloodElevation: form["buildingFloodElevation"] as string,
                BuildingType: form["buildingType"] as string,
                BuildingDescription: form["buildingDescription"] as string,
                Latitude: form["latitude"] as string,
                Longitude: form["longitude"] as string
            );

            var ratingResult = ratingService.CalculatePlanComparison(ratingForm);
            Console.WriteLine($"=== RATER FALLBACK OUTPUT ===");
            Console.WriteLine($"Plans Count: {ratingResult?.Plans?.Count ?? 0}");
            if (ratingResult?.Plans?.Count > 0)
            {
                var basicPlan = ratingResult.Plans.FirstOrDefault();
                Console.WriteLine($"BasicPlan BasePremium: {basicPlan?.BasePremium}");
                Console.WriteLine($"BasicPlan RatingOutput.BasePremium: {basicPlan?.RatingOutput?.BasePremium}");

                if (basicPlan?.RatingOutput != null)
                {
                    form["basePremium"] = basicPlan.RatingOutput.BasePremium;
                    form["rateModification"] = basicPlan.RatingOutput.BasePremium * 1m; // RateModification = BasicCoveragePremium * RateModificationFactor
                    form["wildfirePremium"] = basicPlan.RatingOutput.WildfirePremium;
                    form["windPremium"] = basicPlan.RatingOutput.WindPremium;
                    form["sinkholePremium"] = basicPlan.RatingOutput.SinkholePremium;
                    form["excessScheduleBlanketPremium"] = basicPlan.RatingOutput.ExcessScheduleBlanketCoveredPL;
                    form["earthquakePremium"] = basicPlan.RatingOutput.EarthquakePremium;
                    form["floodPremium"] = basicPlan.RatingOutput.FloodPremium;
                    form["residentWorkerNFPremium"] = basicPlan.RatingOutput.ResidentWorkerNFPremium;
                    form["smallScaleFarmingPremium"] = basicPlan.RatingOutput.SmallScaleFarmingEndorsementPremium;
                    form["landlordEndorsementPremium"] = basicPlan.RatingOutput.LandEndorsementPremium;
                    form["homeOfficeEndorsementPremium"] = basicPlan.RatingOutput.HomeOfficeEndorsementPremium;
                    form["policyFee"] = basicPlan.RatingOutput.PolicyFee;
                    Console.WriteLine($"Form basePremium set to: {form["basePremium"]}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Rater calculation failed: {ex.Message}");
            Console.WriteLine($"Exception: {ex}");
        }

        return form;
    }

    // Mirrors NewSubmission.tsx's mailingLocation() — the "Risk > Location" screen reads
    // the top-level "locations" array, not "form", so the resolved risk address has to be
    // duplicated here or the screen shows "No Data Available" despite the address existing.
    private static List<Dictionary<string, object?>> BuildLocations(Dictionary<string, object?> form) =>
        new()
        {
            new Dictionary<string, object?>
            {
                ["id"] = 1,
                ["addressLine1"] = form["addressLine1"],
                ["addressLine2"] = form["addressLine2"],
                ["country"] = form["country"],
                ["state"] = form["state"],
                ["city"] = form["city"],
                ["county"] = form["county"],
                ["zip"] = form["zip"],
                ["latitude"] = form["latitude"],
                ["longitude"] = form["longitude"],
            },
        };

    // Mortgagee 1/2 (columns AU-CG) — the "Risk Information" screen's Mortgage Information
    // table reads the top-level "mortgages" array. Mortgagee 1 is included whenever a name
    // is present; Mortgagee 2 only when "Secondary Mortgagee?" = Yes.
    // Additional named insureds ×4 (columns 85..120). Field names match the wizard's
    // AdditionalInsuredItem interface exactly so the Policy Information screen renders
    // them without translation; SubmissionRepository also syncs these into the
    // additional_insured table.
    private static List<Dictionary<string, object?>> BuildAdditionalInsureds(string?[] row)
    {
        string? Get(int col) => col < row.Length ? Norm(row[col]) : null;
        var items = new List<Dictionary<string, object?>>();

        for (var n = 0; n < BulkUploadColumns.AdditionalInsuredCount; n++)
        {
            var b = BulkUploadColumns.AdditionalInsuredsStart + n * BulkUploadColumns.AdditionalInsuredBlockSize;
            var firstName = Get(b);
            var middleName = Get(b + 1);
            var lastName = Get(b + 2);
            var insuredType = Get(b + 3);
            var relationship = Get(b + 4);
            var telephone = Get(b + 5);
            var altTelephone = Get(b + 6);
            var email = Get(b + 7);
            var dbaName = Get(b + 8);

            // Skip fully blank blocks (template always carries 4 slots).
            if (new[] { firstName, middleName, lastName, insuredType, relationship, telephone, altTelephone, email, dbaName }
                .All(string.IsNullOrWhiteSpace)) continue;

            items.Add(new Dictionary<string, object?>
            {
                ["id"] = n + 1,
                ["firstName"] = firstName ?? "",
                ["middleName"] = middleName ?? "",
                ["lastName"] = lastName ?? "",
                ["insuredType"] = insuredType ?? "",
                ["relationship"] = relationship ?? "",
                ["telephone"] = telephone ?? "",
                ["altTelephone"] = altTelephone ?? "",
                ["email"] = email ?? "",
                ["dbaName"] = dbaName ?? "",
                ["isManual"] = false,
            });
        }
        return items;
    }

    // Additional organizations ×4 (columns 121..156). Field names match the wizard's
    // AdditionalOrgItem interface; synced into additional_organisation by the repository.
    private static List<Dictionary<string, object?>> BuildAdditionalOrgs(string?[] row)
    {
        string? Get(int col) => col < row.Length ? Norm(row[col]) : null;
        var items = new List<Dictionary<string, object?>>();

        for (var n = 0; n < BulkUploadColumns.AdditionalOrgCount; n++)
        {
            var b = BulkUploadColumns.AdditionalOrgsStart + n * BulkUploadColumns.AdditionalOrgBlockSize;
            var orgName = Get(b);
            var orgType = Get(b + 1);
            var telephone = Get(b + 2);
            var extension = Get(b + 3);
            var altTelephone = Get(b + 4);
            var email = Get(b + 5);
            var contactFirstName = Get(b + 6);
            var contactMiddleName = Get(b + 7);
            var contactLastName = Get(b + 8);

            if (new[] { orgName, orgType, telephone, extension, altTelephone, email, contactFirstName, contactMiddleName, contactLastName }
                .All(string.IsNullOrWhiteSpace)) continue;

            items.Add(new Dictionary<string, object?>
            {
                ["id"] = n + 1,
                ["orgName"] = orgName ?? "",
                ["orgType"] = orgType ?? "",
                ["telephone"] = telephone ?? "",
                ["extension"] = extension ?? "",
                ["altTelephone"] = altTelephone ?? "",
                ["email"] = email ?? "",
                ["contactFirstName"] = contactFirstName ?? "",
                ["contactMiddleName"] = contactMiddleName ?? "",
                ["contactLastName"] = contactLastName ?? "",
                ["isManual"] = false,
            });
        }
        return items;
    }

    private static List<Dictionary<string, object?>> BuildMortgages(string?[] row)
    {
        string? Get(int col) => col < row.Length ? Norm(row[col]) : null;
        var mortgages = new List<Dictionary<string, object?>>();

        Dictionary<string, object?> MortgageEntry(int id, int name, int loanNumber, int serviceCompany,
            int clientId, int lenderType, int loanType, int coveredAsset, int addressLine1, int addressLine2,
            int city, int county, int state, int zip, int longitude, int latitude, int telephone, int extension,
            int altTelephone, int email) => new()
        {
            ["id"] = id,
            ["name"] = Get(name),
            ["loanNumber"] = Get(loanNumber),
            ["mortgageServiceCompany"] = Get(serviceCompany),
            ["telephone"] = Get(telephone),
            ["extension"] = Get(extension),
            ["altTelephone"] = Get(altTelephone),
            ["phoneCountry"] = "United States +1",
            ["altPhoneCountry"] = "United States +1",
            ["googleAddress"] = "",
            ["manualAddress"] = true,
            ["clientId"] = Get(clientId),
            ["lenderType"] = Get(lenderType),
            ["loanType"] = Get(loanType),
            ["coveredAsset"] = Get(coveredAsset),
            ["email"] = Get(email),
            ["addressLine1"] = Get(addressLine1),
            ["addressLine2"] = Get(addressLine2),
            ["country"] = "United States",
            ["state"] = Get(state),
            ["city"] = Get(city),
            ["county"] = Get(county),
            ["zip"] = Get(zip),
            ["latitude"] = Get(latitude),
            ["longitude"] = Get(longitude),
        };

        if (!string.IsNullOrWhiteSpace(Get(BulkUploadColumns.Mortgage1Name)))
        {
            mortgages.Add(MortgageEntry(1,
                BulkUploadColumns.Mortgage1Name, BulkUploadColumns.Mortgage1LoanNumber, BulkUploadColumns.Mortgage1ServiceCompany,
                BulkUploadColumns.Mortgage1ClientId, BulkUploadColumns.Mortgage1LenderType, BulkUploadColumns.Mortgage1LoanType,
                BulkUploadColumns.Mortgage1CoveredAsset, BulkUploadColumns.Mortgage1AddressLine1, BulkUploadColumns.Mortgage1AddressLine2,
                BulkUploadColumns.Mortgage1City, BulkUploadColumns.Mortgage1County, BulkUploadColumns.Mortgage1State,
                BulkUploadColumns.Mortgage1Zip, BulkUploadColumns.Mortgage1Longitude, BulkUploadColumns.Mortgage1Latitude,
                BulkUploadColumns.Mortgage1Telephone, BulkUploadColumns.Mortgage1Extension, BulkUploadColumns.Mortgage1AltTelephone,
                BulkUploadColumns.Mortgage1Email));
        }

        var hasSecondaryMortgagee = string.Equals(Get(BulkUploadColumns.SecondaryMortgageeFlag), "Yes", StringComparison.OrdinalIgnoreCase);
        if (hasSecondaryMortgagee && !string.IsNullOrWhiteSpace(Get(BulkUploadColumns.Mortgage2Name)))
        {
            mortgages.Add(MortgageEntry(2,
                BulkUploadColumns.Mortgage2Name, BulkUploadColumns.Mortgage2LoanNumber, BulkUploadColumns.Mortgage2ServiceCompany,
                BulkUploadColumns.Mortgage2ClientId, BulkUploadColumns.Mortgage2LenderType, BulkUploadColumns.Mortgage2LoanType,
                BulkUploadColumns.Mortgage2CoveredAsset, BulkUploadColumns.Mortgage2AddressLine1, BulkUploadColumns.Mortgage2AddressLine2,
                BulkUploadColumns.Mortgage2City, BulkUploadColumns.Mortgage2County, BulkUploadColumns.Mortgage2State,
                BulkUploadColumns.Mortgage2Zip, BulkUploadColumns.Mortgage2Longitude, BulkUploadColumns.Mortgage2Latitude,
                BulkUploadColumns.Mortgage2Telephone, BulkUploadColumns.Mortgage2Extension, BulkUploadColumns.Mortgage2AltTelephone,
                BulkUploadColumns.Mortgage2Email));
        }

        return mortgages;
    }

    private static string? Norm(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    // Reformats a plain number ("10000") into the comma-grouped string ("10,000") the
    // rating engine's lookup tables key on. Non-numeric values (e.g. "No Coverage") pass
    // through unchanged.
    private static string? FormatThousands(string? value)
    {
        var trimmed = Norm(value);
        if (trimmed == null) return null;
        // InvariantCulture: the wizard dropdowns and rater lookup tables key on US
        // grouping ("500,000"); the machine locale here is en-IN, whose default
        // grouping would emit "5,00,000" and silently match nothing.
        var cleaned = trimmed.Replace(",", "");
        return decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var n)
            ? n.ToString("#,##0", System.Globalization.CultureInfo.InvariantCulture)
            : trimmed;
    }

    private static byte[] BuildErrorCsv(List<(int RowNumber, string Reason)> errors)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Row,Error");
        foreach (var (rowNumber, reason) in errors)
            sb.AppendLine($"{rowNumber},\"{reason.Replace("\"", "\"\"")}\"");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
