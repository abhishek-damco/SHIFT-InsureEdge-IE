namespace InsureEdge.Application.DTOs.Configuration;

public record ConfigurationListItemDto(long Id, string TableName, string LastModifiedDate, string LastModifiedBy);

public class ConfigurationValueExportRow
{
    public string? ConfigurationValue { get; set; }
    public bool Enabled { get; set; }
    public bool IsDefault { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}

public record ConfigurationValueDetailDto(
    long Id,
    string? Value,
    bool Enabled,
    bool IsDefault,
    string EffectiveFrom,
    string EffectiveTo
);

public record ConfigurationDetailDto(
    long Id,
    string TableName,
    string LastModifiedDate,
    string LastModifiedBy,
    int TotalValues,
    int Page,
    int PageSize,
    List<ConfigurationValueDetailDto> Values
);

public record ConfigurationValueSaveDto(
    long? Id,
    string? Value,
    bool? Enabled,
    bool? IsDefault,
    string? EffectiveFrom,
    string? EffectiveTo
);

public record ConfigurationSaveRequestDto(List<ConfigurationValueSaveDto> Values);
