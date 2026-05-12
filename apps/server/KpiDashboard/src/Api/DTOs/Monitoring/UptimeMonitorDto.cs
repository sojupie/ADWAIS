namespace Api.DTOs.Monitoring;

public record UptimeMonitorDto(
    int Id, 
    Guid TenantId, 
    string Name, 
    string Url, 
    double? UptimeSla, 
    bool UptimeMonitorEnabled, 
    string CurrentStatus, 
    double CurrentUptimePercentage);