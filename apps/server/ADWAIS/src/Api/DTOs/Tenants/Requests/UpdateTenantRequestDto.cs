using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public record UpdateTenantRequestDto
{
    public string? Name { get; init; }
    public TenantType? Type { get; init; }
    public string? OrderProvider { get; init; }
    public Dictionary<string, string?>? OrderProviderSettings { get; init; }
    public string? ImageUrl { get; init; }
    public bool? OrderFetchingEnabled { get; init; }
}

