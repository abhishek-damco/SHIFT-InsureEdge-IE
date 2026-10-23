using InsureEdge.Application.DTOs.Claim;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Services;

public class WorksheetService(InsureEdgeDbContext db)
{
    private static WorksheetDto ToDto(ClaimWorksheet ws) =>
        new(
            ws.Id,
            ws.WsNumber,
            ws.Status,
            ws.CloseManually,
            ws.Comments,
            Incurred: ws.Reserves.Sum(r => r.ReserveAmount) + ws.Payments.Sum(p => p.PaymentAmount),
            Reserve: ws.Reserves.Sum(r => r.ReserveAmount),
            PersonalLiabilities: ws.Reserves
                .Where(r => r.Coverage != null && r.Coverage.Contains("Personal", StringComparison.OrdinalIgnoreCase))
                .Sum(r => r.ReserveAmount),
            Payment: ws.Payments.Sum(p => p.PaymentAmount),
            ApprovedByName: ws.ApprovedByUser == null ? null : ws.ApprovedByUser.FirstName + " " + ws.ApprovedByUser.LastName,
            EscalatedToName: ws.EscalatedToUser == null ? null : ws.EscalatedToUser.FirstName + " " + ws.EscalatedToUser.LastName,
            CreatedByName: ws.CreatedByUser == null ? "-" : ws.CreatedByUser.FirstName + " " + ws.CreatedByUser.LastName,
            CreatedOn: ws.CreatedOn.ToString("MM-dd-yyyy"),
            UpdatedByName: ws.UpdatedByUser == null ? null : ws.UpdatedByUser.FirstName + " " + ws.UpdatedByUser.LastName,
            UpdatedOn: ws.UpdatedOn?.ToString("MM-dd-yyyy"),
            Reserves: ws.Reserves.Select(r => new WorksheetReserveDto(r.Id, r.Coverage, r.CoverageLimit, r.CauseOfLossDescription, r.CauseOfLossCode, r.CauseOfLossLimit, r.LiabilityClaimDescription, r.LiabilityClaimCode, r.LiabilityLimit, r.SupersedingLimit, r.ReserveAmount)).ToList(),
            Payments: ws.Payments.Select(p => new WorksheetPaymentDto(p.Id, p.Coverage, p.CauseOfLossDescription, p.PayeeType, p.PayeeName, p.LiabilityClaim, p.PaymentAmount)).ToList()
        );

    private IQueryable<ClaimWorksheet> WithIncludes() =>
        db.Worksheets
            .Include(w => w.Reserves)
            .Include(w => w.Payments)
            .Include(w => w.ApprovedByUser)
            .Include(w => w.EscalatedToUser)
            .Include(w => w.CreatedByUser)
            .Include(w => w.UpdatedByUser);

    public async Task<WorksheetMatrixDto> GetMatrixAsync(long claimId, long clientId)
    {
        var worksheets = await WithIncludes()
            .Where(w => w.ClaimId == claimId && w.ClientId == clientId)
            .OrderBy(w => w.CreatedOn)
            .ToListAsync();
        return new WorksheetMatrixDto(worksheets.Select(ToDto).ToList());
    }

    public async Task<WorksheetDto?> GetWorksheetAsync(long worksheetId, long clientId)
    {
        var ws = await WithIncludes().FirstOrDefaultAsync(w => w.Id == worksheetId && w.ClientId == clientId);
        return ws == null ? null : ToDto(ws);
    }

