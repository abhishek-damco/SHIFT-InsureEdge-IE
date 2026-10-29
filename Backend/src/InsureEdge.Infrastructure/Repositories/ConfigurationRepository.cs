using InsureEdge.Application.DTOs.Configuration;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class ConfigurationRepository : IConfigurationRepository
{
    private readonly InsureEdgeDbContext _db;

    public ConfigurationRepository(InsureEdgeDbContext db) => _db = db;

    public async Task<List<ConfigurationListItemDto>> GetListAsync(long clientId, string? search)
    {
        var query = _db.Configurations
            .Include(c => c.UpdatedByUser)
            .Where(c => c.ClientId == clientId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(c => c.ConfigurationName.ToLower().Contains(lower));
        }

        var list = await query.OrderByDescending(c => c.UpdatedOn).ToListAsync();

        return list.Select(c => new ConfigurationListItemDto(
            c.Id,
            c.ConfigurationName,
            c.UpdatedOn.HasValue ? c.UpdatedOn.Value.ToString("MM-dd-yyyy") : "-",
            c.UpdatedByUser != null ? $"{c.UpdatedByUser.FirstName} {c.UpdatedByUser.LastName}".Trim() : "-"
        )).ToList();
    }

    public async Task<List<ConfigurationValueExportRow>> GetValuesForExportAsync(long id, long clientId)
    {
        var exists = await _db.Configurations.AnyAsync(c => c.Id == id && c.ClientId == clientId);
        if (!exists) return [];

        return await _db.ConfigurationValues
            .Where(v => v.ConfigurationId == id)
            .Select(v => new ConfigurationValueExportRow
            {
                ConfigurationValue = v.Value,
                Enabled = v.Enabled,
                IsDefault = v.IsDefault,
                EffectiveFrom = v.EffectiveFrom,
                EffectiveTo = v.EffectiveTo,
            })
            .ToListAsync();
    }

    public async Task<ConfigurationDetailDto?> GetDetailAsync(long id, long clientId, string? search, int page, int pageSize)
    {
        var config = await _db.Configurations
            .Include(c => c.UpdatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id && c.ClientId == clientId);

        if (config == null) return null;

        var valuesQuery = _db.ConfigurationValues.Where(v => v.ConfigurationId == id);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            valuesQuery = valuesQuery.Where(v => v.Value != null && v.Value.ToLower().Contains(lower));
        }

        var total = await valuesQuery.CountAsync();
        var values = await valuesQuery
            .OrderBy(v => v.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = values.Select(v => new ConfigurationValueDetailDto(
            v.Id,
            v.Value,
            v.Enabled,
            v.IsDefault,
            v.EffectiveFrom.HasValue ? v.EffectiveFrom.Value.ToString("MM-dd-yyyy") : "-",
            v.EffectiveTo.HasValue ? v.EffectiveTo.Value.ToString("MM-dd-yyyy") : "-"
        )).ToList();

        return new ConfigurationDetailDto(
            config.Id,
            config.ConfigurationName,
            config.UpdatedOn.HasValue ? config.UpdatedOn.Value.ToString("MM-dd-yyyy") : "-",
            config.UpdatedByUser != null ? $"{config.UpdatedByUser.FirstName} {config.UpdatedByUser.LastName}".Trim() : "-",
            total,
            page,
            pageSize,
            dtos
        );
    }

    public async Task<bool> SaveAsync(long id, long clientId, long userId, ConfigurationSaveRequestDto request)
    {
        var config = await _db.Configurations
            .Include(c => c.Values)
            .FirstOrDefaultAsync(c => c.Id == id && c.ClientId == clientId);

        if (config == null) return false;

        var existingValues = config.Values.ToList();
        var incomingIds = request.Values
            .Where(v => v.Id.HasValue && v.Id > 0)
            .Select(v => v.Id!.Value)
            .ToHashSet();

        // Delete rows not present in incoming list
        foreach (var ev in existingValues.Where(ev => !incomingIds.Contains(ev.Id)))
            _db.ConfigurationValues.Remove(ev);

        foreach (var dto in request.Values)
        {
            DateOnly? from = null;
            DateOnly? to = null;
            if (!string.IsNullOrWhiteSpace(dto.EffectiveFrom) && DateOnly.TryParse(dto.EffectiveFrom, out var parsedFrom))
                from = parsedFrom;
            if (!string.IsNullOrWhiteSpace(dto.EffectiveTo) && DateOnly.TryParse(dto.EffectiveTo, out var parsedTo))
                to = parsedTo;

            if (dto.Id.HasValue && dto.Id > 0)
            {
                var existing = existingValues.FirstOrDefault(e => e.Id == dto.Id);
                if (existing != null)
                {
                    existing.Value = dto.Value;
                    existing.Enabled = dto.Enabled ?? true;
                    existing.IsDefault = dto.IsDefault ?? false;
                    existing.EffectiveFrom = from;
                    existing.EffectiveTo = to;
                }
            }
            else
            {
                _db.ConfigurationValues.Add(new ConfigurationValue
                {
                    ConfigurationId = id,
                    Value = dto.Value,
                    Enabled = dto.Enabled ?? true,
                    IsDefault = dto.IsDefault ?? false,
                    EffectiveFrom = from,
                    EffectiveTo = to,
                });
            }
        }

        config.UpdatedBy = userId;
        config.UpdatedOn = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }
}
