// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// BulkUploadRepository — implements IBulkUploadRepository against bulk_upload_audit.
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class BulkUploadRepository : IBulkUploadRepository
{
    private readonly InsureEdgeDbContext _db;

    public BulkUploadRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<BulkUploadAudit> CreateAuditAsync(long clientId, long userId, string module, string fileName, int totalRecords)
    {
        var audit = new BulkUploadAudit
        {
            ClientId = clientId,
            Module = module,
            FileName = fileName,
            TotalRecords = totalRecords,
            ProcessedRecords = 0,
            Status = "Processing",
            CreatedBy = userId,
            CreatedOn = DateTime.UtcNow,
        };
        _db.BulkUploadAudits.Add(audit);
        await _db.SaveChangesAsync();
        return audit;
    }

    public async Task UpdateAuditAsync(long clientId, long auditId, int processedRecords, string status, byte[]? errorFile)
    {
        var audit = await _db.BulkUploadAudits.FirstOrDefaultAsync(a => a.Id == auditId && a.ClientId == clientId);
        if (audit == null) return;
        audit.ProcessedRecords = processedRecords;
        audit.Status = status;
        audit.ErrorFile = errorFile;
        audit.UpdatedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<List<BulkUploadAuditDto>> GetHistoryAsync(long clientId, string module)
    {
        return await _db.BulkUploadAudits
            .Where(a => a.ClientId == clientId && a.Module == module)
            .OrderByDescending(a => a.CreatedOn)
            .Select(a => new BulkUploadAuditDto(
                a.Id, a.Module, a.FileName, a.TotalRecords, a.ProcessedRecords,
                a.Status, a.ErrorFile != null, a.CreatedOn))
            .ToListAsync();
    }

    public Task<BulkUploadAudit?> GetByIdAsync(long clientId, long auditId)
        => _db.BulkUploadAudits.FirstOrDefaultAsync(a => a.Id == auditId && a.ClientId == clientId);
}
