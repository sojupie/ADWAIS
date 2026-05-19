namespace Infrastructure.Services.Monitoring.DTOs;

public record UptimeRobotMonitorDto(
    int Id,
    string FriendlyName,
    string Url,
    string Status,
    DateTimeOffset CreatedDate,
    int UpdateInterval);