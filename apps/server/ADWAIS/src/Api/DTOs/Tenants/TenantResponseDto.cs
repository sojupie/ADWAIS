using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public class TenantResponseDto
{
    public TenantId Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public TenantType Type { get; set; }
    public string LitiumBaseUrl { get; set; } = string.Empty;
    public bool CurrentlyFetching { get; set; }
    public DateTimeOffset? FetchedFrom { get; set; }
    public DateTimeOffset? FetchedUntil { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool OrderFetchingEnabled { get; set; }
    public int MonitorCount { get; set; }
    public string? LastSyncError { get; set; }
    public bool HasServiceAccountToken { get; set; }
}


