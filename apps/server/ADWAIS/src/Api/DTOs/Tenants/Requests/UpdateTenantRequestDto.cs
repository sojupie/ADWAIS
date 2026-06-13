using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public record UpdateTenantRequestDto
{
    public string? Name { get; init; }
    public TenantType? Type { get; init; }
    public string? LitiumBaseUrl { get; init; }
    public string? ServiceAccountToken { get; init; }
    public bool? OrderFetchingEnabled { get; init; }
}

