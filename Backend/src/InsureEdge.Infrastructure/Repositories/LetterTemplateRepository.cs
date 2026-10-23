using InsureEdge.Application.DTOs.LetterTemplate;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class LetterTemplateRepository : ILetterTemplateRepository
{
    private readonly InsureEdgeDbContext _db;

    public LetterTemplateRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<List<LetterTemplateListItemDto>> GetListAsync(long clientId, string? search)
    {
        var query = _db.LetterTemplates.Where(t => t.ClientId == clientId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(t =>
                (t.TemplateName != null && t.TemplateName.ToLower().Contains(lower)) ||
                (t.TemplateCode != null && t.TemplateCode.ToLower().Contains(lower)) ||
                (t.TemplateCategory != null && t.TemplateCategory.ToLower().Contains(lower)) ||
                (t.LineOfBusiness != null && t.LineOfBusiness.ToLower().Contains(lower)));
        }

        var templates = await query.OrderByDescending(t => t.Id).ToListAsync();
        var templateIds = templates.Select(t => t.Id).ToList();

        var today = DateOnly.FromDateTime(DateTime.Today);

        var effectiveDocs = await _db.LetterTemplateDocuments
            .Where(d => templateIds.Contains(d.TemplateId)
                        && d.EffectiveStartDate <= today
                        && d.EffectiveEndDate >= today)
            .ToListAsync();

        var docMap = effectiveDocs
            .GroupBy(d => d.TemplateId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(d => d.Id).First());

        return templates.Select(t =>
        {
            docMap.TryGetValue(t.Id, out var doc);
            return new LetterTemplateListItemDto(
                t.Id,
                t.TemplateCode ?? "-",
                t.TemplateName ?? "-",
                t.TemplateCategory ?? "-",
                t.LineOfBusiness ?? "-",
                doc?.Version ?? "-",
                doc?.EffectiveStartDate.HasValue == true ? doc.EffectiveStartDate.Value.ToString("MM-dd-yyyy") : "-",
                doc?.EffectiveEndDate.HasValue == true ? doc.EffectiveEndDate.Value.ToString("MM-dd-yyyy") : "-"
            );
        }).ToList();
    }

    public async Task<string> GetNextCodeAsync(long clientId)
    {
        var codes = await _db.LetterTemplates
            .Where(t => t.ClientId == clientId && t.TemplateCode != null)
            .Select(t => t.TemplateCode!)
            .ToListAsync();

        int maxNum = 0;
        foreach (var code in codes)
        {
            var parts = code.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out int num))
                maxNum = Math.Max(maxNum, num);
        }

        return $"CL-HB-{(maxNum + 1):D3}";
    }

    public async Task<LetterTemplateDetailDto?> GetByIdAsync(long clientId, long id)
    {
        var template = await _db.LetterTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.ClientId == clientId);

        if (template == null) return null;

        var states = await _db.LetterTemplateStates
            .Where(s => s.TemplateId == id)
            .Select(s => s.State ?? "")
            .ToListAsync();

        var docs = await _db.LetterTemplateDocuments
            .Where(d => d.TemplateId == id)
            .OrderByDescending(d => d.Id)
            .Select(d => new LetterTemplateDocumentDetailDto(
                d.Id,
                d.DocumentName,
                d.DocumentContent,
                d.Version,
                d.EffectiveStartDate.HasValue ? d.EffectiveStartDate.Value.ToString("yyyy-MM-dd") : null,
                d.EffectiveEndDate.HasValue ? d.EffectiveEndDate.Value.ToString("yyyy-MM-dd") : null
            ))
            .ToListAsync();

        return new LetterTemplateDetailDto(
            template.Id,
            template.TemplateCode ?? "",
            template.Status == "Active",
            template.CurrentVersion ?? "0.0",
            template.TemplateName ?? "",
            template.TemplateCategory,
            template.LineOfBusiness,
            template.InsuranceType,
            template.SubjectLine,
            template.Description,
            states,
            docs
        );
    }

    public async Task UpdateAsync(long clientId, long userId, long id, UpdateTemplateRequestDto request)
    {
        var template = await _db.LetterTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.ClientId == clientId)
            ?? throw new KeyNotFoundException($"Template {id} not found.");

        var now = DateTimeOffset.UtcNow;

        template.TemplateName = request.TemplateName;
        template.Status = request.Active ? "Active" : "Inactive";
        template.TemplateCategory = request.TemplateCategory;
        template.SubjectLine = request.SubjectLine;
        template.Description = request.Description;
        template.UpdatedBy = userId;
        template.UpdatedOn = now;

        var oldStates = await _db.LetterTemplateStates.Where(s => s.TemplateId == id).ToListAsync();
        _db.LetterTemplateStates.RemoveRange(oldStates);
        foreach (var state in request.States)
            _db.LetterTemplateStates.Add(new LetterTemplateState { TemplateId = id, State = state });

        var docsToRemove = await _db.LetterTemplateDocuments
            .Where(d => d.TemplateId == id && !request.KeepDocumentIds.Contains(d.Id))
            .ToListAsync();
        _db.LetterTemplateDocuments.RemoveRange(docsToRemove);

        foreach (var doc in request.NewDocuments)
        {
            DateOnly? startDate = null, endDate = null;
            if (DateOnly.TryParse(doc.EffectiveStartDate, out var sd)) startDate = sd;
            if (DateOnly.TryParse(doc.EffectiveEndDate, out var ed)) endDate = ed;

            _db.LetterTemplateDocuments.Add(new LetterTemplateDocument
            {
                TemplateId = id,
                DocumentName = doc.DocumentName,
                DocumentFile = doc.DocumentFile,
                DocumentContent = doc.DocumentContent,
                Version = doc.Version,
                EffectiveStartDate = startDate,
                EffectiveEndDate = endDate,
                CreatedBy = userId,
                CreatedOn = now,
                UpdatedBy = userId,
                UpdatedOn = now,
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task<long> CreateAsync(long clientId, long userId, CreateTemplateRequestDto request)
    {
        var code = await GetNextCodeAsync(clientId);
        var now = DateTimeOffset.UtcNow;

        var template = new LetterTemplate
        {
            ClientId = clientId,
            TemplateCode = code,
            Status = request.Active ? "Active" : "Inactive",
            CurrentVersion = "0.0",
            TemplateName = request.TemplateName,
            TemplateCategory = request.TemplateCategory,
            LineOfBusiness = request.LineOfBusiness ?? "E&S Homeowners",
            InsuranceType = request.InsuranceType ?? "Speciality Lines",
            SubjectLine = request.SubjectLine,
            Description = request.Description,
            CreatedBy = userId,
            CreatedOn = now,
            UpdatedBy = userId,
            UpdatedOn = now,
        };

        _db.LetterTemplates.Add(template);
        await _db.SaveChangesAsync();

        foreach (var state in request.States)
        {
            _db.LetterTemplateStates.Add(new LetterTemplateState
            {
                TemplateId = template.Id,
                State = state
            });
        }

        foreach (var doc in request.Documents)
        {
            DateOnly? startDate = null, endDate = null;
            if (DateOnly.TryParse(doc.EffectiveStartDate, out var sd)) startDate = sd;
            if (DateOnly.TryParse(doc.EffectiveEndDate, out var ed)) endDate = ed;

            _db.LetterTemplateDocuments.Add(new LetterTemplateDocument
            {
                TemplateId = template.Id,
                DocumentName = doc.DocumentName,
                DocumentFile = doc.DocumentFile,
                DocumentContent = doc.DocumentContent,
                Version = doc.Version,
                EffectiveStartDate = startDate,
                EffectiveEndDate = endDate,
                CreatedBy = userId,
                CreatedOn = now,
                UpdatedBy = userId,
                UpdatedOn = now,
            });
        }

        await _db.SaveChangesAsync();
        return template.Id;
    }
}
