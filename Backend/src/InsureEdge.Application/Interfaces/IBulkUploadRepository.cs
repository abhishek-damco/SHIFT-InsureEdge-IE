// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload audit/history persistence — mirrors ISubmissionRepository's pattern
// (tenant-scoped, DTOs in/out).
using InsureEdge.Application.DTOs.QuotesPolicies;
using InsureEdge.Domain.Entities;

namespace InsureEdge.Application.Interfaces;

public interface IBulkUploadRepository
{
    Task<BulkUploadAudit> CreateAuditAsync(long clientId, long userId, string module, string fileName, int totalRecords);
    Task UpdateAuditAsync(long clientId, long auditId, int processedRecords, string status, byte[]? errorFile);
    Task<List<BulkUploadAuditDto>> GetHistoryAsync(long clientId, string module);
    Task<BulkUploadAudit?> GetByIdAsync(long clientId, long auditId);
}
