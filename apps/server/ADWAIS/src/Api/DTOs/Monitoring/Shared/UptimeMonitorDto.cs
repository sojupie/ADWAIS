namespace Adwais.Api.DTOs.Monitoring;

public record UptimeMonitorDto(
    int Id, 
    Guid TenantId,
    string? TenantName,
    string Name, 
    string Url, 
    int UpdateInterval,
    int? LatencyDegradedFloor,
    double? UptimeSla,
    double? CurrentUptimePercentage,
    double? CurrentLatency,
    bool UptimeMonitorEnabled, 
    string CurrentStatus, 
    DateTimeOffset? LastUpdate,
    DateTimeOffset? LastUptimeUpdate,
    DateTimeOffset? LastLatencyUpdate,
    DateTimeOffset CreatedDate,
    string? LastSyncError,
    List<string> Tags);


