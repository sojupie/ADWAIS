namespace Adwais.Application.DTOs.Monitoring.Upstream;

public record UptimeRobotMonitorDto(
    int Id,
    string FriendlyName,
    string Url,
    string Status,
    DateTimeOffset CreatedDate,
    int UpdateInterval,
    List<string> Tags);

