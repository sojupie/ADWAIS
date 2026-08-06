using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public record CreateTenantRequestDto
{
    public string Name { get; init; } = string.Empty;
    public TenantType Type { get; init; } = TenantType.Mixed;
    public required string OrderProvider { get; init; }
    public Dictionary<string, string?>? OrderProviderSettings { get; init; }
    public string? ImageUrl { get; init; }
    public bool OrderFetchingEnabled { get; init; } = false;
}

