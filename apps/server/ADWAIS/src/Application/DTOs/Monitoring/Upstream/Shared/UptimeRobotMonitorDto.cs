namespace Adwais.Application.DTOs.Monitoring.Upstream;

public record UptimeRobotMonitorDto(
    int Id,
    string Type,
    string FriendlyName,
    string Url,
    string Status,
    DateTimeOffset CreatedDate,
    int UpdateInterval,
    List<string> Tags,
    string? HttpMethod = null,
    int? TimeoutSeconds = null,
    DateTimeOffset? SslExpiresAt = null,
    DateTimeOffset? DomainExpiresAt = null,
    List<string>? MonitoredRegions = null,
    long? CurrentStateDurationSeconds = null,
    UptimeRobotIncidentDto? LastIncident = null);

public sealed record UptimeRobotIncidentDto(
    string? Id,
    string? Status,
    string? Cause,
    string? Reason,
    DateTimeOffset? StartedAt,
    long? DurationSeconds);