    public async Task<WorksheetDto> SaveAsync(long claimId, long clientId, long userId, SaveWorksheetRequest req)
    {
        var newReserves = req.Reserves.Select(r => new WorksheetReserve
        {
            ClientId = clientId,
            Coverage = r.Coverage,
            CoverageLimit = r.CoverageLimit,
            CauseOfLossDescription = r.CauseOfLossDescription,
            CauseOfLossCode = r.CauseOfLossCode,
            CauseOfLossLimit = r.CauseOfLossLimit,
            LiabilityClaimDescription = r.LiabilityClaimDescription,
            LiabilityClaimCode = r.LiabilityClaimCode,
            LiabilityLimit = r.LiabilityLimit,
            SupersedingLimit = r.SupersedingLimit,
            ReserveAmount = r.ReserveAmount,
        }).ToList();
        var newPayments = req.Payments.Select(p => new WorksheetPayment
        {
            ClientId = clientId,
            Coverage = p.Coverage,
            CauseOfLossDescription = p.CauseOfLossDescription,
            PayeeType = p.PayeeType,
            PayeeName = p.PayeeName,
            LiabilityClaim = p.LiabilityClaim,
            PaymentAmount = p.PaymentAmount,
        }).ToList();

        ClaimWorksheet ws;
        if (req.Id.HasValue)
        {
            ws = await WithIncludes().FirstOrDefaultAsync(w => w.Id == req.Id.Value && w.ClientId == clientId)
                ?? throw new KeyNotFoundException("Worksheet not found.");
            ws.UpdatedBy = userId;
            ws.UpdatedOn = DateTimeOffset.UtcNow;
            ws.CloseManually = req.CloseManually;
            ws.Comments = req.Comments;
            db.WorksheetReserves.RemoveRange(ws.Reserves);
            db.WorksheetPayments.RemoveRange(ws.Payments);
            foreach (var r in newReserves) { r.WorksheetId = ws.Id; db.WorksheetReserves.Add(r); }
            foreach (var p in newPayments) { p.WorksheetId = ws.Id; db.WorksheetPayments.Add(p); }
        }
        else
        {
            var seq = await db.Database.SqlQueryRaw<long>("SELECT nextval('ws_number_seq') AS \"Value\"").FirstAsync();
            ws = new ClaimWorksheet
            {
                ClaimId = claimId,
                ClientId = clientId,
                WsNumber = seq.ToString().PadLeft(9, '0'),
                Status = "Draft",
                CloseManually = req.CloseManually,
                Comments = req.Comments,
                CreatedBy = userId,
                CreatedOn = DateTimeOffset.UtcNow,
                Reserves = newReserves,
                Payments = newPayments,
            };
            db.Worksheets.Add(ws);
        }

        await db.SaveChangesAsync();
        var saved = await WithIncludes().FirstAsync(w => w.Id == ws.Id);
        return ToDto(saved);
    }

    public async Task<WorksheetDto> ApproveAsync(long worksheetId, long clientId, long userId)
    {
        var ws = await WithIncludes().FirstOrDefaultAsync(w => w.Id == worksheetId && w.ClientId == clientId)
            ?? throw new KeyNotFoundException("Worksheet not found.");
        ws.Status = "Approved";
        ws.ApprovedBy = userId;
        ws.UpdatedBy = userId;
        ws.UpdatedOn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(await WithIncludes().FirstAsync(w => w.Id == ws.Id));
    }

    public async Task<WorksheetDto> DenyAsync(long worksheetId, long clientId, long userId)
    {
        var ws = await WithIncludes().FirstOrDefaultAsync(w => w.Id == worksheetId && w.ClientId == clientId)
            ?? throw new KeyNotFoundException("Worksheet not found.");
        ws.Status = "Denied";
        ws.UpdatedBy = userId;
        ws.UpdatedOn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(await WithIncludes().FirstAsync(w => w.Id == ws.Id));
    }

    public async Task<WorksheetDto> EscalateAsync(long worksheetId, long escalateTo, long clientId, long userId)
    {
        var ws = await WithIncludes().FirstOrDefaultAsync(w => w.Id == worksheetId && w.ClientId == clientId)
            ?? throw new KeyNotFoundException("Worksheet not found.");
        ws.Status = "Escalated";
        ws.EscalatedTo = escalateTo;
        ws.UpdatedBy = userId;
        ws.UpdatedOn = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(await WithIncludes().FirstAsync(w => w.Id == ws.Id));
    }
}
