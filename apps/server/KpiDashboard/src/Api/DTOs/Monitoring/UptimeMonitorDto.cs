namespace Api.DTOs.Monitoring;

public record UptimeMonitorDto(
    int Id, 
    Guid TenantId, 
    string Name, 
    string Url, 
    int UpdateInterval,
    double? UptimeSla, 
    bool UptimeMonitorEnabled, 
    string CurrentStatus, 
    DateTimeOffset? LastUpdate,
    DateTimeOffset? LastUptimeUpdate,
    DateTimeOffset? LastLatencyUpdate,
    DateTimeOffset CreatedDate);