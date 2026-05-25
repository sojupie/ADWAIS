using Api.DTOs.Monitoring;

namespace Api.DTOs.Tenants;

public class TenantResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LitiumBaseUrl { get; set; } = string.Empty;
    public bool CurrentlyFetching { get; set; }
    public DateTimeOffset? FetchedFrom { get; set; }
    public DateTimeOffset? FetchedUntil { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool OrderFetchingEnabled { get; set; }
    public int MonitorCount { get; set; }
    public string? LastSyncError { get; set; }
}
