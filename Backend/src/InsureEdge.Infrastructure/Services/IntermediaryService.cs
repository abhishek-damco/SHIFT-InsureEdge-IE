// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
using InsureEdge.Application.DTOs.Distribution;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Services;

public class IntermediaryService(InsureEdgeDbContext db, ICurrentTenantService tenant)
{
    public async Task<List<IntermediaryListItemDto>> GetListAsync()
        => await db.Intermediaries
            .Where(i => i.ClientId == tenant.ClientId)
            .OrderByDescending(i => i.CreatedOn)
            .Select(i => new IntermediaryListItemDto(
                i.Id, i.IntermediaryCode, i.IntermediaryName, i.TypeOfIntermediary,
                i.FederalTaxId, i.ResidentialState, i.Status, i.CreatedOn, i.UpdatedOn))
            .ToListAsync();

    public async Task<IntermediaryDetailDto?> GetByIdAsync(long id)
    {
        var i = await db.Intermediaries.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        return i == null ? null : Map(i);
    }

    public async Task<IntermediaryDetailDto> CreateAsync(SaveIntermediaryRequest req)
    {
        var intermediary = new Intermediary
        {
            ClientId = tenant.ClientId,
            IntermediaryCode = await NextCodeAsync(),
            Status = req.Status ?? "Active",
            StatusToggle = req.StatusToggle ?? true,
            IntermediaryName = req.IntermediaryName ?? "Unnamed Intermediary",
            DoingBusinessAs = req.DoingBusinessAs,
            LegalEntity = req.LegalEntity ?? "LLC",
            FederalTaxId = req.FederalTaxId,
            TypeOfIntermediary = req.TypeOfIntermediary,
            Country = req.Country,
            ResidentialState = req.ResidentialState,
            License = req.License,
            OtherDescription = req.OtherDescription,
            AllowFullProducerVisibility = req.AllowFullProducerVisibility,
            CommissionDisburseEmail = req.CommissionDisburseEmail,
            LastStep = req.LastStep,
            CreatedBy = tenant.UserId,
        };
        db.Intermediaries.Add(intermediary);
        await db.SaveChangesAsync();
        return Map(intermediary);
    }

    public async Task<IntermediaryDetailDto?> UpdateAsync(long id, SaveIntermediaryRequest req)
    {
        var i = await db.Intermediaries.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        if (i == null) return null;

        if (req.Status != null) i.Status = req.Status;
        if (req.StatusToggle.HasValue) i.StatusToggle = req.StatusToggle;
        if (req.IntermediaryName != null) i.IntermediaryName = req.IntermediaryName;
        i.DoingBusinessAs = req.DoingBusinessAs;
        if (req.LegalEntity != null) i.LegalEntity = req.LegalEntity;
        i.FederalTaxId = req.FederalTaxId;
        i.TypeOfIntermediary = req.TypeOfIntermediary;
        i.Country = req.Country;
        i.ResidentialState = req.ResidentialState;
        i.License = req.License;
        i.OtherDescription = req.OtherDescription;
        i.AllowFullProducerVisibility = req.AllowFullProducerVisibility;
        i.CommissionDisburseEmail = req.CommissionDisburseEmail;
        if (req.LastStep.HasValue) i.LastStep = req.LastStep;
        i.UpdatedBy = tenant.UserId;
        i.UpdatedOn = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Map(i);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var i = await db.Intermediaries.FirstOrDefaultAsync(x => x.Id == id && x.ClientId == tenant.ClientId);
        if (i == null) return false;
        db.Intermediaries.Remove(i);
        await db.SaveChangesAsync();
        return true;
    }

    // BR-001-style sequential code, mirrors GroupService's zero-padded pattern.
    private async Task<string> NextCodeAsync()
    {
        var count = await db.Intermediaries.CountAsync(i => i.ClientId == tenant.ClientId);
        return (count + 1).ToString("D5");
    }

    private static IntermediaryDetailDto Map(Intermediary i) => new(
        i.Id, i.IntermediaryCode, i.Status, i.StatusToggle, i.IntermediaryName, i.DoingBusinessAs,
        i.LegalEntity, i.FederalTaxId, i.TypeOfIntermediary, i.Country, i.ResidentialState,
        i.License, i.OtherDescription, i.AllowFullProducerVisibility, i.LastStep, i.CommissionDisburseEmail);
}
