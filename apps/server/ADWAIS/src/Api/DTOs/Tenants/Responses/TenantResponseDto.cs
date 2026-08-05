using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public record TenantResponseDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public TenantType Type { get; init; }
    public string? LitiumBaseUrl { get; init; }
    public string OrderProvider { get; init; } = string.Empty;
    public string? ImageUrl { get; init; }
    public bool CurrentlyFetching { get; init; }
    public DateTimeOffset? FetchedFrom { get; init; }
    public DateTimeOffset? FetchedUntil { get; init; }
    public DateTimeOffset? LastPolled { get; init; }
    public bool OrderFetchingEnabled { get; init; }
    public int MonitorCount { get; init; }
    public string? LastSyncError { get; init; }
    public bool HasServiceAccountToken { get; init; }
}


