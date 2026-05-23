namespace Infrastructure.Services.Monitoring.UpstreamDTOs;

public record UptimeRobotMonitorDto(
    int Id,
    string FriendlyName,
    string Url,
    string Status,
    DateTimeOffset CreatedDate,
    int UpdateInterval);